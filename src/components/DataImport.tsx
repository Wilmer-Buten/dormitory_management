"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "../store/useStore";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  TableIcon,
  ChevronDown,
  UserIcon,
  ChevronUp,
  FileDown,
  Trash2,
} from "lucide-react";
import { read, utils, writeFile } from "xlsx";
import toast, { Toaster } from "react-hot-toast";
import type { PreviewData } from "../types";
import ModalComponent from "./ModalComponent";

const MAX_STUDENTS_PER_ROOM = 2;
const VALID_ROOM_LETTERS = ["A", "B", "C", "D"];

const normalizeLetter = (letter: unknown) =>
  letter == null || String(letter).trim() === ""
    ? ""
    : String(letter).trim().toUpperCase();

const normalizeSuite = (value: unknown) => {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  const raw = String(value).trim();
  if (!raw) return "";
  const num = Number(raw);
  if (!Number.isNaN(num) && Number.isFinite(num)) return String(Math.trunc(num));
  return raw;
};

const normalizeExcelRow = (row: Record<string, any>) => {
  const headerMap: Record<string, string> = {
    name: "Name",
    lastname: "Lastname",
    "last name": "Lastname",
    last_name: "Lastname",
    id: "ID",
    studentid: "ID",
    "student id": "ID",
    student_id: "ID",
    building: "Building",
    suite: "Suite",
    room: "Room",
  };
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const mapped = headerMap[String(key).trim().toLowerCase()] || String(key).trim();
    normalized[mapped] = value;
  }
  return {
    Name: normalized.Name != null ? String(normalized.Name).trim() : "",
    Lastname: normalized.Lastname != null ? String(normalized.Lastname).trim() : "",
    ID:
      normalized.ID != null && String(normalized.ID).trim() !== ""
        ? String(normalized.ID).trim()
        : null,
    Building: normalized.Building != null ? String(normalized.Building).trim() : "",
    Suite: normalizeSuite(normalized.Suite),
    Room:
      normalized.Room != null && String(normalized.Room).trim() !== ""
        ? normalizeLetter(normalized.Room)
        : "",
  };
};

const rowFullName = (row: { Name?: string; Lastname?: string }) =>
  [row.Name, row.Lastname].filter(Boolean).join(" ").trim();

function DataImport() {
  const {
    getTranslation,
    importStudents,
    rooms,
    isLoading,
    currentUser,
    buildings,
    fetchBuildings,
    fetchRooms,
    accessToken,
  } = useStore();
  const t = getTranslation();

  useEffect(() => {
    fetchBuildings();
    fetchRooms();
  }, [fetchBuildings, fetchRooms]);

  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [matchingStudents, setMatchingStudents] = useState<any[]>([]);
  const [matchingNames, setMatchingNames] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentSelections, setStudentSelections] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const studentSelectionsRef = useRef(studentSelections);
  studentSelectionsRef.current = studentSelections;

  const processExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const sheetName = "Students";
      const sheet = workbook.Sheets[sheetName];

      if (!sheet) {
        toast.error(t.import.sheetMissing);
        return;
      }

      const rawRows = utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
      if (rawRows.length === 0) {
        toast.error(t.import.columnError);
        return;
      }

      const firstKeys = Object.keys(rawRows[0]).map((k) => String(k).trim().toLowerCase());
      const hasName = firstKeys.includes("name");
      const hasLastname = firstKeys.includes("lastname") || firstKeys.includes("last name") || firstKeys.includes("last_name");
      const hasBuilding = firstKeys.includes("building");
      const hasSuite = firstKeys.includes("suite");
      if (!hasName || !hasLastname || !hasBuilding || !hasSuite) {
        toast.error(t.import.columnError);
        return;
      }

      const currentUserBuilding = currentUser?.building_id
        ? buildings.find((b) => b.id === currentUser.building_id)?.name
        : null;

      const filteredRows = rawRows
        .map((row) => normalizeExcelRow(row))
        .filter((row) => row.Name || row.Lastname || row.Building || row.Suite || row.Room || row.ID)
        .filter((row) => {
          if (!row.Building) return true; // keep; row validator will flag it
          const userBuilding = currentUserBuilding?.toLowerCase() ?? null;
          if (!userBuilding || row.Building.toLowerCase() === userBuilding) return true;
          toast.error(`${t.import.ignoredRecord}: ${rowFullName(row) || "(no name)"}`);
          return false;
        });

      if (filteredRows.length === 0) {
        toast.error(t.import.noValidRows);
        return;
      }

      const headers = ["Name", "Lastname", "ID", "Building", "Suite", "Room"];
      setPreviewData([
        {
          sheet: sheetName,
          headers,
          rows: filteredRows.slice(0, 10),
          allRows: filteredRows,
          currentPage: 1,
          rowsPerPage: 10,
        },
      ]);
      setSelectedSheet(sheetName);
      setStudentSelections({});
      setExpandedRows({});
      setRowErrors({});
    } catch {
      toast.error(t.import.error);
    }
  };

  useEffect(() => {
    if (previewData.length > 0 && selectedSheet) {
      const selectedPreview = previewData.find((p) => p.sheet === selectedSheet);
      if (selectedPreview) {
        checkForMatches(selectedPreview.allRows, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData, selectedSheet]);

  // Re-validate when room catalog finishes loading (keep current radio selections).
  useEffect(() => {
    if (previewData.length > 0 && selectedSheet) {
      const selectedPreview = previewData.find((p) => p.sheet === selectedSheet);
      if (selectedPreview) {
        checkForMatches(selectedPreview.allRows, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, buildings]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processExcelFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    await importData();
  };

  const loadMoreRows = () => {
    setPreviewData((prevData) =>
      prevData.map((sheet) => {
        if (sheet.sheet === selectedSheet) {
          const nextPage = sheet.currentPage + 1;
          const endIndex = nextPage * sheet.rowsPerPage;
          return {
            ...sheet,
            currentPage: nextPage,
            rows: sheet.allRows.slice(0, endIndex),
          };
        }
        return sheet;
      })
    );
  };

  const getBuildingLayout = useCallback(
    (buildingName: string) =>
      buildings.find((b) => b.name.toLowerCase() === buildingName.toLowerCase())?.layout_type ?? null,
    [buildings]
  );

  const lettersMatch = (a: unknown, b: unknown) =>
    normalizeLetter(a) !== "" && normalizeLetter(a) === normalizeLetter(b);

  const findStoreRoom = useCallback(
    (buildingName: string, suiteOrRoom: string, roomLetter: string) => {
      const buildingLower = buildingName.toLowerCase();
      const layout = getBuildingLayout(buildingLower);
      if (!layout) return undefined;
      if (layout === "standalone") {
        return rooms.find(
          (room) =>
            room.building.toLowerCase() === buildingLower &&
            String(room.roomNumber ?? "") === suiteOrRoom
        );
      }
      return rooms.find(
        (room) =>
          room.building.toLowerCase() === buildingLower &&
          Number(room.suiteNumber) === Number(suiteOrRoom) &&
          lettersMatch(room.letter, roomLetter)
      );
    },
    [rooms, getBuildingLayout]
  );

  const standaloneRoomNumber = (row: any) =>
    normalizeSuite(row.Room) || normalizeSuite(row.Suite);

  const roomKeyForRow = (row: any) => {
    const buildingLower = String(row.Building || "").toLowerCase();
    const layout = getBuildingLayout(buildingLower);
    if (layout === "standalone") {
      return `${buildingLower}-${standaloneRoomNumber(row)}-`;
    }
    return `${buildingLower}-${normalizeSuite(row.Suite)}-${normalizeLetter(row.Room)}`;
  };

  const isYellowNameMatch = useCallback(
    (row: any, nameMatches: any[]) => {
      if (!row.Name || !row.Lastname) return false;
      const buildingLower = String(row.Building || "").toLowerCase();
      const isStandalone = getBuildingLayout(buildingLower) === "standalone";
      const suiteOrRoom = isStandalone ? standaloneRoomNumber(row) : normalizeSuite(row.Suite);
      const roomLetter = normalizeLetter(row.Room);
      return nameMatches.some((match) => {
        const matchStandalone = getBuildingLayout(String(match.Building || "")) === "standalone";
        const matchSuiteOrRoom = matchStandalone
          ? standaloneRoomNumber(match)
          : normalizeSuite(match.Suite);
        return (
          match.Name &&
          match.Lastname &&
          match.Name.toLowerCase() === row.Name.toLowerCase() &&
          match.Lastname.toLowerCase() === row.Lastname.toLowerCase() &&
          String(match.Building || "").toLowerCase() === buildingLower &&
          matchSuiteOrRoom === suiteOrRoom &&
          (isStandalone || normalizeLetter(match.Room) === roomLetter)
        );
      });
    },
    [getBuildingLayout]
  );

  const validateRows = useCallback(
    (data: any[], nameMatches: any[], selections: Record<string, string>) => {
      const errors: Record<number, string> = {};
      const uidFirstIndex = new Map<string, number>();
      const projectedOccupancy = new Map<string, number>();

      data.forEach((row, index) => {
        const buildingLower = String(row.Building || "").toLowerCase();
        const layout = buildingLower ? getBuildingLayout(buildingLower) : null;
        const isStandalone = layout === "standalone";
        const suiteOrRoom = isStandalone
          ? standaloneRoomNumber(row)
          : normalizeSuite(row.Suite);
        const roomLetter = isStandalone ? "" : normalizeLetter(row.Room);

        if (!row.Name) {
          errors[index] = t.import.rowErrors.nameRequired;
          return;
        }
        if (!row.Lastname) {
          errors[index] = t.import.rowErrors.lastnameRequired;
          return;
        }
        if (!buildingLower) {
          errors[index] = t.import.rowErrors.buildingRequired;
          return;
        }
        if (!layout) {
          errors[index] = t.import.rowErrors.buildingNotFound.replace("{building}", row.Building);
          return;
        }
        if (!suiteOrRoom) {
          errors[index] = isStandalone
            ? t.import.rowErrors.roomNumberRequired
            : t.import.rowErrors.suiteRequired;
          return;
        }
        if (isStandalone) {
          if (!/^\d{1,3}$/.test(suiteOrRoom)) {
            errors[index] = t.import.rowErrors.roomNumberRequired;
            return;
          }
        } else {
          if (!/^\d{1,3}$/.test(suiteOrRoom)) {
            errors[index] = t.import.rowErrors.suiteInvalid;
            return;
          }
          if (!roomLetter || !VALID_ROOM_LETTERS.includes(roomLetter)) {
            errors[index] = t.import.rowErrors.roomLetterInvalid;
            return;
          }
        }

        const storeRoom = findStoreRoom(buildingLower, suiteOrRoom, roomLetter);
        if (!storeRoom) {
          errors[index] = isStandalone
            ? t.import.rowErrors.roomNotFound
                .replace("{room}", suiteOrRoom)
                .replace("{building}", row.Building)
            : t.import.rowErrors.suiteRoomNotFound
                .replace("{suite}", suiteOrRoom)
                .replace("{room}", roomLetter)
                .replace("{building}", row.Building);
          return;
        }

        if (row.ID) {
          const uid = String(row.ID);
          if (uidFirstIndex.has(uid)) {
            errors[index] = t.import.rowErrors.duplicateIdInFile
              .replace("{id}", uid)
              .replace("{row}", String((uidFirstIndex.get(uid) ?? 0) + 1));
            return;
          }
          uidFirstIndex.set(uid, index);
        }

        if (isYellowNameMatch(row, nameMatches)) return;

        const key = roomKeyForRow(row);
        if (!projectedOccupancy.has(key)) {
          const activeCount = (storeRoom.students || []).filter((s) => s.id != null).length;
          projectedOccupancy.set(key, activeCount);
        }

        const selection = selections[`${key}-${index}`];
        const isOverwrite = selection && selection !== "-1";
        if (!isOverwrite) {
          const next = (projectedOccupancy.get(key) || 0) + 1;
          projectedOccupancy.set(key, next);
          if (next > MAX_STUDENTS_PER_ROOM) {
            errors[index] = t.import.rowErrors.roomCapacity
              .replace("{max}", String(MAX_STUDENTS_PER_ROOM));
          }
        }
      });

      return errors;
    },
    [findStoreRoom, getBuildingLayout, isYellowNameMatch, t.import.rowErrors]
  );

  const checkForMatches = (data: any[], resetSelections: boolean) => {
    const validRows = data.filter((row) => {
      const containsValidationRules = Object.values(row).some(
        (value) => typeof value === "string" && value.includes("VALIDATION RULES")
      );
      return !containsValidationRules;
    });

    const roomMatches = validRows.filter((row) => {
      const buildingLower = String(row.Building || "").toLowerCase();
      const isStandalone = getBuildingLayout(buildingLower) === "standalone";
      const suiteOrRoom = isStandalone
        ? standaloneRoomNumber(row)
        : normalizeSuite(row.Suite);
      const roomLetter = isStandalone ? "" : normalizeLetter(row.Room);
      const storeRoom = findStoreRoom(buildingLower, suiteOrRoom, roomLetter);
      if (!storeRoom?.students?.length) return false;
      return storeRoom.students.some((student) => student.id != null);
    });

    const nameMatches = validRows.filter((row) => {
      if (!row.Name || !row.Lastname) return false;
      const buildingLower = String(row.Building || "").toLowerCase();
      const isStandalone = getBuildingLayout(buildingLower) === "standalone";
      const suiteOrRoom = isStandalone
        ? standaloneRoomNumber(row)
        : normalizeSuite(row.Suite);
      const roomLetter = isStandalone ? "" : normalizeLetter(row.Room);
      return rooms.some(
        (room) =>
          room.students &&
          room.students.some(
            (student) =>
              student.name &&
              student.name.toLowerCase() === row.Name.toLowerCase() &&
              String(student.lastname || "").toLowerCase() === row.Lastname.toLowerCase() &&
              room.building.toLowerCase() === buildingLower &&
              (isStandalone
                ? String(room.roomNumber ?? "") === suiteOrRoom
                : Number(room.suiteNumber) === Number(suiteOrRoom) &&
                  lettersMatch(room.letter, roomLetter))
          )
      );
    });

    setMatchingStudents(roomMatches);
    setMatchingNames(nameMatches);

    let selectionsForValidation = studentSelectionsRef.current;

    if (resetSelections) {
      const initialSelections: Record<string, string> = {};
      const initialExpandedRows: Record<string, boolean> = {};

      const byRoom = new Map<string, number[]>();
      data.forEach((row, index) => {
        if (!roomMatches.includes(row)) return;
        if (isYellowNameMatch(row, nameMatches)) return;
        const key = roomKeyForRow(row);
        if (!byRoom.has(key)) byRoom.set(key, []);
        byRoom.get(key)!.push(index);
      });

      byRoom.forEach((indexes, roomKey) => {
        initialExpandedRows[roomKey] = true;
        const sample = data[indexes[0]];
        const sampleBuilding = String(sample.Building || "").toLowerCase();
        const sampleStandalone = getBuildingLayout(sampleBuilding) === "standalone";
        const storeRoom = findStoreRoom(
          sampleBuilding,
          sampleStandalone ? standaloneRoomNumber(sample) : normalizeSuite(sample.Suite),
          sampleStandalone ? "" : normalizeLetter(sample.Room)
        );
        const occupants = (storeRoom?.students || []).filter((s) => s.id != null);
        if (!occupants.length) return;

        indexes.forEach((rowIndex, slot) => {
          if (occupants.length === 1) {
            initialSelections[`${roomKey}-${rowIndex}`] = slot === 0 ? "-1" : occupants[0].id;
          } else {
            initialSelections[`${roomKey}-${rowIndex}`] =
              occupants[Math.min(slot, occupants.length - 1)].id;
          }
        });
      });

      setStudentSelections(initialSelections);
      studentSelectionsRef.current = initialSelections;
      setExpandedRows(initialExpandedRows);
      selectionsForValidation = initialSelections;
    }

    setRowErrors(validateRows(data, nameMatches, selectionsForValidation));
  };
  

  const toggleExpandedRow = useCallback(
    (roomKey: string) => {
  
      setExpandedRows((prev) => ({
        ...prev,
        [roomKey]: !prev[roomKey],
      }));
    },
    [expandedRows] 
  );

  const importData = useCallback(async () => {
    const selectedPreview = previewData.find((p) => p.sheet === selectedSheet);
    if (!selectedPreview) return;

    const errors = validateRows(selectedPreview.allRows, matchingNames, studentSelections);
    setRowErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(t.import.fixBeforeImport);
      return;
    }

    const filteredRows = selectedPreview.allRows.filter(
      (row) => !isYellowNameMatch(row, matchingNames)
    );

    if (filteredRows.length === 0) {
      toast.error(t.import.noRowsToImport);
      return;
    }

    try {
      await importStudents(filteredRows, studentSelections);
      setPreviewData([]);
      setSelectedSheet("");
      setShowConfirmModal(false);
      setStudentSelections({});
      setExpandedRows({});
      setRowErrors({});
      toast.success(t.import.success);
    } catch {
      // Error toast already shown by the store; keep preview so the user can fix and retry.
    }
  }, [
    previewData,
    selectedSheet,
    importStudents,
    t.import.success,
    t.import.fixBeforeImport,
    t.import.noRowsToImport,
    studentSelections,
    matchingNames,
    validateRows,
    isYellowNameMatch,
  ]);

  const handleCancelButton = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const getStudentsForRoom = useCallback(
    (building: string, suiteOrRoomNumber: string, roomLetter: string) => {
      const matchedRoom = findStoreRoom(
        building.trim().toLowerCase(),
        normalizeSuite(suiteOrRoomNumber),
        normalizeLetter(roomLetter)
      );
      return matchedRoom?.students.filter((student) => student.id !== null) || [];
    },
    [findStoreRoom]
  );

  const handleStudentSelection = useCallback(
    (roomKey: string, studentId: string, rowIndex: number) => {
      const [building, suite, room] = roomKey.split("-");
      const studentsInRoom = getStudentsForRoom(building, suite, room ?? "");
      if (studentsInRoom.length === 1) {
        studentsInRoom.push({
          id: "-1",
          name: "Empty slot",
          isPresent: null,
          inRoom: null,
        });
      }
      const otherStudentId: any = studentsInRoom.find(
        (student) => student.id !== studentId
      )?.id;

      const newSelections = { ...studentSelections };
      const exitingKeyRoom = Object.keys(newSelections).filter((key) =>
        key.startsWith(`${roomKey}`)
      );
      if (exitingKeyRoom.length === 2) {
        exitingKeyRoom.forEach((key) => {
          if (key.endsWith(rowIndex.toString())) {
            newSelections[key] = studentId;
          } else {
            newSelections[key] = otherStudentId;
          }
        });
      } else if (exitingKeyRoom[0]) {
        newSelections[exitingKeyRoom[0]] = studentId;
      } else {
        newSelections[`${roomKey}-${rowIndex}`] = studentId;
      }
      setStudentSelections(newSelections);

      const selectedPreview = previewData.find((p) => p.sheet === selectedSheet);
      if (selectedPreview) {
        setRowErrors(validateRows(selectedPreview.allRows, matchingNames, newSelections));
      }
    },
    [
      studentSelections,
      getStudentsForRoom,
      previewData,
      selectedSheet,
      matchingNames,
      validateRows,
    ]
  );

  const handleCancel = useCallback(() => {
    setPreviewData([]);
    setSelectedSheet("");
    setStudentSelections({});
    setExpandedRows({});
    setRowErrors({});
  }, []);

  const applyPreviewRows = useCallback(
    (nextAllRows: any[]) => {
      if (nextAllRows.length === 0) {
        setPreviewData([]);
        setSelectedSheet("");
        setStudentSelections({});
        setExpandedRows({});
        setRowErrors({});
        toast.success(t.import.allErrorRowsRemoved);
        return;
      }

      setPreviewData((prev) =>
        prev.map((sheet) => {
          if (sheet.sheet !== selectedSheet) return sheet;
          const rowsPerPage = sheet.rowsPerPage || 10;
          const visibleCount = Math.max(sheet.rows.length, rowsPerPage);
          return {
            ...sheet,
            allRows: nextAllRows,
            rows: nextAllRows.slice(0, Math.min(visibleCount, nextAllRows.length)),
            currentPage: Math.max(1, Math.ceil(Math.min(visibleCount, nextAllRows.length) / rowsPerPage)),
          };
        })
      );
      setStudentSelections({});
      setExpandedRows({});
    },
    [selectedSheet, t.import.allErrorRowsRemoved]
  );

  const removePreviewRow = useCallback(
    (rowIndex: number) => {
      const selected = previewData.find((p) => p.sheet === selectedSheet);
      if (!selected) return;
      const nextAllRows = selected.allRows.filter((_, index) => index !== rowIndex);
      applyPreviewRows(nextAllRows);
    },
    [previewData, selectedSheet, applyPreviewRows]
  );

  const removeAllErrorRows = useCallback(() => {
    const selected = previewData.find((p) => p.sheet === selectedSheet);
    if (!selected) return;
    const errorIndexes = new Set(Object.keys(rowErrors).map((key) => Number(key)));
    if (errorIndexes.size === 0) return;
    const nextAllRows = selected.allRows.filter((_, index) => !errorIndexes.has(index));
    applyPreviewRows(nextAllRows);
    if (nextAllRows.length > 0) {
      toast.success(
        t.import.errorRowsRemoved.replace("{count}", String(errorIndexes.size))
      );
    }
  }, [previewData, selectedSheet, rowErrors, applyPreviewRows, t.import.errorRowsRemoved]);

  const getTemplateExcel = useCallback(async () => {
    try {
      // Show loading toast
      toast.loading("Generating template...", { id: "download-template" });

  
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/excel/template",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch the template");
      }
      // Get the file as a blob
      const blob = await response.blob();
      return blob;
    } catch (error) {
      toast.error("Failed to download template", { id: "download-template" });
    }
  }, [accessToken])

  const downloadTemplateExcel = useCallback(async () => {
    try {
      // If API endpoint is available, use it
      if (import.meta.env.VITE_API_URL) {
        const blob = await getTemplateExcel();
        // Create a temporary URL for the blob
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          // Create a temporary link element to trigger the download
          const link = document.createElement("a");
          link.href = url;
          link.download = "student_import_template_with_validation.xlsx";
          document.body.appendChild(link);
          link.click();

          // Clean up
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Update toast to success
          toast.success("Template downloaded successfully!", {
            id: "download-template",
          });
        }
      } else {
        // Fallback to client-side generation if API is not available
        // Create a new workbook
        const workbook = utils.book_new();
        
        // Create sample data for the Students sheet
        const sampleData = [
          { Name: "John", Lastname: "Doe", ID: "10001", Building: "Edwards", Suite: 101, Room: "A" },
          { Name: "Jane", Lastname: "Smith", ID: "10002", Building: "Wade", Suite: 202, Room: "B" },
          { Name: "Alex", Lastname: "Johnson", ID: "10003", Building: "Holland", Suite: 303, Room: "C" },
          { Name: "Sam", Lastname: "Lee", ID: "10004", Building: "Peterson", Suite: "", Room: "101" },
        ];

        const worksheet = utils.json_to_sheet(sampleData);
        const columnWidths = [
          { wch: 14 }, // Name
          { wch: 14 }, // Lastname
          { wch: 12 }, // ID
          { wch: 14 }, // Building
          { wch: 10 }, // Suite
          { wch: 10 }, // Room
        ];
        
        worksheet['!cols'] = columnWidths;
        
        // Add the worksheet to the workbook
        utils.book_append_sheet(workbook, worksheet, "Students");
        
        // Write the workbook and trigger a download
        writeFile(workbook, "student_import_template.xlsx");
        
        toast.success("Template downloaded successfully!");
      }
    } catch (error) {
      toast.error("Failed to download template", { id: "download-template" });
    }
  }, [getTemplateExcel]); // Added getTemplateExcel dependency

  const selectedPreview = previewData.find((p) => p.sheet === selectedSheet);
  const hasMoreRows = selectedPreview
    ? selectedPreview.rows.length < selectedPreview.allRows.length
    : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-brand-200 animate-[spin_1.5s_linear_infinite]" />
          <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-[spin_1.2s_linear_infinite] absolute inset-0" />
          <div className="w-12 h-12 rounded-full border-4 border-transparent border-l-brand-300 animate-[spin_2s_linear_infinite] absolute inset-0" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />
      {/* <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t.import.title}</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1">{t.import.subtitle}</p>
      </div> */}
  
      {!previewData.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5 order-2 lg:order-1">
            <div className="card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">{t.import.instructions.title}</h2>
              <div className="space-y-4">
                <p className="text-slate-500 text-sm">{t.import.instructions.description}</p>
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-700 text-sm">{t.import.instructions.sheets}:</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-500 text-sm">
                    <li>{t.import.instructions.name}</li>
                    <li>{t.import.instructions.lastname}</li>
                    <li>{t.import.instructions.id}</li>
                    <li>{t.import.instructions.building}</li>
                    <li>{t.import.instructions.suite}</li>
                    <li>{t.import.instructions.room}</li>
                  </ul>
                </div>
              </div>
            </div>
  
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-brand-500 mt-0.5 shrink-0" size={20} />
                <div>
                  <h3 className="font-medium text-brand-800 mb-1 text-sm">{t.import.note.title}</h3>
                  <p className="text-brand-600 text-sm">{t.import.note.description}</p>
                </div>
              </div>
            </div>
  
            {/* Template Download Section */}
            <div className="card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">{t.import.template.title}</h2>
              <div className="space-y-4">
                <p className="text-slate-500 text-sm">
                  {t.import.template.description} 
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadTemplateExcel}
                    className="btn-secondary btn-md text-sm"
                  >
                    <FileDown size={18} />
                    {t.import.template.button}
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          <div
            className={`card p-6 sm:p-8 flex items-center justify-center order-1 lg:order-2 min-h-[16rem] transition-colors ${
              dragActive ? "border-2 border-dashed border-brand-400 bg-brand-50" : ""
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet size={30} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{t.import.dropzone.title}</h3>
              <p className="text-slate-500 text-sm mb-6">{t.import.dropzone.description}</p>
              <label className="btn-primary btn-md text-sm cursor-pointer inline-flex">
                <Upload size={18} />
                {t.import.dropzone.button}
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleChange}
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TableIcon className="text-slate-400 shrink-0" size={22} />
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{t.import.dataPreview.title}</h2>
                  <p className="text-sm text-slate-500">
                    Showing {selectedPreview?.rows.length} of {selectedPreview?.allRows.length} records
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="input text-sm w-full sm:w-auto"
                >
                  {previewData.map((preview) => (
                    <option key={preview.sheet} value={preview.sheet}>
                      {preview.sheet}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 mx-auto">
                  <button
                    onClick={handleCancel}
                    className="btn-secondary btn-md text-sm"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={Object.keys(rowErrors).length > 0}
                    className="btn-primary btn-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      Object.keys(rowErrors).length > 0
                        ? t.import.fixBeforeImport
                        : undefined
                    }
                  >
                    {t.import.importButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          {selectedPreview && (
            <>
              <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-2">
                {Object.keys(rowErrors).length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span>
                      {t.import.errorsFound.replace("{count}", String(Object.keys(rowErrors).length))}
                    </span>
                    <button
                      type="button"
                      onClick={removeAllErrorRows}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-100 text-xs font-medium shrink-0"
                    >
                      <Trash2 size={14} />
                      {t.import.removeAllErrorRows}
                    </button>
                  </div>
                )}
                <p className="text-sm text-slate-600 flex items-center">
                  <span className="inline-block w-3.5 h-3.5 rounded bg-red-300 mr-2"></span>
                  {t.import.dataPreview.legend.redLabel}
                </p>
                <p className="text-sm text-slate-600 flex items-center">
                  <span className="inline-block w-3.5 h-3.5 rounded bg-yellow-200 mr-2"></span>
                  {t.import.dataPreview.legend.yellowLabel}
                </p>
                <p className="text-sm text-slate-600 flex items-center">
                  <span className="inline-block w-3.5 h-3.5 rounded bg-orange-200 mr-2"></span>
                  {t.import.dataPreview.legend.errorLabel}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                      {selectedPreview.headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {selectedPreview.rows.map((row, rowIndex) => {
                      const buildingLower = row.Building ? row.Building.toString().toLowerCase() : "";
                      const layoutType = getBuildingLayout(buildingLower) ?? "suite";
                      const isStandalone = layoutType === "standalone";
                      const suiteOrRoomStr = isStandalone
                        ? standaloneRoomNumber(row)
                        : normalizeSuite(row.Suite);
                      const roomLetter = isStandalone ? "" : normalizeLetter(row.Room);
                      const rowError = rowErrors[rowIndex];

                      const isRoomMatching = matchingStudents.some((match) => {
                        const matchStandalone =
                          getBuildingLayout(String(match.Building || "")) === "standalone";
                        const matchSuiteOrRoom = matchStandalone
                          ? standaloneRoomNumber(match)
                          : normalizeSuite(match.Suite);
                        return (
                          matchSuiteOrRoom === suiteOrRoomStr &&
                          (isStandalone || normalizeLetter(match.Room) === roomLetter) &&
                          String(match.Building || "").toLowerCase() === buildingLower
                        );
                      });

                      const isNameMatching = isYellowNameMatch(row, matchingNames);

                      let rowClass = rowIndex % 2 === 0 ? "bg-slate-50" : "bg-white";
                      if (rowError) {
                        rowClass = "bg-orange-100";
                      } else if (isNameMatching) {
                        rowClass = "bg-yellow-200";
                      } else if (isRoomMatching) {
                        rowClass = "bg-red-300";
                      }

                      const roomKey = roomKeyForRow(row);

                      const studentsInRoom =
                        isRoomMatching && !isNameMatching && !rowError
                          ? getStudentsForRoom(buildingLower, suiteOrRoomStr, roomLetter)
                          : [];
                      return (
                        <>
                          <tr key={rowIndex} className={rowClass} title={rowError || undefined}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {rowError ? (
                                <div className="flex items-center gap-2 max-w-[18rem]">
                                  <span className="inline-flex items-center gap-1 text-orange-700 text-xs font-medium min-w-0">
                                    <AlertCircle size={14} className="shrink-0" />
                                    <span className="truncate">{rowError}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removePreviewRow(rowIndex)}
                                    className="shrink-0 inline-flex items-center justify-center p-1.5 rounded-lg text-orange-700 hover:bg-orange-200/80 transition-colors"
                                    title={t.import.removeErrorRow}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ) : (
                                isRoomMatching && studentsInRoom.length > 0 && (
                                  <button
                                    onClick={() => toggleExpandedRow(roomKey)}
                                    className="flex items-center justify-center gap-0.5 p-1.5 bg-brand-100 rounded-full hover:bg-brand-200 transition-colors"
                                    title="Current students in this room"
                                  >
                                    <UserIcon size={16} className="text-brand-600" />
                                    {expandedRows[roomKey] ? (
                                      <ChevronUp size={16} className="text-brand-600 transition-transform" />
                                    ) : (
                                      <ChevronDown size={16} className="text-brand-600 transition-transform" />
                                    )}
                                  </button>
                                )
                              )}
                            </td>
                            {selectedPreview.headers.map((header, colIndex) => {
                              let displayValue = row[header]?.toString() || "";
                              if (header === "Suite" && isStandalone) {
                                displayValue = "-";
                              }
                              return (
                                <td
                                  key={`${rowIndex}-${colIndex}`}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-slate-900"
                                >
                                  {displayValue}
                                </td>
                              );
                            })}
                          </tr>
                          {expandedRows[roomKey] && isRoomMatching && !isNameMatching && studentsInRoom.length > 0 && (
                            <tr className="bg-brand-50/60">
                              <td colSpan={selectedPreview.headers.length + 1} className="px-6 py-4">
                                <div className="pl-8 border-l-2 border-brand-300">
                                  <h4 className="font-medium text-brand-800 mb-2 text-sm">
                                    Current students in this room:
                                  </h4>
                                  <div className="space-y-2">
                                    {studentsInRoom.map((student) => (
                                      <div key={student.id} className="flex items-center gap-3">
                                        <input
                                          type="radio"
                                          id={`student-${roomKey}-${student.id}-${rowIndex}`}
                                          name={`room-${roomKey}-${rowIndex}`}
                                          value={student.id}
                                          onChange={() => {
                                            handleStudentSelection(roomKey, student.id, rowIndex);
                                          }}
                                          checked={studentSelections[`${roomKey}-${rowIndex}`] === student.id}
                                          className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                                        />
                                        <label
                                          htmlFor={`student-${roomKey}-${student.id}-${rowIndex}`}
                                          className="text-sm text-slate-700 flex items-center gap-2"
                                        >
                                          <UserIcon size={16} className="text-slate-500" />
                                          <span>
                                            {[student.name, student.lastname].filter(Boolean).join(" ")}
                                            {student.studentUid ? ` · ${student.studentUid}` : ""}
                                          </span>
                                          {studentSelections[`${roomKey}-${rowIndex}`] === student.id && (
                                            <span className="badge bg-brand-100 text-brand-800">
                                              Will be replaced
                                            </span>
                                          )}
                                        </label>
                                      </div>
                                    ))}
  
                                    {/* Agregar opción de "Espacio disponible" si solo hay un estudiante en la sala */}
                                    {studentsInRoom.length === 1 && (
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="radio"
                                          id={`empty-slot-${roomKey}-${rowIndex}`}
                                          name={`room-${roomKey}-${rowIndex}`}
                                          value={-1}
                                          onChange={() => {
                                            handleStudentSelection(roomKey, "-1", rowIndex);
                                          }}
                                          checked={studentSelections[`${roomKey}-${rowIndex}`] === "-1"}
                                          className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                                        />
                                        <label
                                          htmlFor={`empty-slot-${roomKey}-${rowIndex}`}
                                          className="text-sm text-slate-700 flex items-center gap-2"
                                        >
                                          <UserIcon size={16} className="text-slate-500" />
                                          <span className="text-xs text-slate-800">Empty slot</span>
                                          <span className="badge bg-yellow-100 text-yellow-800">
                                            Available slot!
                                          </span>
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-2">
                                    Select the student that will be replaced by the new import data.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
  
              {hasMoreRows && (
                <div className="p-4 border-t border-slate-100">
                  <button
                    onClick={loadMoreRows}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-brand-600 hover:bg-brand-50 rounded-xl transition-colors text-sm font-medium"
                  >
                    <ChevronDown size={18} />
                    Load More Records
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {showConfirmModal && (
        <ModalComponent
          title={t.import.confirm.title}
          description={matchingStudents.length + " " + t.import.confirm.description}
          confirmButtonText={t.import.confirm.confirmButton}
          handleConfirmButton={importData}
          handleCancelButton={handleCancelButton}
        />
      )}
    </div>
  );


}

export default DataImport;
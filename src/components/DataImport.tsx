"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { read, utils, writeFile } from "xlsx";
import toast, { Toaster } from "react-hot-toast";
import type { PreviewData } from "../types";
import ModalComponent from "./ModalComponent";

function DataImport() {
  const { getTranslation, importStudents, rooms, isLoading, currentUser, buildings, fetchBuildings, accessToken } = useStore();
  const t = getTranslation();

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [matchingStudents, setMatchingStudents] = useState<any[]>([]);
  const [matchingNames, setMatchingNames] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentSelections, setStudentSelections] = useState<
    Record<string, string>
  >({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const processExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const preview: PreviewData[] = [];
      const sheetName = "Students";
      const sheet = workbook.Sheets[sheetName];
  
      if (sheet) {
        const allRows = utils.sheet_to_json(sheet);
  
        // Verify that required columns exist (Name, Building, Suite are required; Room is optional for standalone)
        if (
          allRows.length === 0 ||
          !["Name", "Building", "Suite"].every((key) =>
            Object.keys(allRows[0]).includes(key)
          )
        ) {
          throw new Error(
            toast.error(
              t.import.columnError
            )
          );
        }
  
        // Filtrar filas vacías y mapear datos
        const currentUserBuilding = currentUser?.building_id
          ? buildings.find((b) => b.id === currentUser.building_id)?.name
          : null; // null building_id (admin) = no building restriction
        const filteredRows = allRows
          .filter((row) =>
            Object.values(row as any).some(
              (value) =>
                value !== null &&
                value !== undefined &&
                value !== "" &&
                !(typeof value === "string" && value.trim() === "")
            )
          ).filter((row: any)=> {
            if(!currentUserBuilding || row.Building.toLowerCase() === currentUserBuilding)
            {
              return true;
            }
            toast.error(t.import.ignoredRecord + ": " + row.Name);
            return false;
          })
          .map((row) => {
            const { Name, ID, Building, Suite, Room } = row as any;
            return { Name, ID: ID ?? null, Building, Suite, Room };
          });
        const headers =
          filteredRows.length > 0 ? Object.keys(filteredRows[0]) : [];
        preview.push({
          sheet: sheetName,
          headers,
          rows: filteredRows.slice(0, 10),
          allRows: filteredRows,
          currentPage: 1,
          rowsPerPage: 10,
        });
      } else {
        throw new Error(
          toast.error(
            "The 'Students' sheet was not found in the workbook. Please make sure your Excel file contains a sheet named 'Students'."
          )
        );
      }
  
      setPreviewData(preview);
      if (preview.length > 0) {
        setSelectedSheet(preview[0].sheet);
      }
    } catch (error) {
      toast.error(t.import.error);
    }
  };
  

  useEffect(() => {
    if (previewData.length > 0 && selectedSheet) {
      const selectedPreview = previewData.find(
        (p) => p.sheet === selectedSheet
      );
      if (selectedPreview) {
        checkForMatches(selectedPreview.allRows);
      }
    }
  }, [previewData, selectedSheet]);

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

  const checkForMatches = (data: any[]) => {
    const buildingList = buildings.map((b) => b.name);
    const validLetters = ["A", "B", "C", "D"];
    const err = {
      suite: "",
      room: "",
      building: "",
    };

    // Helper: get building layout type
    const getBuildingLayout = (buildingName: string) =>
      buildings.find((b) => b.name === buildingName.toLowerCase())?.layout_type ?? 'suite';
  
    // Filtrar solo las filas que tienen datos válidos en las columnas esperadas
    const validRows = data.filter((row) => {
      const hasRequiredFields =
        row.Name || row.Building || row.Suite || row.Room;
      const containsValidationRules = Object.values(row).some(
        (value) => typeof value === "string" && value.includes("VALIDATION RULES")
      );
      return hasRequiredFields && !containsValidationRules;
    });
  
    // Check for room matches (red highlight)
    const roomMatches = validRows.filter((row) => {
      const rowNum = row.__rowNum_;
      const buildingLower = row.Building
        ? row.Building.toString().toLowerCase()
        : "";
      const layoutType = getBuildingLayout(buildingLower);
      const isStandalone = layoutType === 'standalone';
      const suiteOrRoom = row.Suite ? row.Suite.toString().trim() : "";
  
      // Validate building
      if (!buildingLower || buildingList.indexOf(buildingLower) === -1) {
        err.building = "It seems that a building field is invalid (see row " + rowNum + ")";
      } else if (!suiteOrRoom) {
        err.suite = "It seems that a suite/room field is empty (see row " + rowNum + ")";
      } else if (!isStandalone) {
        // Suite-based: validate suite number format
        const suiteNumber = parseInt(suiteOrRoom, 10);
        if (isNaN(suiteNumber) || suiteOrRoom.length > 3) {
          err.suite = "It seems that a suite field is invalid (see row " + rowNum + ")";
        } else if (
          !row.Room ||
          row.Room.toString().trim().length !== 1 ||
          validLetters.indexOf(row.Room.toString().trim()) === -1
        ) {
          err.room = "It seems that a room field is empty or invalid (see row " + rowNum + ")";
        }
      }
  
      if (err.suite.length > 0 || err.room.length > 0 || err.building.length > 0) {
        toast.error(err.suite + " " + err.room + " " + err.building);
        setPreviewData([]);
        setSelectedSheet("");
        return false;
      }

      if (isStandalone) {
        // For standalone: match by room.number
        return rooms.some(
          (room) =>
            room.building.toLowerCase() === buildingLower &&
            (room as any).roomNumber?.toString() === suiteOrRoom &&
            room.students &&
            room.students[0] &&
            room.students[0].id !== null
        );
      } else {
        const suiteNumber = parseInt(suiteOrRoom, 10);
        return rooms.some(
          (room) =>
            room.suiteNumber === suiteNumber &&
            (room.letter || '').trim() === row.Room &&
            room.building.toLowerCase() === buildingLower &&
            room.students &&
            room.students[0] &&
            room.students[0].id !== null
        );
      }
    });
  
    // Check for name matches (yellow highlight)
    const nameMatches = validRows.filter((row) => {
      if (!row.Name) return false;
      const buildingLower = row.Building?.toString().toLowerCase() ?? "";
      const layoutType = getBuildingLayout(buildingLower);
      const isStandalone = layoutType === 'standalone';
      const suiteOrRoom = row.Suite ? row.Suite.toString().trim() : "";
      
      return rooms.some(
        (room) =>
          room.students &&
          room.students.some(
            (student) =>
              student.name &&
              student.name.toLowerCase() === row.Name.toLowerCase() &&
              (isStandalone
                ? (room as any).roomNumber?.toString() === suiteOrRoom && room.building.toLowerCase() === buildingLower
                : room.suiteNumber === parseInt(suiteOrRoom, 10)
              )
          )
      );
    });
  
    setMatchingStudents(roomMatches);
    setMatchingNames(nameMatches);
    
    const initialSelections: Record<string, string> = {};
    const initialExpandedRows: Record<string, boolean> = {};
    roomMatches.forEach((match) => {
      const buildingLower = match.Building.toString().toLowerCase();
      const layoutType = buildings.find((b) => b.name === buildingLower)?.layout_type ?? 'suite';
      const isStandalone = layoutType === 'standalone';
      const suiteOrRoomStr = match.Suite ? match.Suite.toString().trim() : "";
      const suiteNumber = isStandalone ? NaN : parseInt(suiteOrRoomStr, 10);

      // roomKey matches backend convention
      const roomKey = isStandalone
        ? `${buildingLower}-${suiteOrRoomStr}-`
        : `${buildingLower}-${suiteOrRoomStr}-${match.Room}`;
  
      const isAlsoNameMatch = nameMatches.some(
        (nameMatch) =>
          nameMatch.Building.toLowerCase() === buildingLower &&
          nameMatch.Suite?.toString().trim() === suiteOrRoomStr &&
          (isStandalone || nameMatch.Room === match.Room) &&
          nameMatch.Name.toLowerCase() === match.Name.toLowerCase()
      );
  
      if (!isAlsoNameMatch) {
        initialExpandedRows[roomKey] = true;
        const matchedRoom = rooms.find(
          (room) =>
            room.building.toLowerCase() === buildingLower &&
            (isStandalone
              ? (room as any).roomNumber?.toString() === suiteOrRoomStr
              : room.suiteNumber === suiteNumber && (room.letter || '').trim() === match.Room
            )
        );
  
        if (matchedRoom && matchedRoom.students && matchedRoom.students.length > 0) {
          const existingRoomKey = Object.keys(initialSelections).find((key) => {
            const [keyBuilding, keySuite, keyRoom] = key.split("-");
            return (
              keyBuilding === buildingLower &&
              parseInt(keySuite, 10) === suiteNumber &&
              keyRoom === match.Room
            );
          });
  
          const stdIndexes = selectedPreview?.rows
            .map((row, index) => {
              const rowBuildingLower = row.Building
                ? row.Building.toString().toLowerCase()
                : "";
              const rowSuiteStr = row.Suite ? row.Suite.toString().trim() : "";
              const isStandaloneRow = buildings.find((b) => b.name === rowBuildingLower)?.layout_type === 'standalone';
              const isNameMatch = nameMatches.some(
                (nameMatch) =>
                  nameMatch.Building.toLowerCase() === rowBuildingLower &&
                  nameMatch.Suite?.toString().trim() === rowSuiteStr &&
                  (isStandaloneRow || nameMatch.Room === row.Room) &&
                  nameMatch.Name.toLowerCase() === row.Name.toLowerCase()
              );

              const rowMatchesRoom = isStandaloneRow
                ? rowBuildingLower === matchedRoom.building.toLowerCase() &&
                  rowSuiteStr === (matchedRoom as any).roomNumber?.toString()
                : rowBuildingLower === matchedRoom.building.toLowerCase() &&
                  parseInt(rowSuiteStr, 10) === matchedRoom.suiteNumber &&
                  row.Room === matchedRoom.letter;

              if (rowMatchesRoom && !isNameMatch) {
                return index;
              }
              return undefined;
            })
            .filter((index) => index !== undefined);
  
          if (existingRoomKey && matchedRoom.students.length === 2) {
            const existingSelection = initialSelections[existingRoomKey];
            const otherStudent = matchedRoom.students.find(
              (student) => student.id !== existingSelection
            );
            if (otherStudent && existingRoomKey) {
              initialSelections[`${roomKey}-${stdIndexes && stdIndexes[1]}`] =
                otherStudent.id;
            }
          } else {
            if (matchedRoom.students.length === 1 && !existingRoomKey) {
              initialSelections[`${roomKey}-${stdIndexes && stdIndexes[0]}`] = "-1";
            } else {
              initialSelections[`${roomKey}-${stdIndexes && stdIndexes[0]}`] =
                matchedRoom.students[0].id;
            }
          }
        }
      }
    });
    setStudentSelections(initialSelections);  
    setExpandedRows(initialExpandedRows);
  
    return roomMatches.length > 0;
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
    if (selectedPreview) {
      // Create a filtered version of the preview that excludes name matches
      const filteredPreview = {
        ...selectedPreview,
        allRows: selectedPreview.allRows.filter((row) => {
          // Skip rows with matching names
          if (row.Name) {
            const isNameMatching = matchingNames.some(
              (student) =>
              student.Name && student.Name.toLowerCase() === row.Name.toLowerCase()
                
            );
            if (isNameMatching) {
              return false;
            }
          }
          return true;
        }),
      };

      // Pass the filtered preview to importStudents along with student selections
      await importStudents(filteredPreview.allRows, studentSelections);
      setPreviewData([]);
      setSelectedSheet("");
      setShowConfirmModal(false);
      setStudentSelections({});
      setExpandedRows({});
      toast.success(t.import.success);
    }
  }, [
    previewData,
    selectedSheet,
    importStudents,
    t.import.success,
    rooms,
    studentSelections,
  ]);

  const handleCancelButton = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

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
      } else {
        newSelections[exitingKeyRoom[0]] = studentId;
      }
      setStudentSelections(newSelections);
    },
    [expandedRows, studentSelections] 
  );

  const getStudentsForRoom = useCallback(
    (building: string, suiteOrRoomNumber: string, roomLetter: string) => {
      const buildingLower = building.trim().toLowerCase();
      const layoutType = buildings.find((b) => b.name === buildingLower)?.layout_type ?? 'suite';
      const isStandalone = layoutType === 'standalone';
      const matchedRoom = rooms.find((r) =>
        isStandalone
          ? (r as any).roomNumber?.toString() === suiteOrRoomNumber && r.building === buildingLower
          : r.suiteNumber === parseInt(suiteOrRoomNumber, 10) &&
            (r.letter || '').trim() === roomLetter &&
            r.building === buildingLower
      );
      return matchedRoom?.students.filter((student) => student.id !== null) || [];
    },
    [rooms, buildings]
  );

  const handleCancel = useCallback(() => {
    setPreviewData([]);
    setSelectedSheet("");
    setStudentSelections({});
    setExpandedRows({});
  }, []);

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
          {
            Name: "John Doe",
            Building: "Edwards",
            Suite: 101,
            Room: "A"
          },
          {
            Name: "Jane Smith",
            Building: "Holland",
            Suite: 202,
            Room: "B"
          },
          {
            Name: "Alex Johnson",
            Building: "Peterson",
            Suite: 303,
            Room: "C"
          }
        ];
        
        // Convert the data to a worksheet
        const worksheet = utils.json_to_sheet(sampleData);
        
        // Add column widths for better readability
        const columnWidths = [
          { wch: 20 }, // Name
          { wch: 15 }, // Building
          { wch: 10 }, // Suite
          { wch: 10 }  // Room
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
                    <li>{t.import.instructions.id}</li>
                    <li>{t.import.instructions.room}</li>
                    <li>{t.import.instructions.suite}</li>
                    <li>{t.import.instructions.building}</li>
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
                    className="btn-primary btn-md text-sm"
                  >
                    {t.import.importButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          {selectedPreview && (
            <>
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-slate-600 flex items-center">
                    <span className="inline-block w-3.5 h-3.5 rounded bg-red-300 mr-2"></span>
                    {t.import.dataPreview.legend.redLabel}
                  </p>
                  <p className="text-sm text-slate-600 flex items-center">
                    <span className="inline-block w-3.5 h-3.5 rounded bg-yellow-200 mr-2"></span>
                    {t.import.dataPreview.legend.yellowLabel}
                  </p>
                </div>
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
                      const layoutType = buildings.find((b) => b.name === buildingLower)?.layout_type ?? 'suite';
                      const isStandalone = layoutType === 'standalone';
                      const suiteOrRoomStr = row.Suite ? row.Suite.toString().trim() : "";

                      const isRoomMatching = matchingStudents.some(
                        (match) =>
                          match.Suite?.toString().trim() === suiteOrRoomStr &&
                          (isStandalone || match.Room === row.Room) &&
                          match.Building.toLowerCase() === buildingLower 
                      );
  
                      const isNameMatching = matchingNames.some(
                        (match) =>
                          match.Name &&
                          row.Name &&
                          match.Name.toLowerCase() === row.Name.toLowerCase()
                      );
  
                      let rowClass = rowIndex % 2 === 0 ? "bg-slate-50" : "bg-white";
                      if (isNameMatching) {
                        rowClass = "bg-yellow-200";
                      } else if (isRoomMatching) {
                        rowClass = "bg-red-300";
                      }
  
                      // roomKey must match backend convention
                      const roomKey = isStandalone
                        ? `${buildingLower}-${suiteOrRoomStr}-`
                        : `${buildingLower}-${suiteOrRoomStr}-${row.Room}`;
                      
                      const studentsInRoom =
                        isRoomMatching && !isNameMatching
                          ? getStudentsForRoom(buildingLower, suiteOrRoomStr, row.Room ?? "")
                          : [];
                      return (
                        <>
                          <tr key={rowIndex} className={rowClass}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {isRoomMatching && studentsInRoom.length > 0 && (
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
                              )}
                            </td>
                            {selectedPreview.headers.map((header, colIndex) => (
                              <td
                                key={`${rowIndex}-${colIndex}`}
                                className="px-6 py-4 whitespace-nowrap text-sm text-slate-900"
                              >
                                {row[header]?.toString() || ""}
                              </td>
                            ))}
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
                                            {student.name}{student.studentUid ? ` · ${student.studentUid}` : ""}
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
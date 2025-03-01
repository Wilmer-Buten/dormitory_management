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
import { read, utils } from "xlsx";
import toast, { Toaster } from "react-hot-toast";
import type { PreviewData } from "../types";
import ModalComponent from "./ModalComponent";

function DataImport() {
  const { getTranslation, importStudents, rooms, isLoading } = useStore();
  const t = getTranslation();
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
        // Get all rows from the sheet
        const allRows = utils.sheet_to_json(sheet);

        // Filter out completely empty rows
        const filteredRows = allRows.filter((row) => {
          // Check if any property in the row has a value
          return Object.values(row).some(
            (value) =>
              value !== null &&
              value !== undefined &&
              value !== "" &&
              !(typeof value === "string" && value.trim() === "")
          );
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
          "The 'Students' sheet was not found in the workbook. Please make sure your Excel file contains a sheet named 'Students'."
        );
      }

      setPreviewData(preview);
      if (preview.length > 0) {
        setSelectedSheet(preview[0].sheet);
      }
    } catch (error) {
      console.error("Error processing file:", error);
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
    const err = {
      suite: "",
      room: "",
      building: "",
    };

    // Filtrar solo las filas que tienen datos válidos en las columnas esperadas
    const validRows = data.filter((row) => {
      // Ignorar filas que no tienen al menos una de las columnas clave (Name, Building, Suite, Room)
      const hasRequiredFields =
        row.Name || row.Building || row.Suite || row.Room;
      // Ignorar filas que contienen "VALIDATION RULES" en cualquier valor
      const containsValidationRules = Object.values(row).some(
        (value) =>
          typeof value === "string" && value.includes("VALIDATION RULES")
      );
      return hasRequiredFields && !containsValidationRules;
    });

    // Check for room matches (red highlight)
    console.log("Filtered data:", validRows);
    const roomMatches = validRows.filter((row) => {
      const rowNum = row.__rowNum_;
      // Normalizar Building a minúsculas para la validación
      const buildingLower = row.Building
        ? row.Building.toString().toLowerCase()
        : "";

      if (!row.Suite || row.Suite.toString().trim().length === 0) {
        err.suite =
          "It seems that a suite field is empty (see row " + rowNum + ")";
      } else if (!row.Room || row.Room.toString().trim().length === 0) {
        err.room =
          "It seems that a room field is empty (see row " + rowNum + ")";
      } else if (!buildingLower || buildingLower.length === 0) {
        err.building =
          "It seems that a building field is empty (see row " + rowNum + ")";
      }

      if (
        err.suite.length > 0 ||
        err.room.length > 0 ||
        err.building.length > 0
      ) {
        toast.error(err.suite + " " + err.room + " " + err.building);
        setPreviewData([]);
        setSelectedSheet("");
        return false;
      }
      console.log(rooms);
      console.log(row);
      console.log(buildingLower);
      return rooms.some(
        (room) =>
          room.suiteNumber === row.Suite.trim() &&
          room.letter.trim() === row.Room &&
          room.building.toLowerCase() === buildingLower && // Comparar en minúsculas
          room.students &&
          room.students[0] &&
          room.students[0].id !== null
      );
    });

    // Check for name matches (yellow highlight)
    const nameMatches = validRows.filter((row) => {
      if (!row.Name) return false;

      return rooms.some(
        (room) =>
          room.students &&
          room.students.some(
            (student) =>
              student.name &&
              student.name.toLowerCase() === row.Name.toLowerCase()
          )
      );
    });

    console.log("Room matches:", roomMatches);
    console.log("Name matches:", nameMatches);

    setMatchingStudents(roomMatches);
    setMatchingNames(nameMatches);

    // Initialize student selections with default values (first student in each room)
    const initialSelections: Record<string, string> = {};
    const initialExpandedRows: Record<string, boolean> = {};
    roomMatches.forEach((match) => {
      // Normalizar Building a minúsculas para la clave y comparación
      const buildingLower = match.Building.toString().toLowerCase();
      const isAlsoNameMatch = nameMatches.some(
        (nameMatch) =>
          nameMatch.Suite === match.Suite &&
          nameMatch.Room === match.Room &&
          nameMatch.Building.toLowerCase() === buildingLower && // Comparar en minúsculas
          nameMatch.Name.toLowerCase() === match.Name.toLowerCase()
      );
      if (!isAlsoNameMatch) {
        const roomKey = `${buildingLower}-${match.Suite}-${match.Room}`; // Usar building en minúsculas en la clave
        initialExpandedRows[roomKey] = true;
        const matchedRoom = rooms.find(
          (room) =>
            room.suiteNumber === match.Suite.trim() &&
            room.letter.trim() === match.Room &&
            room.building.toLowerCase() === buildingLower // Comparar en minúsculas
        );
        console.log(matchedRoom);
        if (
          matchedRoom &&
          matchedRoom.students &&
          matchedRoom.students.length > 0
        ) {
          const existingRoomKey = Object.keys(initialSelections).find((key) => {
            const [keyBuilding, keySuite, keyRoom] = key.split("-");
            return (
              keyBuilding === buildingLower && // Comparar en minúsculas
              keySuite === match.Suite.trim() &&
              keyRoom === match.Room
            );
          });
          const stdIndexes = selectedPreview?.rows
            .map((row, index) => {
              const rowBuildingLower = row.Building
                ? row.Building.toString().toLowerCase()
                : "";
              const isNameMatch = nameMatches.some(
                (nameMatch) =>
                  nameMatch.Building.toLowerCase() === rowBuildingLower && // Comparar en minúsculas
                  nameMatch.Suite === row.Suite &&
                  nameMatch.Room === row.Room &&
                  nameMatch.Name.toLowerCase() === row.Name.toLowerCase()
              );
              
              if (
                rowBuildingLower === matchedRoom.building.toLowerCase() && // Comparar en minúsculas
                row.Suite === matchedRoom.suiteNumber &&
                row.Room === matchedRoom.letter &&
                !isNameMatch
              ) {
                return index;
              }
              return undefined;
            })
            .filter((index) => index !== undefined);
            console.log(stdIndexes, existingRoomKey);
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
            if (matchedRoom.students.length === 1 && existingRoomKey) {
              console.log("as");
              initialSelections[`${roomKey}-${stdIndexes && stdIndexes[1]}`] =
                "-1";
            } else {
              console.log(stdIndexes);
              initialSelections[`${roomKey}-${stdIndexes && stdIndexes[0]}`] =
                matchedRoom.students[0].id;
            }
          }
        }
      }
    });
    console.log(initialExpandedRows);
    console.log(initialSelections);
    
    setStudentSelections(initialSelections);
    setExpandedRows(initialExpandedRows);

    return roomMatches.length > 0;
  };

  const toggleExpandedRow = useCallback(
    (roomKey: string) => {
      console.log(roomKey);
      console.log(expandedRows);
      setExpandedRows((prev) => ({
        ...prev,
        [roomKey]: !prev[roomKey],
      }));
    },
    [expandedRows] // Removed studentSelections from dependencies
  );

  const importData = useCallback(async () => {
    const selectedPreview = previewData.find((p) => p.sheet === selectedSheet);
    if (selectedPreview) {
      // Create a filtered version of the preview that excludes name matches
      const filteredPreview = {
        ...selectedPreview,
        allRows: selectedPreview.allRows.filter((row) => {
          // Skip rows with matching names
          if (row.name) {
            const isNameMatching = rooms.some(
              (room) =>
                room.students &&
                room.students.some(
                  (student) =>
                    student.name &&
                    student.name.toLowerCase() === row.name.toLowerCase()
                )
            );
            if (isNameMatching) return false;
          }
          return true;
        }),
      };

      // Pass the filtered preview to importStudents along with student selections
      await importStudents(filteredPreview, studentSelections);
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
      console.log(studentSelections);
      const studentsInRoom = getStudentsForRoom(building, suite, room);
      if (studentsInRoom.length === 1) {
        studentsInRoom.push({
          id: "-1",
          name: "Empty slot",
          isPresent: null,
          inRoom: null,
        });
      }
      console.log(studentsInRoom);
      const otherStudentId: any = studentsInRoom.find(
        (student) => student.id !== studentId
      )?.id;

      const allRoomKeys = Object.keys(expandedRows).filter((key) => {
        const [keyBuilding, keySuite, keyRoom] = key.split("-");
        return (
          keyBuilding === building && keySuite === suite && keyRoom === room
        );
      });
      console.log("All room keys:", allRoomKeys, expandedRows);
      const newSelections = { ...studentSelections };
      const exitingKeyRoom = Object.keys(newSelections).filter((key) =>
        key.startsWith(`${roomKey}`)
      );
      console.log(exitingKeyRoom);
      if (exitingKeyRoom.length === 2) {
        exitingKeyRoom.forEach((key) => {
          if (key.endsWith(rowIndex.toString())) {
            newSelections[key] = studentId;
          } else {
            newSelections[key] = otherStudentId;
          }
        });
      } else {
        console.log(exitingKeyRoom);
        newSelections[exitingKeyRoom[0]] = studentId;
      }
      console.log(newSelections);
      setStudentSelections(newSelections);
    },
    [expandedRows, studentSelections] // Removed getStudentsForRoom from dependencies
  );

  const getStudentsForRoom = useCallback(
    (building: string, suite: string, room: string) => {
      console.log(building, suite, room);
      const matchedRoom = rooms.find(
        (r) =>
          r.suiteNumber === suite.trim() &&
          r.letter.trim() === room &&
          r.building === building.trim().toLowerCase()
      );
      const matchedRoomStudents = matchedRoom?.students.filter((student) => {
        return student.id !== null;
      });

      return matchedRoomStudents || [];
    },
    [rooms]
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

      // Make API request to the backend endpoint
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/excel/template"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch the template");
      }
      // Get the file as a blob
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template", { id: "download-template" });
    }
  }, []); // Added getTemplateExcel dependency

  const downloadTemplateExcel = useCallback(async () => {
    try {
      const blob = await getTemplateExcel();
      // Create a temporary URL for the blob
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        // Create a temporary link element to trigger the download
        const link = document.createElement("a");
        link.href = url;
        link.download = "student_import_template_with_validation.xlsx"; // Match the filename from backend
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
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template", { id: "download-template" });
    }
  }, [getTemplateExcel]); // Added getTemplateExcel dependency

  const selectedPreview = previewData.find((p) => p.sheet === selectedSheet);
  const hasMoreRows = selectedPreview
    ? selectedPreview.rows.length < selectedPreview.allRows.length
    : false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 animate-[spin_1.5s_linear_infinite]" />
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-[spin_1.2s_linear_infinite] absolute inset-0" />
          <div className="w-12 h-12 rounded-full border-4 border-transparent border-l-blue-300 animate-[spin_2s_linear_infinite] absolute inset-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Toaster position="top-right" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.import.title}</h1>
        <p className="text-gray-600">{t.import.subtitle}</p>
      </div>
  
      {!previewData.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">{t.import.instructions.title}</h2>
              <div className="space-y-4">
                <p className="text-gray-600">{t.import.instructions.description}</p>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700">{t.import.instructions.sheets}:</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>{t.import.instructions.name}</li>
                    <li>{t.import.instructions.room}</li>
                    <li>{t.import.instructions.suite}</li>
                    <li>{t.import.instructions.building}</li>
                  </ul>
                </div>
              </div>
            </div>
  
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-500 mt-0.5" size={20} />
                <div>
                  <h3 className="font-medium text-blue-800 mb-1">{t.import.note.title}</h3>
                  <p className="text-blue-600 text-sm">{t.import.note.description}</p>
                </div>
              </div>
            </div>
  
            {/* Template Download Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Download Template</h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Need a starting point? Download our Excel template with the correct format for importing student data.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadTemplateExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileDown size={20} />
                    Download Excel Template
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          <div
            className={`bg-white rounded-lg shadow p-8 ${
              dragActive ? "border-2 border-dashed border-blue-400 bg-blue-50" : ""
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <FileSpreadsheet className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">{t.import.dropzone.title}</h3>
              <p className="text-gray-500 mb-6">{t.import.dropzone.description}</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                <Upload size={20} />
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
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TableIcon className="text-gray-400" size={24} />
                <div>
                  <h2 className="text-xl font-semibold">{t.import.dataPreview.title}</h2>
                  <p className="text-sm text-gray-500">
                    Showing {selectedPreview?.rows.length} of {selectedPreview?.allRows.length} records
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {previewData.map((preview) => (
                    <option key={preview.sheet} value={preview.sheet}>
                      {preview.sheet}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t.import.importButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          {selectedPreview && (
            <>
              <div className="p-4 bg-gray-100 border-b border-gray-200">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="inline-block w-4 h-4 bg-red-300 mr-2"></span>
                    {t.import.dataPreview.legend.redLabel}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="inline-block w-4 h-4 bg-yellow-200 mr-2"></span>
                    {t.import.dataPreview.legend.yellowLabel}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                      {selectedPreview.headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPreview.rows.map((row, rowIndex) => {
                      const buildingLower = row.Building ? row.Building.toString().toLowerCase() : "";
                      const isRoomMatching = matchingStudents.some(
                        (match) =>
                          match.Suite === row.Suite &&
                          match.Room === row.Room &&
                          match.Building.toLowerCase() === buildingLower // Comparar en minúsculas
                      );
  
                      const isNameMatching = matchingNames.some(
                        (match) =>
                          match.Name &&
                          row.Name &&
                          match.Name.toLowerCase() === row.Name.toLowerCase()
                      );
  
                      let rowClass = rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white";
                      if (isNameMatching) {
                        rowClass = "bg-yellow-200";
                      } else if (isRoomMatching) {
                        rowClass = "bg-red-300";
                      }
  
                      const roomKey = `${buildingLower}-${row.Suite}-${row.Room}`; // Usar building en minúsculas
                      console.log(row);
                      const studentsInRoom =
                        isRoomMatching && !isNameMatching
                          ? getStudentsForRoom(buildingLower, row.Suite, row.Room) // Pasar building en minúsculas
                          : [];
  
                      return (
                        <>
                          <tr key={rowIndex} className={rowClass}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {isRoomMatching && studentsInRoom.length > 0 && (
                                <button
                                  onClick={() => toggleExpandedRow(roomKey)}
                                  className="flex items-center justify-center p-1 bg-blue-100 rounded-full"
                                  title="Current students in this room"
                                >
                                  <UserIcon size={16} className="text-blue-600" />
                                  {expandedRows[roomKey] ? (
                                    <ChevronUp size={16} className="text-blue-600 transition-transform" />
                                  ) : (
                                    <ChevronDown size={16} className="text-blue-600 transition-transform" />
                                  )}
                                </button>
                              )}
                            </td>
                            {selectedPreview.headers.map((header, colIndex) => (
                              <td
                                key={`${rowIndex}-${colIndex}`}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {row[header]?.toString() || ""}
                              </td>
                            ))}
                          </tr>
                          {expandedRows[roomKey] && isRoomMatching && !isNameMatching && studentsInRoom.length > 0 && (
                            <tr className="bg-blue-50">
                              <td colSpan={selectedPreview.headers.length + 1} className="px-6 py-4">
                                <div className="pl-8 border-l-2 border-blue-300">
                                  <h4 className="font-medium text-blue-800 mb-2">
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
                                            console.log(student);
                                            handleStudentSelection(roomKey, student.id, rowIndex);
                                          }}
                                          checked={studentSelections[`${roomKey}-${rowIndex}`] === student.id}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label
                                          htmlFor={`student-${roomKey}-${student.id}-${rowIndex}`}
                                          className="text-sm text-gray-700 flex items-center gap-2"
                                        >
                                          <UserIcon size={16} className="text-gray-500" />
                                          <span>
                                            {student.name} ({student.id})
                                          </span>
                                          {studentSelections[`${roomKey}-${rowIndex}`] === student.id && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
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
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label
                                          htmlFor={`empty-slot-${roomKey}-${rowIndex}`}
                                          className="text-sm text-gray-700 flex items-center gap-2"
                                        >
                                          <UserIcon size={16} className="text-gray-500" />
                                          <span className="text-xs text-dark">Empty slot</span>
                                          <span className="text-xs bg-yellow-100 text-blue-800 px-2 py-0.5 rounded-full">
                                            Available slot!
                                          </span>
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">
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
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={loadMoreRows}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ChevronDown size={20} />
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

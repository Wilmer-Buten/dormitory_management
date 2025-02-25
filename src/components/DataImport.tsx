import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useStore } from "../store/useStore"
import { Upload, FileSpreadsheet, AlertCircle, TableIcon, ChevronDown } from "lucide-react"
import { read, utils } from "xlsx"
import toast, { Toaster } from "react-hot-toast"
import type { PreviewData } from "../types"
import ModalComponent from "./ModalComponent"

function DataImport() {
  const { getTranslation, importStudents, rooms } = useStore()
  const t = getTranslation()
  const [dragActive, setDragActive] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [matchingStudents, setMatchingStudents] = useState<any[]>([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const processExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = read(data)
      const preview: PreviewData[] = []
      ;["Students"].forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName]
        if (sheet) {
          const allRows = utils.sheet_to_json(sheet)
          const headers = allRows.length > 0 ? Object.keys(allRows[0]) : []
          preview.push({
            sheet: sheetName,
            headers,
            rows: allRows.slice(0, 10),
            allRows,
            currentPage: 1,
            rowsPerPage: 10,
          })
        }
      })

      setPreviewData(preview)
      if (preview.length > 0) {
        setSelectedSheet(preview[0].sheet)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      toast.error(t.import.error)
    }
  }

  useEffect(() => {
    if (previewData.length > 0 && selectedSheet) {
      const selectedPreview = previewData.find((p) => p.sheet === selectedSheet)
      if (selectedPreview) {
        checkForMatches(selectedPreview.allRows)
      }
    }
  }, [previewData, selectedSheet])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcelFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      processExcelFile(e.target.files[0])
    }
  }

  const handleSave = async () => {
    if (matchingStudents.length > 0) {
      setShowConfirmModal(true)
    } else {
      await importData()
    }
  }

  const loadMoreRows = () => {
    setPreviewData((prevData) =>
      prevData.map((sheet) => {
        if (sheet.sheet === selectedSheet) {
          const nextPage = sheet.currentPage + 1
          const startIndex = (nextPage - 1) * sheet.rowsPerPage
          const endIndex = nextPage * sheet.rowsPerPage
          return {
            ...sheet,
            currentPage: nextPage,
            rows: sheet.allRows.slice(0, endIndex),
          }
        }
        return sheet
      }),
    )
  }

  const checkForMatches = (data: any[]) => {
    console.log( rooms)
    let err = {
      suite: '',
      room: '',
      building: ''
    }
    const matches = data.filter((row) => {
      let rowNum =  row.__rowNum__; 
      if (!row.suite || row.suite.length === 0) {
        err.suite = "It seems that a suite field is empty (see row " + rowNum + ")";
      } else if (!row.room || row.room.length === 0) {
        err.room = "It seems that a room field is empty (see row " + rowNum + ")";
      } else if (!row.building || row.building.length === 0) {
        err.building = "It seems that a building field is empty (see row " + rowNum + ")";
      }
    
     if(err.suite.length > 0 || err.room.length > 0 || err.building.length > 0) {
      toast.error(err.suite + ' ' + err.room + ' ' + err.building)
      // setErr(true)
      setPreviewData([])
      setSelectedSheet("")
      return false;
     }      
     console.log(row)
      return rooms.some(
        (room) =>
          room.suiteNumber === JSON.stringify(row.suite).trim() && room.letter.trim() === row.room && room.building === row.building.trim()
      )
    })
    console.log(matches)
    setMatchingStudents(matches)
    return matches.length > 0
  }

  const importData = useCallback(async () => {
    const selectedPreview = previewData.find((p) => p.sheet === selectedSheet)
    if (selectedPreview) {
      await importStudents(selectedPreview)
      setPreviewData([])
      setSelectedSheet("")
      setShowConfirmModal(false)
      toast.success(t.import.success)
    }
  } , [previewData, selectedSheet])

  const handleCancelButton = useCallback(() => {
    setShowConfirmModal(false)
  }, []);

  const selectedPreview = previewData.find((p) => p.sheet === selectedSheet)
  const hasMoreRows = selectedPreview ? selectedPreview.rows.length < selectedPreview.allRows.length : false

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
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleChange} />
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
                  <h2 className="text-xl font-semibold">Data Preview</h2>
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
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Import Data
                </button>
              </div>
            </div>
          </div>

          {selectedPreview && (
            <>
              <div className="p-4 bg-gray-100 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="inline-block w-4 h-4 bg-red-300 mr-2"></span>
                  colored records indicate matches with existing data.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
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
                      const isMatching = matchingStudents.some(
                        (match) =>
                          match.suite === row.suite && match.room === row.room && match.building === row.building,
                      )
                      return (
                        <tr
                          key={rowIndex}
                          className={isMatching ? "bg-red-300" : rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
                        >
                          {selectedPreview.headers.map((header, colIndex) => (
                            <td
                              key={`${rowIndex}-${colIndex}`}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {row[header]?.toString() || ""}
                            </td>
                          ))}
                        </tr>
                      )
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
  )
}

export default DataImport;


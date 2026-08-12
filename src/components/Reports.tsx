import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import toast, { Toaster } from "react-hot-toast"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { utils, writeFile } from "xlsx"
import { Users, UserCheck, ClipboardCheck, UserX, Download, Loader2, Building2 } from "lucide-react"
import { useStore } from "../store/useStore"
import { AttendanceReportRecord, Translation } from "../types"

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const toDateInputValue = (date: Date) => date.toISOString().split("T")[0]
const MAX_RANGE_DAYS = 92
// Above this many days, per-day columns become unreadable; fall back to a condensed summary per student.
const DAY_COLUMNS_THRESHOLD = 14

const shortDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" })

function Reports() {
  const {
    currentUser,
    accessToken,
    buildings,
    fetchBuildings,
    fetchAttendanceReport,
    getTranslation,
  } = useStore()

  const t = getTranslation()
  const isAdmin = currentUser?.role === "admin"

  const defaultRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)
    return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) }
  }, [])

  const [startDate, setStartDate] = useState(defaultRange.startDate)
  const [endDate, setEndDate] = useState(defaultRange.endDate)
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (isAdmin && buildings.length === 0) fetchBuildings()
  }, [isAdmin])

  const rangeDays = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00Z`)
    const end = new Date(`${endDate}T00:00:00Z`)
    return Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  }, [startDate, endDate])

  const isRangeValid = !!startDate && !!endDate && endDate >= startDate
  const isRangeTooLong = isRangeValid && rangeDays > MAX_RANGE_DAYS
  const canFetch = isRangeValid && !isRangeTooLong

  const { data: report, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["attendance-report", startDate, endDate, isAdmin ? selectedBuildingId : currentUser?.building_id],
    queryFn: () => fetchAttendanceReport({ startDate, endDate, buildingId: selectedBuildingId }),
    enabled: !!currentUser && !!accessToken && canFetch,
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (error) toast.error((error as Error).message || t.reports.loadError)
  }, [error])

  const dayCount = report?.dailyBreakdown.length ?? 0
  const useDayColumns = dayCount > 0 && dayCount <= DAY_COLUMNS_THRESHOLD
  const showBuildingColumn = !!report && report.buildingId === null

  const studentStats = useMemo(() => {
    if (!report) return []
    return report.students.map((student) => {
      const present = student.records.filter((r) => r.isPresent === true).length
      const absent = student.records.filter((r) => r.isPresent === false).length
      const pending = student.records.filter((r) => r.isPresent === null).length
      const checked = present + absent
      const rate = checked > 0 ? Math.round((present / checked) * 100) : 0
      return { student, present, absent, pending, rate }
    })
  }, [report])

  const handleExport = () => {
    if (!report) return
    setIsExporting(true)
    try {
      const workbook = utils.book_new()

      const summaryRows = studentStats.map(({ student, present, absent, pending, rate }) => ({
        [t.reports.tableName]: student.name,
        [t.reports.tableRoom]: student.room,
        [t.reports.tableBuilding]: capitalize(student.building),
        [t.reports.tablePresentDays]: present,
        [t.reports.tableAbsentDays]: absent,
        [t.reports.tablePendingDays]: pending,
        [`${t.reports.tableAttendanceRate} (%)`]: rate,
      }))
      const summarySheet = utils.json_to_sheet(summaryRows)
      summarySheet["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }]
      utils.book_append_sheet(workbook, summarySheet, t.reports.sheetSummary)

      const statusLabel = (record: AttendanceReportRecord) =>
        record.isPresent === true ? t.reports.excelStatusPresent : record.isPresent === false ? t.reports.excelStatusAbsent : t.reports.excelStatusPending

      const dailyRows = report.students.map((student) => {
        const row: Record<string, string> = {
          [t.reports.tableName]: student.name,
          [t.reports.tableRoom]: student.room,
          [t.reports.tableBuilding]: capitalize(student.building),
        }
        student.records.forEach((record) => {
          row[record.date] = statusLabel(record)
        })
        return row
      })
      const dailySheet = utils.json_to_sheet(dailyRows)
      dailySheet["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 16 }, ...report.dailyBreakdown.map(() => ({ wch: 10 }))]
      utils.book_append_sheet(workbook, dailySheet, t.reports.sheetDaily)

      const buildingPart = report.buildingName ? report.buildingName.toLowerCase() : "all"
      writeFile(workbook, `attendance-report_${buildingPart}_${report.startDate}_${report.endDate}.xlsx`)
      toast.success(t.reports.exportSuccess)
    } catch (err) {
      toast.error(t.reports.exportError)
    } finally {
      setIsExporting(false)
    }
  }

  const isInitialLoading = isLoading && !report

  return (
    <div>
      <Toaster position="top-right" />

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-oakwood-blue tracking-tight">{t.reports.title}</h1>
        <p className="text-slate-600 text-sm sm:text-base mt-1">{t.reports.subtitle}</p>
      </motion.div>

      {/* Filters */}
      <div className="card p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-end">
          <div className="w-full sm:w-auto">
            <label className="label">{t.reports.startDate}</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="label">{t.reports.endDate}</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={toDateInputValue(new Date())}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          {isAdmin && (
            <div className="w-full sm:w-56">
              <label className="label">{t.building}</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <select
                  value={selectedBuildingId ?? "all"}
                  onChange={(e) => setSelectedBuildingId(e.target.value === "all" ? null : parseInt(e.target.value))}
                  className="input input-icon appearance-none pr-9"
                >
                  <option value="all">{t.reports.allBuildings}</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{capitalize(b.name)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="sm:ml-auto w-full sm:w-auto">
            <button
              onClick={handleExport}
              disabled={!report || isExporting || isInitialLoading || report.students.length === 0}
              className="btn-primary btn-md w-full sm:w-auto"
            >
              {isExporting ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
              {isExporting ? t.reports.exporting : t.reports.exportButton}
            </button>
          </div>
        </div>
        {!isRangeValid && (
          <p className="text-sm text-red-500 mt-3">{t.reports.invalidRange}</p>
        )}
        {isRangeValid && isRangeTooLong && (
          <p className="text-sm text-red-500 mt-3">{t.reports.rangeTooLong}</p>
        )}
      </div>

      {isInitialLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-oakwood-blue" />
        </div>
      ) : !report ? (
        <div className="card p-10 text-center text-slate-400">
          {error ? (
            <>
              <p className="mb-4">{t.reports.loadError}</p>
              <button onClick={() => refetch()} className="btn-primary btn-md">{t.reports.retry}</button>
            </>
          ) : (
            <p>{t.reports.invalidRange}</p>
          )}
        </div>
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <KpiCard icon={Users} label={t.reports.kpiTotalStudents} value={report.summary.totalStudents} accent="bg-oakwood-blue-50 text-oakwood-blue" />
            <KpiCard icon={UserCheck} label={t.reports.kpiAttendanceRate} value={`${report.summary.attendanceRate}%`} accent="bg-green-50 text-green-600" />
            <KpiCard icon={ClipboardCheck} label={t.reports.kpiTotalCheckIns} value={report.summary.totalCheckIns} accent="bg-oakwood-gold-50 text-oakwood-gold-dark" />
            <KpiCard icon={UserX} label={t.reports.kpiAbsences} value={report.summary.absentCount} accent="bg-red-50 text-red-600" />
          </div>

          {/* Daily trend */}
          <div className="card p-5 sm:p-6 mb-6">
            <h2 className="font-semibold text-slate-800">{t.reports.dailyTrendTitle}</h2>
            <p className="text-sm text-slate-400 mb-5">{t.reports.dailyTrendSubtitle}</p>

            {report.dailyBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">{t.reports.dailyTrendEmpty}</p>
            ) : (
              <div className="flex items-end gap-2 pb-2">
                {report.dailyBreakdown.map((day) => {
                  const total = day.total || 1
                  const presentPct = (day.present / total) * 100
                  const absentPct = (day.absent / total) * 100
                  const pendingPct = (day.pending / total) * 100
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1 min-w-[40px]">
                      <div
                        className="w-full h-32 rounded-lg bg-slate-100 overflow-hidden flex flex-col justify-end"
                        title={`${day.date} — ${t.present}: ${day.present}, ${t.absent}: ${day.absent}, ${t.pending}: ${day.pending}`}
                      >
                        {day.pending > 0 && <div style={{ height: `${pendingPct}%` }} className="w-full bg-slate-300" />}
                        {day.absent > 0 && <div style={{ height: `${absentPct}%` }} className="w-full bg-red-500" />}
                        {day.present > 0 && <div style={{ height: `${presentPct}%` }} className="w-full bg-green-500" />}
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{shortDate(day.date)}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-center gap-5 mt-5 pt-4 border-t border-slate-100">
              <LegendDot color="bg-green-500" label={t.present} />
              <LegendDot color="bg-red-500" label={t.absent} />
              <LegendDot color="bg-slate-300" label={t.pending} />
            </div>
          </div>

          {/* Student detail */}
          <div className="card p-5 sm:p-6">
            <h2 className="font-semibold text-slate-800">{t.reports.studentDetailTitle}</h2>
            <p className="text-sm text-slate-400 mb-5">
              {useDayColumns ? t.reports.studentDetailSubtitleDaily : t.reports.studentDetailSubtitleSummary}
            </p>

            {report.students.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">{t.reports.empty}</p>
            ) : (
              <div className="overflow-x-auto">
                {useDayColumns ? (
                  <table className="w-full text-sm" style={{ minWidth: 480 + dayCount * 56 }}>
                    <thead>
                      <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                        <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableName}</th>
                        <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableRoom}</th>
                        {showBuildingColumn && <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableBuilding}</th>}
                        {report.dailyBreakdown.map((day) => (
                          <th key={day.date} className="py-3 px-2 text-center whitespace-nowrap">{shortDate(day.date)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-2 font-medium text-slate-800 whitespace-nowrap">{student.name}</td>
                          <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{student.room}</td>
                          {showBuildingColumn && <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{capitalize(student.building)}</td>}
                          {student.records.map((record) => (
                            <td key={record.date} className="py-2.5 px-2 text-center">
                              <StatusIndicator record={record} t={t} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                        <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableName}</th>
                        <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableRoom}</th>
                        {showBuildingColumn && <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableBuilding}</th>}
                        <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tablePresentDays}</th>
                        <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableAbsentDays}</th>
                        <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tablePendingDays}</th>
                        <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableAttendanceRate}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentStats.map(({ student, present, absent, pending, rate }) => (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-2 font-medium text-slate-800 whitespace-nowrap">{student.name}</td>
                          <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{student.room}</td>
                          {showBuildingColumn && <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{capitalize(student.building)}</td>}
                          <td className="py-2.5 px-2 text-center font-medium text-green-600">{present}</td>
                          <td className="py-2.5 px-2 text-center font-medium text-red-600">{absent}</td>
                          <td className="py-2.5 px-2 text-center font-medium text-slate-400">{pending}</td>
                          <td className="py-2.5 px-2 text-center font-semibold text-slate-800">{rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const KpiCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 sm:p-5">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs sm:text-sm truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{value}</p>
      </div>
    </div>
  </motion.div>
)

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
    <span className="text-slate-500">{label}</span>
  </div>
)

const StatusIndicator = ({ record, t }: { record: AttendanceReportRecord; t: Translation }) => {
  if (record.isPresent === true) {
    return (
      <span
        className="inline-flex w-5 h-5 rounded-full bg-green-100 text-green-600 items-center justify-center text-[11px] font-bold"
        title={`${t.reports.statusPresent}${record.checkedBy ? ` — ${record.checkedBy}` : ""}`}
      >
        ✓
      </span>
    )
  }
  if (record.isPresent === false) {
    return (
      <span
        className="inline-flex w-5 h-5 rounded-full bg-red-100 text-red-600 items-center justify-center text-[11px] font-bold"
        title={`${t.reports.statusAbsent}${record.checkedBy ? ` — ${record.checkedBy}` : ""}`}
      >
        ✗
      </span>
    )
  }
  return (
    <span className="inline-flex w-5 h-5 rounded-full bg-slate-100 text-slate-400 items-center justify-center text-[11px]" title={t.reports.statusPending}>
      –
    </span>
  )
}

export default Reports

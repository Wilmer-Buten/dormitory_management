import { Fragment, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import toast, { Toaster } from "react-hot-toast"
import { useQuery } from "@tanstack/react-query"
import { utils, writeFile } from "xlsx"
import {
  Users,
  UserCheck,
  ClipboardCheck,
  UserX,
  Download,
  Loader2,
  Building2,
  Sparkles,
  DoorOpen,
  Check,
  X,
} from "lucide-react"
import { useStore } from "../store/useStore"
import {
  AttendanceReport,
  AttendanceReportRecord,
  CleanCheckReport,
  CleanCheckReportRecord,
  ReportsTabFilter,
  Translation,
} from "../types"

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
/** Local calendar YYYY-MM-DD (avoid UTC shift from toISOString). */
const toDateInputValue = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
const MAX_RANGE_DAYS = 92
const DAY_COLUMNS_THRESHOLD = 14
/** Combined All table uses A|C subcolumns, so keep fewer day groups. */
const COMBINED_DAY_COLUMNS_THRESHOLD = 10

const shortDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" })

type RangePreset = "today" | "week"

const getTodayRange = () => {
  const today = toDateInputValue(new Date())
  return { startDate: today, endDate: today }
}

const getWeekRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)
  return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) }
}

const detectRangePreset = (startDate: string, endDate: string): RangePreset | null => {
  const today = getTodayRange()
  if (startDate === today.startDate && endDate === today.endDate) return "today"
  const week = getWeekRange()
  if (startDate === week.startDate && endDate === week.endDate) return "week"
  return null
}

type ReportStatus = "present" | "in_room" | "absent" | "pending"
type CleanStatus = "clean" | "dirty" | "pending" | "na"

function classifyRecord(record: AttendanceReportRecord): ReportStatus {
  if (record.isPresent === true) return "present"
  if (record.inRoom === true) return "in_room"
  if (record.isPresent === false) return "absent"
  return "pending"
}

function classifyCleanRecord(record: CleanCheckReportRecord): CleanStatus {
  if (!record.applicable) return "na"
  if (record.isClean === true) return "clean"
  if (record.isClean === false) return "dirty"
  return "pending"
}

function Reports() {
  const {
    currentUser,
    accessToken,
    buildings,
    fetchBuildings,
    fetchAttendanceReport,
    fetchCleanCheckReport,
    reportsTabFilter,
    setReportsTabFilter,
    getTranslation,
  } = useStore()

  const t = getTranslation()
  const isAdmin = currentUser?.role === "admin"
  const showAttendance = reportsTabFilter === "all" || reportsTabFilter === "attendance"
  const showCleanCheck = reportsTabFilter === "all" || reportsTabFilter === "cleanCheck"

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

  const rangePreset = useMemo(() => detectRangePreset(startDate, endDate), [startDate, endDate])

  const applyRangePreset = (preset: RangePreset) => {
    const range = preset === "today" ? getTodayRange() : getWeekRange()
    setStartDate(range.startDate)
    setEndDate(range.endDate)
  }

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
  const buildingKey = isAdmin ? selectedBuildingId : currentUser?.building_id
  const queryEnabled = !!currentUser && !!accessToken && canFetch

  const {
    data: attendanceReport,
    isLoading: attendanceLoading,
    isFetching: attendanceFetching,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ["attendance-report", startDate, endDate, buildingKey],
    queryFn: () => fetchAttendanceReport({ startDate, endDate, buildingId: selectedBuildingId }),
    enabled: queryEnabled && showAttendance,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  })

  const {
    data: cleanReport,
    isLoading: cleanLoading,
    isFetching: cleanFetching,
    error: cleanError,
    refetch: refetchClean,
  } = useQuery({
    queryKey: ["clean-check-report", startDate, endDate, buildingKey],
    queryFn: () => fetchCleanCheckReport({ startDate, endDate, buildingId: selectedBuildingId }),
    enabled: queryEnabled && showCleanCheck,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (showAttendance && attendanceError) toast.error((attendanceError as Error).message || t.reports.loadError)
  }, [attendanceError, showAttendance])

  useEffect(() => {
    if (showCleanCheck && cleanError) toast.error((cleanError as Error).message || t.reports.loadError)
  }, [cleanError, showCleanCheck])

  const studentStats = useMemo(() => {
    if (!attendanceReport) return []
    return attendanceReport.students.map((student) => {
      const present = student.records.filter((r) => classifyRecord(r) === "present").length
      const inRoom = student.records.filter((r) => classifyRecord(r) === "in_room").length
      const absent = student.records.filter((r) => classifyRecord(r) === "absent").length
      const pending = student.records.filter((r) => classifyRecord(r) === "pending").length
      const checked = present + inRoom + absent
      const rate = checked > 0 ? Math.round((present / checked) * 100) : 0
      return { student, present, inRoom, absent, pending, rate }
    })
  }, [attendanceReport])

  const roomStats = useMemo(() => {
    if (!cleanReport) return []
    return cleanReport.rooms.map((room) => {
      const applicable = room.records.filter((r) => r.applicable)
      const clean = applicable.filter((r) => r.isClean === true).length
      const dirty = applicable.filter((r) => r.isClean === false).length
      const pending = applicable.filter((r) => r.isClean === null).length
      const checked = clean + dirty
      const rate = checked > 0 ? Math.round((clean / checked) * 100) : 0
      return { room, clean, dirty, pending, rate }
    })
  }, [cleanReport])

  const isFetching =
    (showAttendance && attendanceFetching) || (showCleanCheck && cleanFetching)

  const handleRefetch = () => {
    if (showAttendance) refetchAttendance()
    if (showCleanCheck) refetchClean()
  }

  const appendAttendanceSheets = (workbook: ReturnType<typeof utils.book_new>, report: AttendanceReport) => {
    const summaryRows = studentStats.map(({ student, present, inRoom, absent, pending, rate }) => ({
      [t.reports.tableName]: student.name,
      [t.reports.tableRoom]: student.room,
      [t.reports.tableBuilding]: capitalize(student.building),
      [t.reports.tablePresentDays]: present,
      [t.reports.tableInRoomDays]: inRoom,
      [t.reports.tableAbsentDays]: absent,
      [t.reports.tablePendingDays]: pending,
      [`${t.reports.tableAttendanceRate} (%)`]: rate,
    }))
    const summarySheet = utils.json_to_sheet(summaryRows)
    summarySheet["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }]
    utils.book_append_sheet(workbook, summarySheet, t.reports.sheetSummary)

    const statusLabel = (record: AttendanceReportRecord) => {
      switch (classifyRecord(record)) {
        case "present":
          return t.reports.excelStatusPresent
        case "in_room":
          return t.reports.excelStatusInRoom
        case "absent":
          return t.reports.excelStatusAbsent
        default:
          return t.reports.excelStatusPending
      }
    }

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
  }

  const appendCleanSheets = (workbook: ReturnType<typeof utils.book_new>, report: CleanCheckReport) => {
    const summaryRows = roomStats.map(({ room, clean, dirty, pending, rate }) => ({
      [t.reports.tableRoom]: room.room,
      [t.reports.tableBuilding]: capitalize(room.building),
      [t.reports.tableCleanDays]: clean,
      [t.reports.tableDirtyDays]: dirty,
      [t.reports.tablePendingDays]: pending,
      [`${t.reports.tableAttendanceRate} (%)`]: rate,
    }))
    const summarySheet = utils.json_to_sheet(summaryRows)
    summarySheet["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }]
    utils.book_append_sheet(workbook, summarySheet, t.reports.sheetCleanSummary)

    const statusLabel = (record: CleanCheckReportRecord) => {
      switch (classifyCleanRecord(record)) {
        case "clean":
          return t.reports.excelStatusClean
        case "dirty":
          return t.reports.excelStatusDirty
        case "pending":
          return t.reports.excelStatusPending
        default:
          return ""
      }
    }

    const dailyRows = report.rooms.map((room) => {
      const row: Record<string, string> = {
        [t.reports.tableRoom]: room.room,
        [t.reports.tableBuilding]: capitalize(room.building),
      }
      room.records.forEach((record) => {
        row[record.date] = statusLabel(record)
      })
      return row
    })
    const dailySheet = utils.json_to_sheet(dailyRows)
    dailySheet["!cols"] = [{ wch: 12 }, { wch: 16 }, ...report.dailyBreakdown.map(() => ({ wch: 10 }))]
    utils.book_append_sheet(workbook, dailySheet, t.reports.sheetCleanDaily)
  }

  const handleExport = () => {
    const canExportAttendance = showAttendance && !!attendanceReport && attendanceReport.students.length > 0
    const canExportClean = showCleanCheck && !!cleanReport && cleanReport.rooms.length > 0
    if (!canExportAttendance && !canExportClean) return

    setIsExporting(true)
    try {
      const workbook = utils.book_new()
      if (showAttendance && attendanceReport) appendAttendanceSheets(workbook, attendanceReport)
      if (showCleanCheck && cleanReport) appendCleanSheets(workbook, cleanReport)

      const metaReport = attendanceReport ?? cleanReport!
      const buildingPart = metaReport.buildingName ? metaReport.buildingName.toLowerCase() : "all"
      const prefix =
        reportsTabFilter === "attendance"
          ? "attendance-report"
          : reportsTabFilter === "cleanCheck"
            ? "clean-check-report"
            : "reports"
      writeFile(workbook, `${prefix}_${buildingPart}_${metaReport.startDate}_${metaReport.endDate}.xlsx`)
      toast.success(t.reports.exportSuccess)
    } catch {
      toast.error(t.reports.exportError)
    } finally {
      setIsExporting(false)
    }
  }

  const attendanceInitialLoading = showAttendance && attendanceLoading && !attendanceReport
  const cleanInitialLoading = showCleanCheck && cleanLoading && !cleanReport
  const isInitialLoading = attendanceInitialLoading || cleanInitialLoading

  const attendanceFailed = showAttendance && !attendanceReport
  const cleanFailed = showCleanCheck && !cleanReport
  const hasAnyError = (showAttendance && !!attendanceError) || (showCleanCheck && !!cleanError)
  const hasNoDataYet =
    (showAttendance && !attendanceReport && !showCleanCheck) ||
    (showCleanCheck && !cleanReport && !showAttendance) ||
    (reportsTabFilter === "all" && !attendanceReport && !cleanReport)

  const canExport =
    (showAttendance && !!attendanceReport && attendanceReport.students.length > 0) ||
    (showCleanCheck && !!cleanReport && cleanReport.rooms.length > 0)

  const tabs: { value: ReportsTabFilter; label: string }[] = [
    { value: "all", label: t.reports.tabAll },
    { value: "attendance", label: t.reports.tabAttendance },
    { value: "cleanCheck", label: t.reports.tabCleanCheck },
  ]

  return (
    <div>
      <Toaster position="top-right" />

      <div className="mb-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-6">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="shrink-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-oakwood-blue tracking-tight">{t.reports.title}</h1>
            <p className="text-slate-600 text-sm sm:text-base mt-1">{t.reports.subtitle}</p>
          </motion.div>

          <div className="card p-4 sm:p-5 w-full xl:w-auto">
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
              <button
                onClick={handleExport}
                disabled={!canExport || isExporting || isInitialLoading}
                className="btn-primary btn-md w-full sm:w-auto"
              >
                {isExporting ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
                {isExporting ? t.reports.exporting : t.reports.exportButton}
              </button>
            </div>
            {!isRangeValid && (
              <p className="text-sm text-red-500 mt-3">{t.reports.invalidRange}</p>
            )}
            {isRangeValid && isRangeTooLong && (
              <p className="text-sm text-red-500 mt-3">{t.reports.rangeTooLong}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 border-b border-slate-200 gap-3">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const active = reportsTabFilter === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setReportsTabFilter(tab.value)}
                  className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "text-oakwood-blue border-b-2 border-oakwood-gold"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-oakwood-blue" />
        </div>
      ) : hasNoDataYet ? (
        <div className="card p-10 text-center text-slate-400">
          {hasAnyError ? (
            <>
              <p className="mb-4">{t.reports.loadError}</p>
              <button onClick={handleRefetch} className="btn-primary btn-md">{t.reports.retry}</button>
            </>
          ) : (
            <p>{t.reports.invalidRange}</p>
          )}
        </div>
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {reportsTabFilter === "all" ? (
            attendanceFailed && cleanFailed ? (
              <div className="card p-8 text-center text-slate-400">
                <p className="mb-4">{t.reports.loadError}</p>
                <button onClick={handleRefetch} className="btn-primary btn-md">{t.reports.retry}</button>
              </div>
            ) : (
              <CombinedAllSection
                attendanceReport={attendanceReport}
                cleanReport={cleanReport}
                studentStats={studentStats}
                rangePreset={rangePreset}
                onRangePreset={applyRangePreset}
                t={t}
              />
            )
          ) : null}

          {reportsTabFilter === "attendance" && (
            attendanceFailed ? (
              <div className="card p-8 text-center text-slate-400">
                <p className="mb-4">{t.reports.loadError}</p>
                <button onClick={() => refetchAttendance()} className="btn-primary btn-md">{t.reports.retry}</button>
              </div>
            ) : attendanceReport ? (
              <AttendanceSection
                report={attendanceReport}
                studentStats={studentStats}
                rangePreset={rangePreset}
                onRangePreset={applyRangePreset}
                t={t}
              />
            ) : null
          )}

          {reportsTabFilter === "cleanCheck" && (
            cleanFailed ? (
              <div className="card p-8 text-center text-slate-400">
                <p className="mb-4">{t.reports.loadError}</p>
                <button onClick={() => refetchClean()} className="btn-primary btn-md">{t.reports.retry}</button>
              </div>
            ) : cleanReport ? (
              <CleanCheckSection
                report={cleanReport}
                roomStats={roomStats}
                rangePreset={rangePreset}
                onRangePreset={applyRangePreset}
                t={t}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  )
}

type StudentStat = {
  student: AttendanceReport["students"][number]
  present: number
  inRoom: number
  absent: number
  pending: number
  rate: number
}

type RoomStat = {
  room: CleanCheckReport["rooms"][number]
  clean: number
  dirty: number
  pending: number
  rate: number
}

function roomCleanKey(building: string, room: string, date: string) {
  return `${building.trim().toLowerCase()}|${String(room).trim().toLowerCase()}|${date}`
}

const CombinedAllSection = ({
  attendanceReport,
  cleanReport,
  studentStats,
  rangePreset,
  onRangePreset,
  t,
}: {
  attendanceReport?: AttendanceReport
  cleanReport?: CleanCheckReport
  studentStats: StudentStat[]
  rangePreset: RangePreset | null
  onRangePreset: (preset: RangePreset) => void
  t: Translation
}) => {
  const dates = useMemo(() => {
    const set = new Set<string>()
    attendanceReport?.dailyBreakdown.forEach((d) => set.add(d.date))
    cleanReport?.dailyBreakdown.forEach((d) => set.add(d.date))
    return [...set].sort()
  }, [attendanceReport, cleanReport])

  const useDayColumns = dates.length > 0 && dates.length <= COMBINED_DAY_COLUMNS_THRESHOLD
  const showBuildingColumn =
    (attendanceReport?.buildingId ?? cleanReport?.buildingId ?? null) === null

  const attendanceByDate = useMemo(() => {
    const m = new Map<string, AttendanceReport["dailyBreakdown"][number]>()
    attendanceReport?.dailyBreakdown.forEach((d) => m.set(d.date, d))
    return m
  }, [attendanceReport])

  const cleanByDate = useMemo(() => {
    const m = new Map<string, CleanCheckReport["dailyBreakdown"][number]>()
    cleanReport?.dailyBreakdown.forEach((d) => m.set(d.date, d))
    return m
  }, [cleanReport])

  const cleanLookup = useMemo(() => {
    const m = new Map<string, CleanCheckReportRecord>()
    cleanReport?.rooms.forEach((room) => {
      room.records.forEach((rec) => {
        m.set(roomCleanKey(room.building, room.room, rec.date), rec)
      })
    })
    return m
  }, [cleanReport])

  const cleanCheckDates = useMemo(
    () => new Set(cleanReport?.dailyBreakdown.map((d) => d.date) ?? []),
    [cleanReport]
  )

  const students = attendanceReport?.students ?? []

  // All KPIs use the latest day in range so Present/Absent/Pending align with Total Residents
  // (range totals sum student×day slots and look inflated next to headcount).
  const latestAttendance = attendanceReport?.dailyBreakdown.at(-1)
  const latestClean = cleanReport?.dailyBreakdown.at(-1)
  const occupiedRooms = useMemo(() => {
    if (cleanReport) return cleanReport.summary.totalRooms
    const list = attendanceReport?.students ?? []
    return new Set(list.map((s) => `${s.building}|${s.room}`)).size
  }, [cleanReport, attendanceReport])

  return (
    <>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-0.5">
        <KpiCard
          compact
          icon={Users}
          label={t.reports.kpiTotalStudents}
          value={attendanceReport?.summary.totalStudents ?? 0}
          accent="bg-oakwood-blue-50 text-oakwood-blue"
        />
        <KpiCard
          compact
          icon={UserCheck}
          label={t.reports.statusPresent}
          value={(latestAttendance?.present ?? 0) + (latestAttendance?.inRoom ?? 0)}
          accent="bg-green-50 text-green-600"
        />
        <KpiCard
          compact
          icon={UserX}
          label={t.reports.kpiAbsences}
          value={latestAttendance?.absent ?? 0}
          accent="bg-red-50 text-red-600"
        />
        <KpiCard
          compact
          icon={ClipboardCheck}
          label={t.reports.statusPending}
          value={latestAttendance?.pending ?? 0}
          accent="bg-slate-100 text-slate-600"
        />
        <KpiCard
          compact
          icon={DoorOpen}
          label={`${t.reports.kpiTotalRooms} (${t.reports.kpiRoomsOccupiedHint})`}
          value={occupiedRooms}
          accent="bg-slate-100 text-slate-700"
        />
        <KpiCard
          compact
          icon={Check}
          label={t.reports.statusClean}
          value={latestClean?.clean ?? 0}
          accent="bg-teal-50 text-teal-600"
        />
        <KpiCard
          compact
          icon={X}
          label={t.reports.kpiNotClean}
          value={latestClean?.dirty ?? 0}
          accent="bg-amber-50 text-amber-600"
        />
        <KpiCard
          compact
          icon={Sparkles}
          label={t.reports.kpiCleanPending}
          value={latestClean?.pending ?? 0}
          accent="bg-slate-100 text-slate-500"
        />
      </div>

      <div className="card p-3 sm:p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">Daily Trend</h2>
            <p className="text-xs text-slate-400">Attendance (left) · Clean check (right)</p>
          </div>
          <RangePresetToggle active={rangePreset} onChange={onRangePreset} t={t} />
        </div>

        {dates.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t.reports.dailyTrendEmpty}</p>
        ) : (
          <div className="flex items-end gap-1.5">
            {dates.map((date) => {
              const att = attendanceByDate.get(date)
              const cln = cleanByDate.get(date)
              const isCleanDay = cleanCheckDates.has(date)
              const attTotal = att?.total || 1
              const clnTotal = cln?.total || 1
              return (
                <div key={date} className="flex flex-col items-center gap-1 flex-1 min-w-[36px]">
                  <div className="w-full flex gap-0.5 text-[9px] font-semibold text-slate-400 uppercase tracking-wide leading-none">
                    <span className="flex-1 text-center" title={t.reports.tabAttendance}>A</span>
                    <span
                      className={`flex-1 text-center ${!isCleanDay ? "text-slate-300" : ""}`}
                      title={isCleanDay ? t.reports.tabCleanCheck : t.reports.notCleanCheckDay}
                    >
                      C
                    </span>
                  </div>
                  <div className="w-full flex items-end gap-0.5 h-16 sm:h-20">
                    <div className="flex-1 h-full rounded-sm bg-slate-100 overflow-hidden flex flex-col justify-end">
                      {att ? (
                        <>
                          {att.pending > 0 && <div style={{ height: `${(att.pending / attTotal) * 100}%` }} className="w-full bg-slate-300" />}
                          {att.absent > 0 && <div style={{ height: `${(att.absent / attTotal) * 100}%` }} className="w-full bg-red-500" />}
                          {(att.inRoom ?? 0) > 0 && <div style={{ height: `${((att.inRoom ?? 0) / attTotal) * 100}%` }} className="w-full bg-yellow-400" />}
                          {att.present > 0 && <div style={{ height: `${(att.present / attTotal) * 100}%` }} className="w-full bg-green-500" />}
                        </>
                      ) : null}
                    </div>
                    {isCleanDay ? (
                      <div className="flex-1 h-full rounded-sm bg-slate-100 overflow-hidden flex flex-col justify-end">
                        {cln ? (
                          <>
                            {cln.pending > 0 && <div style={{ height: `${(cln.pending / clnTotal) * 100}%` }} className="w-full bg-slate-300" />}
                            {cln.dirty > 0 && <div style={{ height: `${(cln.dirty / clnTotal) * 100}%` }} className="w-full bg-amber-500" />}
                            {cln.clean > 0 && <div style={{ height: `${(cln.clean / clnTotal) * 100}%` }} className="w-full bg-teal-500" />}
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <div
                        className="flex-1 h-full rounded-sm border border-dashed border-slate-200 bg-[repeating-linear-gradient(-45deg,#f8fafc,#f8fafc_3px,#e2e8f0_3px,#e2e8f0_6px)] flex items-center justify-center"
                        title={t.reports.notCleanCheckDay}
                      >
                        <span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">n/a</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">{shortDate(date)}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
          <span className="font-medium text-slate-500">Att:</span>
          <LegendDot color="bg-green-500" label={t.present} />
          <LegendDot color="bg-yellow-400" label={t.inRoom} />
          <LegendDot color="bg-red-500" label={t.absent} />
          <span className="font-medium text-slate-500 ml-1">Clean:</span>
          <LegendDot color="bg-teal-500" label={t.reports.statusClean} />
          <LegendDot color="bg-amber-500" label={t.reports.statusDirty} />
          <LegendDot color="bg-slate-300" label={t.pending} />
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <span className="w-3.5 h-2.5 rounded-sm border border-dashed border-slate-300 bg-[repeating-linear-gradient(-45deg,#f8fafc,#f8fafc_2px,#e2e8f0_2px,#e2e8f0_4px)]" />
            {t.reports.notCleanCheckDay}
          </span>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-5">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-800">{t.reports.studentDetailTitle}</h2>
            <p className="text-sm text-slate-400">
              {useDayColumns
                ? "Each day shows attendance (A) and clean check (C) for the resident's room"
                : t.reports.studentDetailSubtitleSummary}
            </p>
          </div>
          <RangePresetToggle active={rangePreset} onChange={onRangePreset} t={t} />
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-slate-400 py-10 text-center">{t.reports.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            {useDayColumns ? (
              <table
                className="w-full text-sm table-fixed"
                style={{ minWidth: 96 + dates.length * 96 }}
              >
                <colgroup>
                  <col style={{ width: '5rem' }} />
                  <col style={{ width: '2.5rem' }} />
                  {showBuildingColumn && <col style={{ width: '3.5rem' }} />}
                  {dates.map((date) => (
                    <Fragment key={date}>
                      <col style={{ width: '3rem' }} />
                      <col style={{ width: '3rem' }} />
                    </Fragment>
                  ))}
                </colgroup>
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="py-2 px-1" rowSpan={2}>{t.reports.tableName}</th>
                    <th className="py-2 px-0.5" rowSpan={2}>{t.reports.tableRoom}</th>
                    {showBuildingColumn && (
                      <th className="py-2 px-0.5" rowSpan={2}>{t.reports.tableBuilding}</th>
                    )}
                    {dates.map((date) => (
                      <th key={date} colSpan={2} className="py-2 px-0.5 text-center whitespace-nowrap border-l border-slate-100">
                        {shortDate(date)}
                      </th>
                    ))}
                  </tr>
                  <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                    {dates.map((date) => (
                      <Fragment key={date}>
                        <th className="py-1.5 px-0.5 text-center border-l border-slate-100" title={t.reports.tabAttendance}>A</th>
                        <th className="py-1.5 px-0.5 text-center" title={t.reports.tabCleanCheck}>C</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const attByDate = new Map(student.records.map((r) => [r.date, r]))
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-1 font-medium text-slate-800 truncate" title={student.name}>
                          {student.name}
                        </td>
                        <td className="py-2 px-0.5 text-slate-500 truncate" title={String(student.room)}>
                          {student.room}
                        </td>
                        {showBuildingColumn && (
                          <td className="py-2 px-0.5 text-slate-500 truncate capitalize" title={student.building}>
                            {capitalize(student.building)}
                          </td>
                        )}
                        {dates.map((date) => {
                          const att = attByDate.get(date)
                          const clean = cleanLookup.get(roomCleanKey(student.building, student.room, date))
                          const isCleanDay = cleanCheckDates.has(date)
                          const cleanNotApplicable =
                            !isCleanDay || (clean != null && clean.applicable === false)
                          return (
                            <Fragment key={date}>
                              <td className="py-2 px-0.5 text-center border-l border-slate-50">
                                {att ? <StatusIndicator record={att} t={t} /> : <span className="text-slate-300">–</span>}
                              </td>
                              <td className={`py-2 px-0.5 text-center ${cleanNotApplicable ? "bg-slate-50/80" : ""}`}>
                                {cleanNotApplicable ? (
                                  <CleanNotApplicable t={t} />
                                ) : clean ? (
                                  <CleanStatusIndicator record={clean} t={t} />
                                ) : (
                                  <span
                                    className="inline-flex w-5 h-5 rounded-full bg-slate-100 text-slate-400 items-center justify-center text-[11px]"
                                    title={t.reports.statusCleanPending}
                                  >
                                    –
                                  </span>
                                )}
                              </td>
                            </Fragment>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableName}</th>
                    <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableRoom}</th>
                    {showBuildingColumn && <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableBuilding}</th>}
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tablePresentDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableInRoomDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableAbsentDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableCleanDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableDirtyDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableAttendanceRate}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentStats.map(({ student, present, inRoom, absent, rate }) => {
                    const roomRecords =
                      cleanReport?.rooms.find(
                        (r) =>
                          r.room.trim().toLowerCase() === String(student.room).trim().toLowerCase() &&
                          r.building.trim().toLowerCase() === student.building.trim().toLowerCase()
                      )?.records ?? []
                    const applicable = roomRecords.filter((r) => r.applicable)
                    const clean = applicable.filter((r) => r.isClean === true).length
                    const dirty = applicable.filter((r) => r.isClean === false).length
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-2 font-medium text-slate-800 whitespace-nowrap">{student.name}</td>
                        <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{student.room}</td>
                        {showBuildingColumn && (
                          <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{capitalize(student.building)}</td>
                        )}
                        <td className="py-2.5 px-2 text-center font-medium text-green-600">{present}</td>
                        <td className="py-2.5 px-2 text-center font-medium text-yellow-600">{inRoom}</td>
                        <td className="py-2.5 px-2 text-center font-medium text-red-600">{absent}</td>
                        <td className="py-2.5 px-2 text-center font-medium text-teal-600">{clean}</td>
                        <td className="py-2.5 px-2 text-center font-medium text-amber-600">{dirty}</td>
                        <td className="py-2.5 px-2 text-center font-semibold text-slate-800">{rate}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  )
}

const AttendanceSection = ({
  report,
  studentStats,
  rangePreset,
  onRangePreset,
  t,
}: {
  report: AttendanceReport
  studentStats: StudentStat[]
  rangePreset: RangePreset | null
  onRangePreset: (preset: RangePreset) => void
  t: Translation
}) => {
  const dayCount = report.dailyBreakdown.length
  const useDayColumns = dayCount > 0 && dayCount <= DAY_COLUMNS_THRESHOLD
  const showBuildingColumn = report.buildingId === null

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard icon={Users} label={t.reports.kpiTotalStudents} value={report.summary.totalStudents} accent="bg-oakwood-blue-50 text-oakwood-blue" />
        <KpiCard icon={UserCheck} label={t.reports.kpiAttendanceRate} value={`${report.summary.attendanceRate}%`} accent="bg-green-50 text-green-600" />
        <KpiCard icon={ClipboardCheck} label={t.reports.kpiTotalCheckIns} value={report.summary.totalCheckIns} accent="bg-oakwood-gold-50 text-oakwood-gold-dark" />
        <KpiCard icon={UserX} label={t.reports.kpiAbsences} value={report.summary.absentCount} accent="bg-red-50 text-red-600" />
      </div>

      <div className="card p-3 sm:p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">{t.reports.dailyTrendTitle}</h2>
            <p className="text-xs text-slate-400">{t.reports.dailyTrendSubtitle}</p>
          </div>
          <RangePresetToggle active={rangePreset} onChange={onRangePreset} t={t} />
        </div>

        {report.dailyBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t.reports.dailyTrendEmpty}</p>
        ) : (
          <div className="flex items-end gap-1.5">
            {report.dailyBreakdown.map((day) => {
              const total = day.total || 1
              const presentPct = (day.present / total) * 100
              const inRoomPct = ((day.inRoom ?? 0) / total) * 100
              const absentPct = (day.absent / total) * 100
              const pendingPct = (day.pending / total) * 100
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
                  <div
                    className="w-full h-16 sm:h-20 rounded-md bg-slate-100 overflow-hidden flex flex-col justify-end"
                    title={`${day.date} — ${t.present}: ${day.present}, ${t.inRoom}: ${day.inRoom ?? 0}, ${t.absent}: ${day.absent}, ${t.pending}: ${day.pending}`}
                  >
                    {day.pending > 0 && <div style={{ height: `${pendingPct}%` }} className="w-full bg-slate-300" />}
                    {day.absent > 0 && <div style={{ height: `${absentPct}%` }} className="w-full bg-red-500" />}
                    {(day.inRoom ?? 0) > 0 && <div style={{ height: `${inRoomPct}%` }} className="w-full bg-yellow-400" />}
                    {day.present > 0 && <div style={{ height: `${presentPct}%` }} className="w-full bg-green-500" />}
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">{shortDate(day.date)}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2 border-t border-slate-100">
          <LegendDot color="bg-green-500" label={t.present} />
          <LegendDot color="bg-yellow-400" label={t.inRoom} />
          <LegendDot color="bg-red-500" label={t.absent} />
          <LegendDot color="bg-slate-300" label={t.pending} />
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-5">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-800">{t.reports.studentDetailTitle}</h2>
            <p className="text-sm text-slate-400">
              {useDayColumns ? t.reports.studentDetailSubtitleDaily : t.reports.studentDetailSubtitleSummary}
            </p>
          </div>
          <RangePresetToggle active={rangePreset} onChange={onRangePreset} t={t} />
        </div>

        {report.students.length === 0 ? (
          <p className="text-sm text-slate-400 py-10 text-center">{t.reports.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            {useDayColumns ? (
              <table className="w-full text-sm table-fixed" style={{ minWidth: 96 + dayCount * 56 }}>
                <colgroup>
                  <col style={{ width: '5rem' }} />
                  <col style={{ width: '2.5rem' }} />
                  {showBuildingColumn && <col style={{ width: '3.5rem' }} />}
                  {report.dailyBreakdown.map((day) => (
                    <col key={day.date} style={{ width: '3.5rem' }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="py-3 px-1">{t.reports.tableName}</th>
                    <th className="py-3 px-0.5">{t.reports.tableRoom}</th>
                    {showBuildingColumn && <th className="py-3 px-0.5">{t.reports.tableBuilding}</th>}
                    {report.dailyBreakdown.map((day) => (
                      <th key={day.date} className="py-3 px-0.5 text-center whitespace-nowrap">{shortDate(day.date)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-1 font-medium text-slate-800 truncate" title={student.name}>{student.name}</td>
                      <td className="py-2.5 px-0.5 text-slate-500 truncate" title={String(student.room)}>{student.room}</td>
                      {showBuildingColumn && (
                        <td className="py-2.5 px-0.5 text-slate-500 truncate capitalize" title={student.building}>
                          {capitalize(student.building)}
                        </td>
                      )}
                      {student.records.map((record) => (
                        <td key={record.date} className="py-2.5 px-0.5 text-center">
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
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableInRoomDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableAbsentDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tablePendingDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableAttendanceRate}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentStats.map(({ student, present, inRoom, absent, pending, rate }) => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-2 font-medium text-slate-800 whitespace-nowrap">{student.name}</td>
                      <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{student.room}</td>
                      {showBuildingColumn && <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{capitalize(student.building)}</td>}
                      <td className="py-2.5 px-2 text-center font-medium text-green-600">{present}</td>
                      <td className="py-2.5 px-2 text-center font-medium text-yellow-600">{inRoom}</td>
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
    </>
  )
}

const CleanCheckSection = ({
  report,
  roomStats,
  rangePreset,
  onRangePreset,
  t,
}: {
  report: CleanCheckReport
  roomStats: RoomStat[]
  rangePreset: RangePreset | null
  onRangePreset: (preset: RangePreset) => void
  t: Translation
}) => {
  const dayCount = report.dailyBreakdown.length
  const useDayColumns = dayCount > 0 && dayCount <= DAY_COLUMNS_THRESHOLD
  const showBuildingColumn = report.buildingId === null
  const totalChecks = report.summary.cleanCount + report.summary.dirtyCount

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard icon={DoorOpen} label={t.reports.kpiTotalRooms} value={report.summary.totalRooms} accent="bg-oakwood-blue-50 text-oakwood-blue" />
        <KpiCard icon={Sparkles} label={t.reports.kpiCleanRate} value={`${report.summary.cleanRate}%`} accent="bg-teal-50 text-teal-600" />
        <KpiCard icon={Check} label={t.reports.kpiCleanChecks} value={totalChecks} accent="bg-oakwood-gold-50 text-oakwood-gold-dark" />
        <KpiCard icon={X} label={t.reports.kpiNotClean} value={report.summary.dirtyCount} accent="bg-amber-50 text-amber-600" />
      </div>

      <div className="card p-3 sm:p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">{t.reports.cleanDailyTrendTitle}</h2>
            <p className="text-xs text-slate-400">{t.reports.cleanDailyTrendSubtitle}</p>
          </div>
          <RangePresetToggle active={rangePreset} onChange={onRangePreset} t={t} />
        </div>

        {report.dailyBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t.reports.dailyTrendEmpty}</p>
        ) : (
          <div className="flex items-end gap-1.5">
            {report.dailyBreakdown.map((day) => {
              const total = day.total || 1
              const cleanPct = (day.clean / total) * 100
              const dirtyPct = (day.dirty / total) * 100
              const pendingPct = (day.pending / total) * 100
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
                  <div
                    className="w-full h-16 sm:h-20 rounded-md bg-slate-100 overflow-hidden flex flex-col justify-end"
                    title={`${day.date} — ${t.reports.statusClean}: ${day.clean}, ${t.reports.statusDirty}: ${day.dirty}, ${t.reports.statusCleanPending}: ${day.pending}`}
                  >
                    {day.pending > 0 && <div style={{ height: `${pendingPct}%` }} className="w-full bg-slate-300" />}
                    {day.dirty > 0 && <div style={{ height: `${dirtyPct}%` }} className="w-full bg-amber-500" />}
                    {day.clean > 0 && <div style={{ height: `${cleanPct}%` }} className="w-full bg-teal-500" />}
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">{shortDate(day.date)}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2 border-t border-slate-100">
          <LegendDot color="bg-teal-500" label={t.reports.statusClean} />
          <LegendDot color="bg-amber-500" label={t.reports.statusDirty} />
          <LegendDot color="bg-slate-300" label={t.reports.statusCleanPending} />
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-5">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-800">{t.reports.cleanRoomDetailTitle}</h2>
            <p className="text-sm text-slate-400">
              {useDayColumns ? t.reports.cleanRoomDetailSubtitleDaily : t.reports.cleanRoomDetailSubtitleSummary}
            </p>
          </div>
          <RangePresetToggle active={rangePreset} onChange={onRangePreset} t={t} />
        </div>

        {report.rooms.length === 0 || dayCount === 0 ? (
          <p className="text-sm text-slate-400 py-10 text-center">{t.reports.cleanEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            {useDayColumns ? (
              <table className="w-full text-sm table-fixed" style={{ minWidth: 56 + dayCount * 56 }}>
                <colgroup>
                  <col style={{ width: '2.5rem' }} />
                  {showBuildingColumn && <col style={{ width: '3.5rem' }} />}
                  {report.dailyBreakdown.map((day) => (
                    <col key={day.date} style={{ width: '3.5rem' }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="py-3 px-0.5">{t.reports.tableRoom}</th>
                    {showBuildingColumn && <th className="py-3 px-0.5">{t.reports.tableBuilding}</th>}
                    {report.dailyBreakdown.map((day) => (
                      <th key={day.date} className="py-3 px-0.5 text-center whitespace-nowrap">{shortDate(day.date)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.rooms.map((room) => {
                    const byDate = new Map(room.records.map((r) => [r.date, r]))
                    return (
                      <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-0.5 font-medium text-slate-800 truncate" title={room.room}>{room.room}</td>
                        {showBuildingColumn && (
                          <td className="py-2.5 px-0.5 text-slate-500 truncate capitalize" title={room.building}>
                            {capitalize(room.building)}
                          </td>
                        )}
                        {report.dailyBreakdown.map((day) => {
                          const record = byDate.get(day.date)
                          return (
                            <td key={day.date} className="py-2.5 px-0.5 text-center">
                              {record ? <CleanStatusIndicator record={record} t={t} /> : <span className="text-slate-300">–</span>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableRoom}</th>
                    {showBuildingColumn && <th className="py-3 px-2 whitespace-nowrap">{t.reports.tableBuilding}</th>}
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableCleanDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableDirtyDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tablePendingDays}</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">{t.reports.tableAttendanceRate}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roomStats.map(({ room, clean, dirty, pending, rate }) => (
                    <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-2 font-medium text-slate-800 whitespace-nowrap">{room.room}</td>
                      {showBuildingColumn && <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{capitalize(room.building)}</td>}
                      <td className="py-2.5 px-2 text-center font-medium text-teal-600">{clean}</td>
                      <td className="py-2.5 px-2 text-center font-medium text-amber-600">{dirty}</td>
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
    </>
  )
}

const RangePresetToggle = ({
  active,
  onChange,
  t,
}: {
  active: RangePreset | null
  onChange: (preset: RangePreset) => void
  t: Translation
}) => (
  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shrink-0">
    {([
      { value: "today" as const, label: t.reports.filterToday },
      { value: "week" as const, label: t.reports.filterWeek },
    ]).map((option) => {
      const selected = active === option.value
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            selected
              ? "bg-white text-oakwood-blue shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

const KpiCard = ({
  icon: Icon,
  label,
  value,
  accent,
  compact = false,
}: {
  icon: any
  label: string
  value: string | number
  accent: string
  compact?: boolean
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`card ${compact ? "p-2.5 sm:p-3 flex-1 min-w-[6.5rem]" : "p-4 sm:p-5"}`}
  >
    <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
      <div
        className={`${compact ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-xl"} flex items-center justify-center shrink-0 ${accent}`}
      >
        <Icon size={compact ? 16 : 19} />
      </div>
      <div className="min-w-0">
        <p className={`text-slate-500 truncate ${compact ? "text-[10px] sm:text-xs leading-tight" : "text-xs sm:text-sm"}`}>
          {label}
        </p>
        <p className={`font-bold text-slate-900 leading-tight ${compact ? "text-base sm:text-lg" : "text-xl sm:text-2xl"}`}>
          {value}
        </p>
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
  const status = classifyRecord(record)
  if (status === "present") {
    return (
      <span
        className="inline-flex w-5 h-5 rounded-full bg-green-100 text-green-600 items-center justify-center text-[11px] font-bold"
        title={`${t.reports.statusPresent}${record.checkedBy ? ` — ${record.checkedBy}` : ""}`}
      >
        ✓
      </span>
    )
  }
  if (status === "in_room") {
    return (
      <span
        className="inline-flex w-5 h-5 rounded-full bg-yellow-100 text-yellow-700 items-center justify-center text-[11px] font-bold"
        title={`${t.reports.statusInRoom}${record.checkedBy ? ` — ${record.checkedBy}` : ""}`}
      >
        ◉
      </span>
    )
  }
  if (status === "absent") {
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

const CleanNotApplicable = ({ t }: { t: Translation }) => (
  <span
    className="inline-flex min-w-[1.25rem] h-5 px-1 rounded bg-slate-100 text-slate-400 items-center justify-center text-[9px] font-semibold uppercase tracking-wide"
    title={t.reports.notCleanCheckDay}
  >
    n/a
  </span>
)

const CleanStatusIndicator = ({ record, t }: { record: CleanCheckReportRecord; t: Translation }) => {
  const status = classifyCleanRecord(record)
  if (status === "na") {
    return <CleanNotApplicable t={t} />
  }
  if (status === "clean") {
    return (
      <span
        className="inline-flex w-5 h-5 rounded-full bg-teal-100 text-teal-600 items-center justify-center text-[11px] font-bold"
        title={`${t.reports.statusClean}${record.checkedBy ? ` — ${record.checkedBy}` : ""}`}
      >
        ✓
      </span>
    )
  }
  if (status === "dirty") {
    return (
      <span
        className="inline-flex w-5 h-5 rounded-full bg-amber-100 text-amber-600 items-center justify-center text-[11px] font-bold"
        title={`${t.reports.statusDirty}${record.checkedBy ? ` — ${record.checkedBy}` : ""}`}
      >
        ✗
      </span>
    )
  }
  return (
    <span className="inline-flex w-5 h-5 rounded-full bg-slate-100 text-slate-400 items-center justify-center text-[11px]" title={t.reports.statusCleanPending}>
      –
    </span>
  )
}

export default Reports

import { useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Toaster } from "react-hot-toast"
import { useQuery } from "@tanstack/react-query"
import {
  Building2, DoorOpen, Users, UserCheck, ArrowRight, ArrowUpRight,
  UserPlus, FileSpreadsheet, Wrench, ClipboardCheck, Clock, Loader2,
} from "lucide-react"
import { useStore } from "../store/useStore"
import { DateSelector } from "./DateSelector"

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

function Dashboard() {
  const {
    rooms,
    buildings,
    users,
    currentUser,
    selectedDate,
    accessToken,
    enableFetchRoomsQuery,
    enableFetchUsersQuery,
    setEnableFetchRoomsQuery,
    fetchRooms,
    fetchUsers,
    setRooms,
    setSelectedBuilding,
    setCurrentSection,
    getTranslation,
  } = useStore()

  const t = getTranslation()

  const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["overview-rooms", selectedDate],
    queryFn: fetchRooms,
    enabled: !!currentUser && !!accessToken,
  })

  useEffect(() => {
    if (roomsData) setRooms(roomsData)
  }, [roomsData])

  useQuery({
    queryKey: ["overview-users"],
    queryFn: fetchUsers,
    enabled: enableFetchUsersQuery,
  })

  useEffect(() => {
    if (currentUser && rooms.length === 0) setEnableFetchRoomsQuery(true)
  }, [currentUser])

  const isLoading = isLoadingRooms && rooms.length === 0

  // Supervisors are scoped to a single building: the whole dashboard revolves around it.
  const isScoped = !!currentUser?.building_id
  const visibleBuildings = useMemo(
    () => (isScoped ? buildings.filter((b) => b.id === currentUser?.building_id) : buildings),
    [buildings, isScoped, currentUser?.building_id]
  )

  const buildingStats = useMemo(() => {
    type Entry = { building: { name: string; code: string }; totalRooms: number; totalStudents: number; present: number; absent: number; inRoom: number; pending: number }
    const map = new Map<string, Entry>()
    visibleBuildings.forEach((b) => map.set(b.name, { building: b, totalRooms: b.room_count ?? 0, totalStudents: 0, present: 0, absent: 0, inRoom: 0, pending: 0 }))

    rooms.forEach((room) => {
      let entry = map.get(room.building)
      if (!entry) {
        entry = { building: { name: room.building, code: "" }, totalRooms: 0, totalStudents: 0, present: 0, absent: 0, inRoom: 0, pending: 0 }
        map.set(room.building, entry)
      }
      room.students.forEach((s) => {
        if (s.id === null) return
        entry!.totalStudents += 1
        if (s.isPresent === true || s.isPresent === 1) entry!.present++
        else if (s.inRoom === true || s.inRoom === 1) entry!.inRoom++
        else if ((s.isPresent === false || s.isPresent === 0) && (s.inRoom === false || s.inRoom === 0 || s.inRoom === null || s.inRoom === undefined)) entry!.absent++
        else entry!.pending++
      })
    })

    return Array.from(map.values()).sort((a, b) => b.totalStudents - a.totalStudents)
  }, [rooms, visibleBuildings])

  const totals = useMemo(() => {
    return buildingStats.reduce(
      (acc, b) => ({
        totalRooms: acc.totalRooms + (b.totalRooms || 0),
        totalStudents: acc.totalStudents + b.totalStudents,
        present: acc.present + b.present,
        absent: acc.absent + b.absent,
        inRoom: acc.inRoom + b.inRoom,
        pending: acc.pending + b.pending,
      }),
      { totalRooms: 0, totalStudents: 0, present: 0, absent: 0, inRoom: 0, pending: 0 }
    )
  }, [buildingStats])

  const attendanceRate = totals.totalStudents > 0 ? Math.round((totals.present / totals.totalStudents) * 100) : 0

  const recentActivity = useMemo(() => {
    const items: { name: string; building: string; room: string; checkedBy: string; time: string }[] = []
    rooms.forEach((room) => {
      room.students.forEach((s) => {
        if (s.id !== null && s.lastCheckedAt) {
          items.push({
            name: s.name,
            building: capitalize(room.building),
            room: `${room.suiteNumber ?? ""}${room.letter ?? ""}`,
            checkedBy: s.lastCheckedBy || "—",
            time: s.lastCheckedAt,
          })
        }
      })
    })
    return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6)
  }, [rooms])

  const donutSegments = [
    { key: "present", value: totals.present, color: "#22c55e" },
    { key: "inRoom", value: totals.inRoom, color: "#eab308" },
    { key: "absent", value: totals.absent, color: "#ef4444" },
    { key: "pending", value: totals.pending, color: "#cbd5e1" },
  ]
  const donutTotal = donutSegments.reduce((s, d) => s + d.value, 0) || 1
  let cumulative = 0
  const gradientParts = donutSegments.map((seg) => {
    const start = (cumulative / donutTotal) * 100
    cumulative += seg.value
    const end = (cumulative / donutTotal) * 100
    return `${seg.color} ${start}% ${end}%`
  })
  const donutStyle = { background: `conic-gradient(${gradientParts.join(", ")})` }

  const quickActions = isScoped
    ? [
        { icon: UserPlus, label: t.dashboard.quickActionAddUser, section: "users" as const, color: "bg-oakwood-blue-50 text-oakwood-blue" },
        { icon: ClipboardCheck, label: t.dashboard.quickActionAttendance, section: "attendance" as const, color: "bg-oakwood-gold-50 text-oakwood-gold-dark" },
        { icon: FileSpreadsheet, label: t.dashboard.quickActionImport, section: "import" as const, color: "bg-green-50 text-green-600" },
      ]
    : [
        { icon: Wrench, label: t.dashboard.quickActionAddBuilding, section: "setup" as const, color: "bg-oakwood-gold-50 text-oakwood-gold-dark" },
        { icon: UserPlus, label: t.dashboard.quickActionAddUser, section: "users" as const, color: "bg-oakwood-blue-50 text-oakwood-blue" },
        { icon: FileSpreadsheet, label: t.dashboard.quickActionImport, section: "import" as const, color: "bg-green-50 text-green-600" },
        { icon: ClipboardCheck, label: t.dashboard.quickActionAttendance, section: "attendance" as const, color: "bg-oakwood-gold-50 text-oakwood-gold-dark" },
      ]

  return (
    <div>
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-oakwood-blue tracking-tight">{t.dashboard.title}</h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">{t.dashboard.subtitle}</p>
        </motion.div>
        <div className="w-full sm:w-56">
          <DateSelector />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {isScoped ? (
          <KpiCard icon={UserPlus} label={t.dashboard.staff} value={users.length} accent="bg-oakwood-blue-50 text-oakwood-blue" />
        ) : (
          <KpiCard icon={Building2} label={t.dashboard.buildings} value={buildings.length} accent="bg-oakwood-blue-50 text-oakwood-blue" />
        )}
        <KpiCard icon={DoorOpen} label={t.dashboard.totalRooms} value={totals.totalRooms} accent="bg-oakwood-gold-50 text-oakwood-gold-dark" />
        <KpiCard icon={Users} label={t.dashboard.occupancy} value={totals.totalStudents} accent="bg-oakwood-gold-50 text-oakwood-gold-dark" isLoading={isLoading} />
        <KpiCard icon={UserCheck} label={t.dashboard.attendanceRate} value={`${attendanceRate}%`} accent="bg-green-50 text-green-600" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {isScoped ? (
          <>
            {/* For supervisors: Today's Breakdown on left (large) */}
            <div className="lg:col-span-2 card p-5 sm:p-6 flex flex-col">
              <h2 className="font-semibold text-slate-800 mb-6">{t.dashboard.todaysBreakdown}</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16 flex-1 py-4">
                <div className="relative w-40 h-40 shrink-0 rounded-full shadow-inner" style={donutStyle}>
                  <div className="absolute inset-[14px] rounded-full bg-white flex items-center justify-center flex-col shadow-sm">
                    <span className="text-3xl font-bold text-slate-800 leading-none">{attendanceRate}%</span>
                    <span className="text-sm text-slate-400 mt-1">present</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                    <div>
                      <p className="text-3xl font-bold text-slate-900 leading-none">{totals.present}</p>
                      <p className="text-sm text-slate-500 mt-1">{t.present}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-sm"></div>
                    <div>
                      <p className="text-3xl font-bold text-slate-900 leading-none">{totals.inRoom}</p>
                      <p className="text-sm text-slate-500 mt-1">In room</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm"></div>
                    <div>
                      <p className="text-3xl font-bold text-slate-900 leading-none">{totals.absent}</p>
                      <p className="text-sm text-slate-500 mt-1">{t.absent}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-slate-300 shadow-sm"></div>
                    <div>
                      <p className="text-3xl font-bold text-slate-900 leading-none">{totals.pending}</p>
                      <p className="text-sm text-slate-500 mt-1">{t.pending}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* For supervisors: Building info + Quick Actions on right (small) */}
            <div className="space-y-5">
              <div className="card p-5 sm:p-6">
                <h2 className="font-semibold text-slate-800 mb-4">{capitalize(visibleBuildings[0]?.name ?? "")}</h2>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-oakwood-blue" />
                  </div>
                ) : buildingStats.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Total Students</span>
                      <span className="font-semibold text-slate-900">{buildingStats[0].totalStudents}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Total Rooms</span>
                      <span className="font-semibold text-slate-900">{buildingStats[0].totalRooms}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex mt-3">
                      {buildingStats[0].present > 0 && <div className="h-full bg-green-500" style={{ width: `${(buildingStats[0].present / (buildingStats[0].present + buildingStats[0].absent + buildingStats[0].inRoom + buildingStats[0].pending || 1)) * 100}%` }} />}
                      {buildingStats[0].inRoom > 0 && <div className="h-full bg-yellow-500" style={{ width: `${(buildingStats[0].inRoom / (buildingStats[0].present + buildingStats[0].absent + buildingStats[0].inRoom + buildingStats[0].pending || 1)) * 100}%` }} />}
                      {buildingStats[0].absent > 0 && <div className="h-full bg-red-500" style={{ width: `${(buildingStats[0].absent / (buildingStats[0].present + buildingStats[0].absent + buildingStats[0].inRoom + buildingStats[0].pending || 1)) * 100}%` }} />}
                      {buildingStats[0].pending > 0 && <div className="h-full bg-slate-300" style={{ width: `${(buildingStats[0].pending / (buildingStats[0].present + buildingStats[0].absent + buildingStats[0].inRoom + buildingStats[0].pending || 1)) * 100}%` }} />}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">No data</p>
                )}
              </div>

              <div className="card p-5 sm:p-6">
                <h2 className="font-semibold text-slate-800 mb-4">{t.dashboard.quickActions}</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {quickActions.map((action) => (
                    <button
                      key={action.section}
                      onClick={() => setCurrentSection(action.section)}
                      className="flex flex-col items-start gap-2 p-3 rounded-xl border border-slate-100 hover:border-oakwood-gold hover:bg-oakwood-gold-50/40 transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                        <action.icon size={16} />
                      </div>
                      <span className="text-xs font-medium text-slate-700 leading-tight">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* For admins: Buildings overview on left (large) */}
            <div className="lg:col-span-2 card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-slate-800">{t.dashboard.buildingsOverview}</h2>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-7 h-7 animate-spin text-oakwood-blue" />
                </div>
              ) : buildingStats.length === 0 ? (
                <p className="text-sm text-slate-400 py-10 text-center">{t.dashboard.buildingsOverviewEmpty}</p>
              ) : (
                <div className="space-y-2">
                  {buildingStats.map((b) => {
                    const total = b.present + b.absent + b.inRoom + b.pending || 1
                    return (
                      <button
                        key={b.building.name}
                        onClick={() => { setSelectedBuilding(b.building.name); setCurrentSection("attendance") }}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-oakwood-gold hover:bg-oakwood-gold-50/40 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-oakwood-blue-50 text-oakwood-blue flex items-center justify-center shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className="font-medium text-slate-800 truncate">{capitalize(b.building.name)}</p>
                            <span className="text-xs text-slate-400 shrink-0">{b.totalStudents} / {b.totalRooms * 2} students</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                            {b.present > 0 && <div className="h-full bg-green-500" style={{ width: `${(b.present / total) * 100}%` }} />}
                            {b.inRoom > 0 && <div className="h-full bg-yellow-500" style={{ width: `${(b.inRoom / total) * 100}%` }} />}
                            {b.absent > 0 && <div className="h-full bg-red-500" style={{ width: `${(b.absent / total) * 100}%` }} />}
                            {b.pending > 0 && <div className="h-full bg-slate-300" style={{ width: `${(b.pending / total) * 100}%` }} />}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-oakwood-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* For admins: Today's Breakdown + Quick Actions on right */}
            <div className="space-y-5">
              <div className="card p-5 sm:p-6">
                <h2 className="font-semibold text-slate-800 mb-5">{t.dashboard.todaysBreakdown}</h2>
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 shrink-0 rounded-full" style={donutStyle}>
                    <div className="absolute inset-[9px] rounded-full bg-white flex items-center justify-center flex-col">
                      <span className="text-lg font-bold text-slate-800 leading-none">{attendanceRate}%</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">present</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <LegendRow color="bg-green-500" label={t.present} value={totals.present} />
                    <LegendRow color="bg-yellow-500" label="In room" value={totals.inRoom} />
                    <LegendRow color="bg-red-500" label={t.absent} value={totals.absent} />
                    <LegendRow color="bg-slate-300" label={t.pending} value={totals.pending} />
                  </div>
                </div>
              </div>

              <div className="card p-5 sm:p-6">
                <h2 className="font-semibold text-slate-800 mb-4">{t.dashboard.quickActions}</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {quickActions.map((action) => (
                    <button
                      key={action.section}
                      onClick={() => setCurrentSection(action.section)}
                      className="flex flex-col items-start gap-2 p-3 rounded-xl border border-slate-100 hover:border-oakwood-gold hover:bg-oakwood-gold-50/40 transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                        <action.icon size={16} />
                      </div>
                      <span className="text-xs font-medium text-slate-700 leading-tight">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const KpiCard = ({ icon: Icon, label, value, accent, isLoading }: { icon: any; label: string; value: string | number; accent: string; isLoading?: boolean }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 sm:p-5">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs sm:text-sm truncate">{label}</p>
        {isLoading ? (
          <div className="h-6 w-12 bg-slate-200 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        )}
      </div>
    </div>
  </motion.div>
)

const LegendRow = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
    <span className="text-slate-500 flex-1 truncate">{label}</span>
    <span className="font-semibold text-slate-800">{value}</span>
  </div>
)

export default Dashboard;

import { useMemo } from "react"
import { DoorOpen, Layers, Plus, Pencil, Trash2, Sparkles, Check, X } from "lucide-react"

export interface BlueprintSuite {
  id: number
  number: number | string
  room_count: number
}

export type AttendanceStatus = "present" | "in_room" | "absent" | "pending" | "empty" | "mixed"
export type CleanStatus = "clean" | "dirty" | "unchecked"

export interface BlueprintRoom {
  id: number
  suite_id: number | null
  suite_number: number | string | null
  letter: string | null
  number: number | string | null
  student_count: number
  /** Dashboard attendance tint: worst status among students */
  attendanceStatus?: AttendanceStatus
  /** Per-student statuses for split-color cells when mixed */
  attendanceStatuses?: AttendanceStatus[]
  /** Show clean-check corner badge when true for this date */
  isCleanCheckDay?: boolean
  /** clean | dirty | unchecked — only meaningful on clean-check days */
  cleanStatus?: CleanStatus | null
}

/** Infer floor from suite/room numbers like 101 → 1, 1205 → 12, 45 → 1 */
export function floorFromNumber(raw: number | string | null | undefined): number {
  if (raw === null || raw === undefined || raw === "") return 1
  const n = typeof raw === "number" ? raw : parseInt(String(raw).replace(/\D/g, ""), 10)
  if (!Number.isFinite(n) || n <= 0) return 1
  if (n < 100) return 1
  return Math.floor(n / 100) || 1
}

function unitLabel(layout: string, suite?: BlueprintSuite, room?: BlueprintRoom) {
  if (layout === "suite" && suite) return String(suite.number)
  if (room?.letter) return `${room.suite_number ?? ""}${room.letter}`.trim() || room.letter
  if (room?.number != null) return String(room.number)
  return "?"
}

/** Compact silhouette for collapsed building cards */
export function BuildingSilhouette({
  floors,
  unitsPerFloor = 4,
  className = "",
}: {
  floors: number
  unitsPerFloor?: number
  className?: string
}) {
  const safeFloors = Math.max(1, Math.min(floors, 12))
  const cols = Math.max(2, Math.min(unitsPerFloor, 6))

  return (
    <div className={`relative flex flex-col items-center ${className}`} aria-hidden>
      <div className="w-[78%] h-0 border-l-[12px] border-r-[12px] border-b-[8px] border-l-transparent border-r-transparent border-b-oakwood-blue-dark" />
      <div className="w-full rounded-t-[3px] bg-oakwood-blue-dark px-1 pt-1 pb-0.5 space-y-0.5 shadow-sm">
        {Array.from({ length: safeFloors }).map((_, fi) => (
          <div key={fi} className="flex gap-0.5 justify-center">
            {Array.from({ length: cols }).map((_, ci) => (
              <div
                key={ci}
                className="w-1.5 h-2 rounded-[1px] bg-oakwood-gold/85 border border-oakwood-gold-light/30"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="w-[112%] h-1 rounded-sm bg-slate-300/90" />
    </div>
  )
}

interface BuildingBlueprintProps {
  layoutType: "suite" | "shared_bath" | "standalone"
  floors: number
  suites: BlueprintSuite[]
  rooms: BlueprintRoom[]
  /** Hide add/edit/delete controls (dashboard view) */
  readOnly?: boolean
  /** Color cells by attendanceStatus instead of occupied/empty */
  attendanceMode?: boolean
  selectedSuiteId?: number | null
  onSelectSuite?: (suiteId: number) => void
  onEditSuite?: (suiteId: number) => void
  onDeleteSuite?: (suiteId: number) => void
  onAddSuite?: (floor: number) => void
  onSelectRoom?: (roomId: number) => void
  onEditRoom?: (roomId: number) => void
  onDeleteRoom?: (roomId: number) => void
  onAddRoom?: (floor: number, suiteId?: number) => void
  onAddFloor?: () => void
  className?: string
}

function rollupAttendance(statuses: AttendanceStatus[]): AttendanceStatus {
  if (!statuses.length || statuses.every((s) => s === "empty")) return "empty"
  const active = statuses.filter((s) => s !== "empty")
  const unique = [...new Set(active)]
  if (unique.length > 1) return "mixed"
  return unique[0] || "empty"
}

const STATUS_FILL: Record<AttendanceStatus, string> = {
  present: "#22c55e",
  in_room: "#facc15",
  absent: "#ef4444",
  pending: "#f1f5f9",
  mixed: "#e2e8f0",
  empty: "#94a3b8",
}

/** Distinct non-empty statuses for split coloring (order: present → in_room → absent → pending). */
function distinctActiveStatuses(statuses: AttendanceStatus[]): AttendanceStatus[] {
  const order: AttendanceStatus[] = ["present", "in_room", "absent", "pending"]
  const set = new Set(statuses.filter((s) => s !== "empty" && s !== "mixed"))
  return order.filter((s) => set.has(s))
}

function splitBackground(statuses: AttendanceStatus[]): string | undefined {
  const parts = distinctActiveStatuses(statuses)
  if (parts.length < 2) return undefined
  const step = 100 / parts.length
  const stops = parts
    .map((s, i) => {
      const color = STATUS_FILL[s]
      return `${color} ${i * step}% ${(i + 1) * step}%`
    })
    .join(", ")
  return `linear-gradient(135deg, ${stops})`
}

function unitTone(
  selected: boolean,
  occupied: boolean,
  attendanceMode: boolean,
  status?: AttendanceStatus
): string {
  if (selected) return "border-oakwood-gold bg-oakwood-gold text-oakwood-blue-dark shadow-md"
  if (attendanceMode) {
    switch (status) {
      case "present":
        return "border-green-600/30 bg-green-500 text-white"
      case "in_room":
        return "border-yellow-600/30 bg-yellow-400 text-yellow-950"
      case "absent":
        return "border-red-700/30 bg-red-500 text-white"
      case "pending":
        return "border-slate-300 bg-white text-slate-700"
      case "mixed":
        return "border-slate-400/50 text-slate-900"
      case "empty":
      default:
        return "border-slate-500/50 bg-slate-400 text-slate-800"
    }
  }
  return occupied
    ? "border-white/20 bg-oakwood-blue-light/90 text-white"
    : "border-slate-500/40 bg-slate-400 text-slate-800"
}

function unitSubTone(
  selected: boolean,
  occupied: boolean,
  attendanceMode: boolean,
  status?: AttendanceStatus,
  split = false
) {
  if (selected) return "text-oakwood-blue-dark/70"
  if (attendanceMode) {
    if (split) return "text-slate-900/75"
    if (status === "present" || status === "absent") return "text-white/75"
    if (status === "in_room") return "text-yellow-950/70"
    if (status === "empty") return "text-slate-700/80"
    if (status === "mixed") return "text-slate-800/80"
    return "text-slate-400"
  }
  return occupied ? "text-white/70" : "text-slate-700/80"
}

function rollupCleanStatus(rooms: BlueprintRoom[]): { isCleanCheckDay: boolean; cleanStatus: CleanStatus | null } {
  const checkRooms = rooms.filter((r) => r.isCleanCheckDay)
  if (!checkRooms.length) return { isCleanCheckDay: false, cleanStatus: null }
  if (checkRooms.some((r) => r.cleanStatus === "dirty")) return { isCleanCheckDay: true, cleanStatus: "dirty" }
  if (checkRooms.every((r) => r.cleanStatus === "clean")) return { isCleanCheckDay: true, cleanStatus: "clean" }
  return { isCleanCheckDay: true, cleanStatus: "unchecked" }
}

function CleanCheckBadge({ status }: { status: CleanStatus }) {
  const title =
    status === "clean" ? "Clean" : status === "dirty" ? "Not clean" : "Clean check pending"
  const tone =
    status === "clean"
      ? "bg-teal-500 text-white shadow-sm"
      : status === "dirty"
        ? "bg-amber-500 text-white shadow-sm"
        : "bg-white/90 text-slate-500 border border-slate-300/80 shadow-sm"
  const Icon = status === "clean" ? Check : status === "dirty" ? X : Sparkles
  return (
    <span
      title={title}
      className={`absolute top-1 right-1 z-[2] inline-flex h-4 w-4 items-center justify-center rounded-full ${tone}`}
    >
      <Icon size={9} strokeWidth={2.5} />
    </span>
  )
}

export function BuildingBlueprint({
  layoutType,
  floors,
  suites,
  rooms,
  readOnly = false,
  attendanceMode = false,
  selectedSuiteId,
  onSelectSuite,
  onEditSuite,
  onDeleteSuite,
  onAddSuite,
  onSelectRoom,
  onEditRoom,
  onDeleteRoom,
  onAddRoom,
  onAddFloor,
  className = "",
}: BuildingBlueprintProps) {
  const floorRows = useMemo(() => {
    const byFloor = new Map<number, { suites: BlueprintSuite[]; rooms: BlueprintRoom[] }>()
    const declared = Math.max(1, floors || 1)

    const ensure = (floor: number) => {
      if (!byFloor.has(floor)) byFloor.set(floor, { suites: [], rooms: [] })
    }

    for (let f = 1; f <= declared; f++) ensure(f)

    if (layoutType === "suite") {
      for (const suite of suites) {
        const floor = floorFromNumber(suite.number)
        ensure(floor)
        byFloor.get(floor)!.suites.push(suite)
      }
    } else {
      for (const room of rooms) {
        const floor = floorFromNumber(room.number ?? room.suite_number)
        ensure(floor)
        byFloor.get(floor)!.rooms.push(room)
      }
    }

    return [...byFloor.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([floor, data]) => ({
        floor,
        suites: data.suites.sort((a, b) => Number(a.number) - Number(b.number)),
        rooms: data.rooms.sort((a, b) =>
          String(a.number ?? a.letter ?? "").localeCompare(String(b.number ?? b.letter ?? ""), undefined, {
            numeric: true,
          })
        ),
      }))
  }, [layoutType, floors, suites, rooms])

  const floorCount = floorRows.length
  const showManage = !readOnly
  const showCleanLegend =
    attendanceMode && rooms.some((r) => r.isCleanCheckDay)

  return (
    <div
      className={`rounded-2xl border border-oakwood-blue/15 bg-gradient-to-b from-oakwood-blue-50/80 to-white p-4 sm:p-5 overflow-x-auto ${className}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-oakwood-blue/70">Building layout</p>
          <p className="text-sm text-slate-600 mt-0.5">
            {floorCount} floor{floorCount !== 1 ? "s" : ""}
            {layoutType === "suite"
              ? ` · ${suites.length} suite${suites.length !== 1 ? "s" : ""} · ${rooms.length} room${rooms.length !== 1 ? "s" : ""}`
              : ` · ${rooms.length} room${rooms.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 mr-2">
            {attendanceMode ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-green-500" /> Present
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-yellow-400" /> In room
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-500" /> Absent
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-white border border-slate-300" /> Pending
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm border border-slate-400/50"
                    style={{ backgroundImage: "linear-gradient(135deg, #22c55e 50%, #ef4444 50%)" }}
                  /> Mixed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-400 border border-slate-500/40" /> Empty
                </span>
                {showCleanLegend && (
                  <>
                    <span className="w-px h-3 bg-slate-200" />
                    <span className="inline-flex items-center gap-1.5" title="Clean">
                      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-500 text-white">
                        <Check size={8} strokeWidth={3} />
                      </span>
                      Clean
                    </span>
                    <span className="inline-flex items-center gap-1.5" title="Not clean">
                      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-white">
                        <X size={8} strokeWidth={3} />
                      </span>
                      Not clean
                    </span>
                    <span className="inline-flex items-center gap-1.5" title="Clean check pending">
                      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white border border-slate-300 text-slate-500">
                        <Sparkles size={8} />
                      </span>
                      Clean pending
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-oakwood-blue border border-oakwood-blue-dark/20" />
                  Occupied
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-400 border border-slate-500/40" />
                  Empty
                </span>
              </>
            )}
          </div>
          {showManage && onAddFloor && (
            <button type="button" onClick={onAddFloor} className="btn-secondary btn-sm text-xs" title="Add one empty floor">
              <Plus size={14} /> Floor
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        {/* Roof — slight 3D peak */}
        <div className="relative mx-[2%] sm:mx-[4%] h-6">
          <div className="absolute inset-x-0 bottom-0 h-0 border-l-[36px] border-r-[36px] border-b-[22px] border-l-transparent border-r-transparent border-b-oakwood-blue-dark drop-shadow-sm" />
          <div className="absolute inset-x-[8%] bottom-0 h-1.5 bg-oakwood-gold/90 rounded-sm" />
          <div className="absolute left-1/2 -translate-x-1/2 -top-0.5 w-2.5 h-2.5 rounded-full bg-oakwood-gold border-2 border-oakwood-blue-dark shadow-sm" />
        </div>

        <div className="relative rounded-t-lg border-x-[5px] border-t-[5px] border-oakwood-blue-dark bg-oakwood-blue shadow-[0_12px_28px_-8px_rgba(15,40,80,0.45)] overflow-visible">
          {/* Right depth strip */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-[10px] top-3 bottom-8 w-2.5 rounded-r-md bg-gradient-to-b from-oakwood-blue-dark via-[#0d2a4a] to-oakwood-blue-dark opacity-90 hidden sm:block"
            style={{ clipPath: "polygon(0 0, 100% 8px, 100% calc(100% - 8px), 0 100%)" }}
          />

          <div className="h-2.5 bg-gradient-to-b from-oakwood-gold to-oakwood-gold/75" />

          <div className="p-2.5 sm:p-4 space-y-0 bg-gradient-to-b from-oakwood-blue to-oakwood-blue-dark">
            {floorRows.map(({ floor, suites: floorSuites, rooms: floorRooms }, floorIdx) => {
              const units =
                layoutType === "suite"
                  ? floorSuites.map((suite) => {
                      const suiteRooms = rooms.filter((r) => r.suite_id === suite.id)
                      const occupied = suiteRooms.some((r) => r.student_count > 0)
                      const statusList = suiteRooms.flatMap((r) =>
                        r.attendanceStatuses?.length
                          ? r.attendanceStatuses
                          : [r.attendanceStatus || (r.student_count > 0 ? "pending" : "empty")]
                      )
                      const status = rollupAttendance(statusList)
                      const selected = selectedSuiteId === suite.id
                      const presentCount = suiteRooms.reduce((n, r) => n + (r.student_count || 0), 0)
                      const clean = rollupCleanStatus(suiteRooms)
                      return {
                        key: `s-${suite.id}`,
                        label: unitLabel(layoutType, suite),
                        sub: attendanceMode ? `${presentCount} st` : `${suite.room_count} rm`,
                        occupied,
                        status,
                        statusList,
                        selected,
                        isCleanCheckDay: clean.isCleanCheckDay,
                        cleanStatus: clean.cleanStatus,
                        onClick: () => onSelectSuite?.(suite.id),
                        onEdit: () => onEditSuite?.(suite.id),
                        onDelete: () => onDeleteSuite?.(suite.id),
                        onAddChild: () => onAddRoom?.(floor, suite.id),
                        icon: "suite" as const,
                      }
                    })
                  : floorRooms.map((room) => {
                      const occupied = room.student_count > 0
                      const statusList =
                        room.attendanceStatuses?.length
                          ? room.attendanceStatuses
                          : [room.attendanceStatus || (occupied ? "pending" : "empty")]
                      const status = rollupAttendance(statusList)
                      return {
                        key: `r-${room.id}`,
                        label: unitLabel(layoutType, undefined, room),
                        sub: `${room.student_count} st`,
                        occupied,
                        status,
                        statusList,
                        selected: false,
                        isCleanCheckDay: Boolean(room.isCleanCheckDay),
                        cleanStatus: room.cleanStatus ?? null,
                        onClick: () => onSelectRoom?.(room.id),
                        onEdit: () => onEditRoom?.(room.id),
                        onDelete: () => onDeleteRoom?.(room.id),
                        onAddChild: undefined,
                        icon: "room" as const,
                      }
                    })

              const isTop = floorIdx === 0
              const isBottom = floorIdx === floorRows.length - 1

              return (
                <div key={floor} className="relative">
                  {/* Floor slab ledge */}
                  <div
                    className={`relative ${isTop ? "" : "mt-3"}`}
                  >
                    {!isTop && (
                      <div className="absolute -top-3 left-0 right-0 h-3 flex items-end pointer-events-none">
                        <div className="w-full h-2 rounded-sm bg-gradient-to-b from-oakwood-blue-dark/40 to-transparent" />
                      </div>
                    )}

                    <div
                      className={`relative flex items-stretch gap-2 sm:gap-3 rounded-lg border border-white/15 bg-gradient-to-b from-white/[0.14] to-white/[0.04] p-2 sm:p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_12px_-4px_rgba(0,0,0,0.35)] ${
                        isBottom ? "mb-0" : ""
                      }`}
                    >
                      {/* Soft side face for depth */}
                      <div
                        aria-hidden
                        className="absolute -right-1 top-1 bottom-1 w-1.5 rounded-r bg-oakwood-blue-dark/50 hidden sm:block"
                      />

                      <div className="w-9 sm:w-11 shrink-0 flex flex-col items-center justify-center rounded-md bg-oakwood-blue-dark/55 border border-white/10 text-white shadow-inner">
                        <span className="text-[9px] uppercase tracking-wider opacity-70">Fl</span>
                        <span className="text-base sm:text-lg font-bold leading-none">{floor}</span>
                      </div>

                      <div
                        className="flex-1 grid gap-1.5 sm:gap-2"
                        style={{
                          gridTemplateColumns: `repeat(auto-fill, minmax(4.75rem, 1fr))`,
                        }}
                      >
                        {units.map((u) => {
                          const splitBg =
                            attendanceMode && !u.selected
                              ? splitBackground(u.statusList || [])
                              : undefined
                          const isSplit = Boolean(splitBg)
                          return (
                          <div
                            key={u.key}
                            className={`group relative min-h-[3.35rem] rounded-md border-2 px-1.5 py-1.5 text-left transition-all shadow-sm hover:-translate-y-0.5 hover:shadow-md overflow-hidden ${unitTone(
                              u.selected,
                              u.occupied,
                              attendanceMode,
                              isSplit ? "mixed" : u.status
                            )}`}
                            style={splitBg ? { backgroundImage: splitBg } : undefined}
                          >
                            <button type="button" onClick={u.onClick} className="relative z-[1] w-full text-left" title={u.label}>
                              <div className={`flex items-center gap-1 mb-0.5 ${isSplit ? "opacity-90" : "opacity-70"}`}>
                                {u.icon === "suite" ? <Layers size={10} /> : <DoorOpen size={10} />}
                                <span className="text-[9px] font-medium uppercase tracking-wide truncate">
                                  {u.icon === "suite" ? "Suite" : "Room"}
                                </span>
                              </div>
                              <p className={`text-xs sm:text-sm font-bold truncate leading-tight ${isSplit ? "drop-shadow-sm" : ""}`}>
                                {u.label}
                              </p>
                              <p
                                className={`text-[10px] mt-0.5 ${unitSubTone(
                                  u.selected,
                                  u.occupied,
                                  attendanceMode,
                                  u.status,
                                  isSplit
                                )}`}
                              >
                                {u.sub}
                              </p>
                            </button>
                            {attendanceMode && u.isCleanCheckDay && u.cleanStatus && (
                              <CleanCheckBadge status={u.cleanStatus} />
                            )}
                            {showManage && (
                              <div className="absolute top-1 right-1 z-[2] flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                {u.onAddChild && (
                                  <button
                                    type="button"
                                    title="Add room"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      u.onAddChild?.()
                                    }}
                                    className="p-1 rounded bg-black/10 hover:bg-black/20"
                                  >
                                    <Plus size={11} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  title="Edit"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    u.onEdit()
                                  }}
                                  className="p-1 rounded bg-black/10 hover:bg-black/20"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  type="button"
                                  title="Delete"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    u.onDelete()
                                  }}
                                  className="p-1 rounded bg-black/10 hover:bg-red-500/80 hover:text-white"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                          )
                        })}

                        {showManage && (
                          <button
                            type="button"
                            onClick={() =>
                              layoutType === "suite" ? onAddSuite?.(floor) : onAddRoom?.(floor)
                            }
                            className="min-h-[3.35rem] rounded-md border-2 border-dashed border-white/35 text-white/80 hover:border-oakwood-gold hover:text-oakwood-gold hover:bg-white/5 transition-colors flex flex-col items-center justify-center gap-0.5"
                          >
                            <Plus size={16} />
                            <span className="text-[10px] font-medium">
                              {layoutType === "suite" ? "Suite" : "Room"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Floor plate / slab edge between levels */}
                    {!isBottom && (
                      <div className="relative mt-1.5 mx-[-2px]">
                        <div className="h-1.5 rounded-sm bg-gradient-to-r from-oakwood-blue-dark via-slate-400/50 to-oakwood-blue-dark shadow-[0_2px_0_rgba(0,0,0,0.25)]" />
                        <div className="h-1 mx-1 rounded-b bg-oakwood-blue-dark/70" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center bg-oakwood-blue-dark pb-2.5 pt-2">
            <div className="w-12 h-8 rounded-t-md border-2 border-oakwood-gold/60 bg-gradient-to-b from-oakwood-gold/45 to-oakwood-gold/20 shadow-inner" />
          </div>
        </div>

        <div className="mx-[-1%] sm:mx-[-2%] h-2.5 rounded-b-md bg-gradient-to-b from-slate-400/80 to-slate-300/90 shadow-sm" />
        <div className="mx-[-3%] sm:mx-[-5%] h-2 rounded-full bg-slate-200/90 mt-0.5" />
      </div>
    </div>
  )
}

export default BuildingBlueprint

import { Pencil, Trash2, Plus, DoorOpen, Layers } from "lucide-react"
import { floorFromNumber } from "./BuildingBlueprint"

export interface TableSuite {
  id: number
  number: number | string
}

export interface TableStudent {
  id: number
  name: string
  lastname?: string | null
  student_uid?: string | null
}

export interface TableRoom {
  id: number
  suite_id: number | null
  suite_number: number | string | null
  letter: string | null
  number: number | string | null
  student_count: number
  students?: TableStudent[]
}

interface BuildingRoomsTableProps {
  layoutType: "suite" | "shared_bath" | "standalone"
  suites: TableSuite[]
  rooms: TableRoom[]
  onEditRoom: (roomId: number) => void
  onDeleteRoom: (roomId: number) => void
  onAddRoom: (floor: number, suiteId?: number) => void
  onEditSuite?: (suiteId: number) => void
  onDeleteSuite?: (suiteId: number) => void
  onAddSuite?: (floor: number) => void
}

function roomLabel(room: TableRoom) {
  if (room.letter) return `${room.suite_number ?? ""}${room.letter}`.trim() || room.letter
  if (room.number != null) return String(room.number)
  return "—"
}

function sortRooms(a: TableRoom, b: TableRoom) {
  const fa = floorFromNumber(a.number ?? a.suite_number)
  const fb = floorFromNumber(b.number ?? b.suite_number)
  if (fa !== fb) return fa - fb
  const na = Number(a.number ?? a.suite_number ?? 0)
  const nb = Number(b.number ?? b.suite_number ?? 0)
  if (na !== nb) return na - nb
  return String(a.letter || "").localeCompare(String(b.letter || ""))
}

export function BuildingRoomsTable({
  layoutType,
  suites,
  rooms,
  onEditRoom,
  onDeleteRoom,
  onAddRoom,
  onEditSuite,
  onDeleteSuite,
  onAddSuite,
}: BuildingRoomsTableProps) {
  const floors = [
    ...new Set([
      ...rooms.map((r) => floorFromNumber(r.number ?? r.suite_number)),
      ...suites.map((s) => floorFromNumber(s.number)),
      1,
    ]),
  ].sort((a, b) => a - b)

  const sortedRooms = [...rooms].sort(sortRooms)

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-oakwood-blue">Table view</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Spreadsheet-style list · click a row to edit room & students
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {layoutType === "suite" && onAddSuite && (
            <button
              type="button"
              onClick={() => onAddSuite(floors[floors.length - 1] || 1)}
              className="btn-secondary btn-sm text-xs"
            >
              <Plus size={13} /> Suite
            </button>
          )}
          <button
            type="button"
            onClick={() => onAddRoom(floors[floors.length - 1] || 1)}
            className="btn-secondary btn-sm text-xs"
          >
            <Plus size={13} /> Room
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[32rem]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5 font-semibold w-14">Floor</th>
              {layoutType === "suite" && <th className="px-3 py-2.5 font-semibold w-24">Suite</th>}
              <th className="px-3 py-2.5 font-semibold w-28">Room</th>
              <th className="px-3 py-2.5 font-semibold">Students</th>
              <th className="px-3 py-2.5 font-semibold w-16 text-center">#</th>
              <th className="px-3 py-2.5 font-semibold w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRooms.length === 0 ? (
              <tr>
                <td colSpan={layoutType === "suite" ? 6 : 5} className="px-3 py-8 text-center text-slate-400">
                  No rooms yet
                </td>
              </tr>
            ) : (
              sortedRooms.map((room) => {
                const floor = floorFromNumber(room.number ?? room.suite_number)
                const students = Array.isArray(room.students) ? room.students : []
                return (
                  <tr
                    key={room.id}
                    className="hover:bg-oakwood-blue-50/40 cursor-pointer transition-colors"
                    onClick={() => onEditRoom(room.id)}
                  >
                    <td className="px-3 py-2.5 text-slate-500 font-medium">{floor}</td>
                    {layoutType === "suite" && (
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Layers size={12} className="text-slate-400" />
                          {room.suite_number ?? "—"}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                        <DoorOpen size={13} className="text-oakwood-blue" />
                        {roomLabel(room)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {students.length ? (
                        <div className="flex flex-wrap gap-1">
                          {students.map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 max-w-[10rem] truncate"
                              title={
                                s.student_uid
                                  ? `${[s.name, s.lastname].filter(Boolean).join(" ")} (${s.student_uid})`
                                  : [s.name, s.lastname].filter(Boolean).join(" ")
                              }
                            >
                              {[s.name, s.lastname].filter(Boolean).join(" ")}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Empty</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-500 tabular-nums">
                      {students.length || room.student_count || 0}
                    </td>
                    <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          title="Edit room & students"
                          onClick={() => onEditRoom(room.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-oakwood-blue hover:bg-oakwood-blue-50"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete room"
                          onClick={() => onDeleteRoom(room.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {layoutType === "suite" && suites.length > 0 && (
        <div className="border-t border-slate-100 px-3 py-2 bg-slate-50/80">
          <p className="text-[11px] text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Suites</p>
          <div className="flex flex-wrap gap-1.5">
            {[...suites]
              .sort((a, b) => Number(a.number) - Number(b.number))
              .map((suite) => (
                <div
                  key={suite.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  <span className="font-semibold text-slate-700">#{suite.number}</span>
                  {onEditSuite && (
                    <button
                      type="button"
                      onClick={() => onEditSuite(suite.id)}
                      className="p-0.5 text-slate-400 hover:text-oakwood-blue"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                  {onDeleteSuite && (
                    <button
                      type="button"
                      onClick={() => onDeleteSuite(suite.id)}
                      className="p-0.5 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BuildingRoomsTable

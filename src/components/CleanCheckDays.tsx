"use client"

import { useCallback, useEffect, useState } from "react"
import { Sparkles, Loader2, Save } from "lucide-react"
import { useStore } from "../store/useStore"
import type { Weekday } from "../types"
import toast, { Toaster } from "react-hot-toast"
import { AccessRestricted } from "./AccessRestricted"

const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0] // Mon-first, Sun last

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const

export function CleanCheckDays({ embedded = false }: { embedded?: boolean }) {
  const {
    getTranslation,
    currentUser,
    buildings,
    fetchBuildings,
    fetchCleanCheckWeekdays,
    saveCleanCheckWeekdays,
  } = useStore()
  const t = getTranslation()

  const canManage =
    currentUser?.role === "admin" || currentUser?.role === "supervisor"

  const [selected, setSelected] = useState<Set<Weekday>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adminBuildingId, setAdminBuildingId] = useState<number | "">("")

  const buildingId =
    currentUser?.role === "supervisor"
      ? currentUser.building_id
      : adminBuildingId || buildings[0]?.id

  useEffect(() => {
    void fetchBuildings()
  }, [fetchBuildings])

  useEffect(() => {
    if (currentUser?.role === "admin" && !adminBuildingId && buildings.length > 0) {
      setAdminBuildingId(buildings[0].id)
    }
  }, [currentUser?.role, buildings, adminBuildingId])

  const loadWeekdays = useCallback(async () => {
    if (!buildingId) {
      setSelected(new Set())
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const weekdays = await fetchCleanCheckWeekdays(Number(buildingId))
      setSelected(new Set(weekdays))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load weekdays")
    } finally {
      setLoading(false)
    }
  }, [buildingId, fetchCleanCheckWeekdays])

  useEffect(() => {
    if (canManage) void loadWeekdays()
  }, [loadWeekdays, canManage])

  const toggle = (day: Weekday) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const handleSave = async () => {
    if (!buildingId) return
    setSaving(true)
    try {
      await saveCleanCheckWeekdays(Number(buildingId), [...selected].sort((a, b) => a - b) as Weekday[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (!canManage) {
    return <AccessRestricted />
  }

  const buildingLabel =
    currentUser?.role === "supervisor"
      ? buildings.find((b) => b.id === currentUser.building_id)?.name
      : buildings.find((b) => b.id === adminBuildingId)?.name

  return (
    <div>
      {!embedded && <Toaster position="top-right" />}

      {!embedded && (
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t.attendance.cleanCheckDaysTitle}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">
            {t.attendance.cleanCheckDaysSubtitle}
          </p>
        </div>
      )}

      <div className="card p-5 sm:p-6 mb-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {buildingLabel
                ? buildingLabel.charAt(0).toUpperCase() + buildingLabel.slice(1)
                : t.users.building}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">{t.attendance.cleanCheckDayHint}</p>
          </div>
        </div>

        {currentUser?.role === "admin" && (
          <div className="mb-5 max-w-sm">
            <label className="label">{t.users.building}</label>
            <select
              className="input"
              value={adminBuildingId}
              onChange={(e) => setAdminBuildingId(Number(e.target.value))}
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name.charAt(0).toUpperCase() + b.name.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-5">
              {WEEKDAY_ORDER.map((day) => {
                const active = selected.has(day)
                const label = t.attendance.weekdays[WEEKDAY_KEYS[day]]
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggle(day)}
                    className={`rounded-xl border px-3 py-3.5 text-sm font-medium transition-colors text-center ${
                      active
                        ? "border-teal-500 bg-teal-50 text-teal-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {selected.size === 0 && (
              <p className="text-sm text-slate-400 mb-4">{t.attendance.noCleanCheckDays}</p>
            )}

            <button
              type="button"
              className="btn-primary btn-md text-sm"
              disabled={saving || !buildingId}
              onClick={handleSave}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {t.attendance.saveCleanCheckWeekdays}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default CleanCheckDays

"use client"

import { Lock } from "lucide-react"
import { useStore } from "../store/useStore"

export function AccessRestricted() {
  const { getTranslation } = useStore()
  const t = getTranslation()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card p-8 sm:p-10 max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-5">
          <Lock size={26} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">{t.accessRestricted.title}</h2>
        <p className="text-slate-500 text-sm leading-relaxed">{t.accessRestricted.description}</p>
      </div>
    </div>
  )
}

export default AccessRestricted

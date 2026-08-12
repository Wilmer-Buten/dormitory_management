import React, { useEffect, useState } from "react"
import { useStore } from "../store/useStore"

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
}

export const DateTimeDisplay: React.FC = () => {
  const { language } = useStore()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(interval)
  }, [])

  const locale = LOCALE_MAP[language] ?? "en-US"
  const dateLabel = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })
  const timeLabel = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="hidden sm:inline text-sm font-medium text-white/80 capitalize truncate">{dateLabel}</span>
      <span className="hidden sm:inline text-white/40">·</span>
      <span className="text-sm font-semibold text-white tabular-nums whitespace-nowrap">{timeLabel}</span>
    </div>
  )
}

export default DateTimeDisplay

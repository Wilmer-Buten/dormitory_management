import type React from "react"

const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
}

export default Skeleton


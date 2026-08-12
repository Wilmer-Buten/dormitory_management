import type React from "react"
import { motion } from "framer-motion"
import { Menu, Transition } from "@headlessui/react"
import { ChevronDown, LogOut, User } from "lucide-react"
import { useStore } from "../store/useStore"
import { useQueryClient } from "@tanstack/react-query"

interface UserProfileProps {
  compact?: boolean
}

export const UserProfile: React.FC<UserProfileProps> = ({ compact = false }) => {
  const { currentUser, getTranslation, logout } = useStore()
  const t = getTranslation()
  const queryClient = useQueryClient();
  if (!currentUser) return null

  const handleLogout = () => {
    logout()
    queryClient.clear();
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        as={motion.div}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 cursor-pointer hover:bg-white/10 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-oakwood-gold flex items-center justify-center text-oakwood-blue-dark font-semibold text-sm shrink-0">
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        {!compact && (
          <div className="hidden sm:block text-left">
            <p className="text-xs text-white/70 leading-none">{t.welcome},</p>
            <p className="font-semibold text-white text-sm leading-tight">{[currentUser.name, currentUser.lastname].filter(Boolean).join(" ")}</p>
          </div>
        )}
        <ChevronDown size={15} className="hidden sm:block text-white/70" />
      </Menu.Button>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-60 origin-top-right rounded-xl bg-white shadow-popover ring-1 ring-slate-100 focus:outline-none overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-sm truncate">{[currentUser.name, currentUser.lastname].filter(Boolean).join(" ")}</p>
            <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
          </div>
          <div className="p-1.5">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-brand-50 text-brand-700" : "text-slate-700"
                  } group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors`}
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  {t.profile}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? "bg-red-50 text-red-600" : "text-slate-700"
                  } group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors`}
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t.settings.logout}
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

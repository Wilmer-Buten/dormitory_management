"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  User,
  Settings,
  Menu,
  FileSpreadsheet,
  Building2,
  X,
  Wrench,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Calendar,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "../store/useStore"
import tempLogo from "../assets/temp_logo.webp"
import CopyrightText from "./CopyrightText"
import { UserProfile } from "./UserProfile"
import { DateTimeDisplay } from "./DateTimeDisplay"
import SemesterBadge from "./SemesterBadge"

interface LayoutProps {
  children: React.ReactNode
}

type Section = "dashboard" | "attendance" | "users" | "settings" | "import" | "setup" | "reports" | "students"
type UsersRoleFilter = "all" | "admin" | "supervisor" | "staff"

interface SubMenuItem {
  label: string
  value: string
  icon?: LucideIcon
}

interface NavMenuItem {
  icon: LucideIcon
  label: string
  path: string
  subItems?: SubMenuItem[]
  // "filter": clicking the parent navigates to `path`, subitems filter content within that same section (e.g. Users)
  // "nav": the parent is just an expandable group, subitems navigate to their own section (e.g. Setup)
  subMode?: "filter" | "nav"
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const { getTranslation, currentSection, setCurrentSection, currentUser, usersRoleFilter, setUsersRoleFilter } = useStore()
  const t = getTranslation()

  // Close mobile menu when switching to desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const usersSubItems: SubMenuItem[] =
    currentUser?.role === "supervisor"
      ? [
          { label: t.users.roles.all, value: "all" },
          { label: t.users.roles.supervisor, value: "supervisor" },
          { label: t.users.roles.staff, value: "staff" },
        ]
      : [
          { label: t.users.roles.all, value: "all" },
          { label: t.users.roles.admin, value: "admin" },
          { label: t.users.roles.supervisor, value: "supervisor" },
          { label: t.users.roles.staff, value: "staff" },
        ]

  const setupSubItems: SubMenuItem[] = [
    { label: t.menu.dormitories, value: "setup", icon: Building2 },
    { label: "Semesters", value: "semesters", icon: Calendar },
    { label: t.menu.import, value: "import", icon: FileSpreadsheet },
  ]

  const menuItems: NavMenuItem[] =
    currentUser?.role === "staff"
      ? [
          { icon: ClipboardCheck, label: t.menu.attendance, path: "attendance" },
          { icon: Settings, label: t.menu.settings, path: "settings" },
        ]
      : currentUser?.role === "supervisor"
      ? [
          { icon: LayoutDashboard, label: t.menu.dashboard, path: "dashboard" },
          { icon: ClipboardCheck, label: t.menu.attendance, path: "attendance" },
          { icon: User, label: "Residents", path: "students" },
          { icon: FileText, label: t.menu.reports, path: "reports" },
          { icon: Users, label: t.menu.users, path: "users", subMode: "filter", subItems: usersSubItems },
          { icon: Wrench, label: t.menu.setup, path: "setup-group", subMode: "nav", subItems: setupSubItems },
          { icon: Settings, label: t.menu.settings, path: "settings" },
        ]
      : [
          { icon: LayoutDashboard, label: t.menu.dashboard, path: "dashboard" },
          { icon: ClipboardCheck, label: t.menu.attendance, path: "attendance" },
          { icon: User, label: "Residents", path: "students" },
          { icon: FileText, label: t.menu.reports, path: "reports" },
          { icon: Users, label: t.menu.users, path: "users", subMode: "filter", subItems: usersSubItems },
          { icon: Wrench, label: t.menu.setup, path: "setup-group", subMode: "nav", subItems: setupSubItems },
          { icon: Settings, label: t.menu.settings, path: "settings" },
        ]

  const isItemActive = (item: NavMenuItem) =>
    item.subMode === "nav" ? item.subItems?.some((sub) => sub.value === currentSection) ?? false : currentSection === item.path

  const isGroupExpanded = (item: NavMenuItem) => {
    if (!item.subItems || item.subItems.length === 0) return false
    if (item.subMode === "nav") return expandedGroups[item.path] ?? isItemActive(item)
    return currentSection === item.path
  }

  const isSubItemActive = (item: NavMenuItem, sub: SubMenuItem) =>
    item.subMode === "nav" ? currentSection === sub.value : usersRoleFilter === sub.value

  const handleItemClick = (item: NavMenuItem, closeMobile: boolean) => {
    if (item.subMode === "nav") {
      // If sidebar is collapsed and menu has subitems, expand sidebar and menu
      if (!isDesktopSidebarOpen && item.subItems && item.subItems.length > 0) {
        setIsDesktopSidebarOpen(true)
        setExpandedGroups((prev) => ({ ...prev, [item.path]: true }))
      } else {
        setExpandedGroups((prev) => ({ ...prev, [item.path]: !isGroupExpanded(item) }))
      }
    } else {
      setCurrentSection(item.path as Section)
      if (closeMobile) setIsMobileMenuOpen(false)
    }
  }

  const handleSubItemClick = (item: NavMenuItem, sub: SubMenuItem, closeMobile: boolean) => {
    if (item.subMode === "nav") {
      setCurrentSection(sub.value as Section)
    } else {
      setUsersRoleFilter(sub.value as UsersRoleFilter)
    }
    if (closeMobile) setIsMobileMenuOpen(false)
  }

  const collapsedRailTarget = (item: NavMenuItem): Section =>
    (item.subMode === "nav" && item.subItems && item.subItems.length > 0 ? item.subItems[0].value : item.path) as Section

  const NavButton = ({
    item,
    active,
    expanded,
    onClick,
  }: {
    item: NavMenuItem
    active: boolean
    expanded: boolean
    onClick: () => void
  }) => {
    const hasSubItems = !!item.subItems && item.subItems.length > 0
    return (
      <button
        onClick={onClick}
        aria-expanded={hasSubItems ? expanded : undefined}
        className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all ${
          active 
            ? "bg-oakwood-gold text-oakwood-blue-dark shadow-md font-semibold" 
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        <item.icon size={19} className={active ? "text-oakwood-blue-dark" : "text-white/70 group-hover:text-white"} />
        <span className="font-medium text-sm truncate">{item.label}</span>
        {hasSubItems && (
          <ChevronDown
            size={15}
            className={`ml-auto shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""} ${active ? "text-oakwood-blue-dark" : "text-white/70"}`}
          />
        )}
      </button>
    )
  }

  const NavSubItems = ({ item, closeMobile }: { item: NavMenuItem; closeMobile: boolean }) => (
    <div className="ml-8 mb-2 pl-2 border-l border-white/20 space-y-0.5">
      {item.subItems!.map((sub) => {
        const isSubActive = isSubItemActive(item, sub)
        return (
          <button
            key={sub.value}
            onClick={() => handleSubItemClick(item, sub, closeMobile)}
            className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-sm truncate transition-colors ${
              isSubActive ? "bg-oakwood-gold/20 text-oakwood-gold font-medium" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {sub.icon && <sub.icon size={15} className={isSubActive ? "text-oakwood-gold" : "text-white/60"} />}
            <span className="truncate">{sub.label}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] md:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed inset-y-0 left-0 z-40 w-[78vw] max-w-[280px] bg-oakwood-blue shadow-2xl md:hidden flex flex-col border-r border-oakwood-blue-dark"
              style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
              <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <img src={tempLogo || "/placeholder.svg"} alt="Oakwood Logo" className="w-9 h-9 object-contain bg-white rounded-full p-1" />
                  <span className="font-bold text-lg text-white">Dorm Control</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                {currentUser === null ? (
                  <>
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex items-center gap-3 p-3 mb-2">
                        <div className="w-5 h-5 bg-slate-200 rounded-md animate-pulse" />
                        <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </>
                ) : (
                  menuItems.map((item) => (
                    <div key={item.path}>
                      <NavButton
                        item={item}
                        active={isItemActive(item)}
                        expanded={isGroupExpanded(item)}
                        onClick={() => handleItemClick(item, true)}
                      />
                      {item.subItems && isGroupExpanded(item) && <NavSubItems item={item} closeMobile />}
                    </div>
                  ))
                )}
              </nav>

              <div className="flex-none p-4 border-t border-white/10">
                <div className="text-white/60 text-xs text-center">
                  <CopyrightText />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        initial={{ width: isDesktopSidebarOpen ? 248 : 76 }}
        animate={{ width: isDesktopSidebarOpen ? 248 : 76 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col bg-oakwood-blue relative shadow-lg border-r border-oakwood-blue-dark"
      >
        <button
          onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          className="absolute -right-3 top-8 z-10 w-6 h-6 rounded-full bg-oakwood-gold border-2 border-oakwood-gold-dark shadow-md flex items-center justify-center text-oakwood-blue-dark hover:bg-oakwood-gold-light transition-colors"
          title={isDesktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isDesktopSidebarOpen ? <ChevronsLeft size={13} /> : <ChevronsRight size={13} />}
        </button>

        <div className="flex-1 flex flex-col p-3 overflow-y-auto">
          <div className={`flex items-center gap-2.5 mb-6 px-2 pt-3 ${isDesktopSidebarOpen ? "" : "justify-center"}`}>
            <img src={tempLogo || "/placeholder.svg"} alt="Oakwood Logo" className="w-10 h-10 object-contain shrink-0 bg-white rounded-full p-1" />
            {isDesktopSidebarOpen && <span className="font-bold text-lg text-white truncate">Dorm Control</span>}
          </div>

          <nav className="flex-1">
            {currentUser === null ? (
              <>
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 mb-2">
                    <div className="w-5 h-5 bg-slate-200 rounded-md animate-pulse" />
                    {isDesktopSidebarOpen && <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />}
                  </div>
                ))}
              </>
            ) : (
              menuItems.map((item) => {
                const active = isItemActive(item)
                return isDesktopSidebarOpen ? (
                  <div key={item.path}>
                    <NavButton
                      item={item}
                      active={active}
                      expanded={isGroupExpanded(item)}
                      onClick={() => handleItemClick(item, false)}
                    />
                    {item.subItems && isGroupExpanded(item) && <NavSubItems item={item} closeMobile={false} />}
                  </div>
                ) : (
                  <button
                    key={item.path}
                    onClick={() => {
                      // If item has subitems, open sidebar and expand menu
                      if (item.subItems && item.subItems.length > 0) {
                        setIsDesktopSidebarOpen(true)
                        setExpandedGroups((prev) => ({ ...prev, [item.path]: true }))
                      } else {
                        setCurrentSection(collapsedRailTarget(item))
                      }
                    }}
                    title={item.label}
                    className={`relative w-full flex items-center justify-center py-2.5 rounded-xl mb-1 transition-colors ${
                      active ? "bg-oakwood-gold text-oakwood-blue-dark" : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon size={19} />
                  </button>
                )
              })
            )}
          </nav>
        </div>

        {isDesktopSidebarOpen && (
          <div className="flex-none p-4 border-t border-white/10">
            <div className="text-white/60 text-xs text-center">
              <CopyrightText />
            </div>
          </div>
        )}
      </motion.div>

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header
          className="flex-none flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16 bg-white border-b-2 border-oakwood-gold shadow-sm z-10"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <DateTimeDisplay />
          <div className="ml-auto flex items-center gap-3">
            <SemesterBadge />
            <UserProfile compact />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="w-full px-16 py-4 sm:py-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

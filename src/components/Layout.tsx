import type React from "react"
import { useState, useEffect } from "react"
import { LayoutDashboard, Users, Settings, Menu, FileSpreadsheet, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "../store/useStore"
import tempLogo from '../assets/temp_logo.webp'
import CopyrightText from "./CopyrightText"
interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const { getTranslation, currentSection, setCurrentSection, currentUser } = useStore()
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

  const menuItems = currentUser?.building_id
    ? [
        { icon: LayoutDashboard, label: t.menu.dashboard, path: "dashboard" },
        { icon: Settings, label: t.menu.settings, path: "settings" },
      ]
    : [
        { icon: LayoutDashboard, label: t.menu.dashboard, path: "dashboard" },
        { icon: Users, label: t.menu.users, path: "users" },
        { icon: FileSpreadsheet, label: t.menu.import, path: "import" },
        { icon: Settings, label: t.menu.settings, path: "settings" },
      ]

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-20 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: "tween" }}
            className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 md:hidden p-4"
          >
            <div className="flex flex-col items-center mb-8">
              <img
                src={tempLogo}
                alt="DormControl Logo"
                className="w-16 h-16 object-contain mb-2"
              />
              <h1 className="font-bold text-xl text-gray-800">DormControl</h1>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="mb-8">
              {currentUser === null ? (
                // Skeleton loader
                <>
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex items-center gap-3 p-3 mb-2">
                      <div className="w-5 h-5 bg-gray-200 rounded-md animate-pulse"></div>
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </>
              ) : (
                menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setCurrentSection(item.path as "dashboard" | "users" | "settings" | "import")
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                      currentSection === item.path ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))
              )}
            </nav>

            <div className="mt-8 mt-8 border-t border-gray-200 pt-4">
              <CopyrightText />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        initial={{ width: isDesktopSidebarOpen ? 240 : 80 }}
        animate={{ width: isDesktopSidebarOpen ? 240 : 80 }}
        className="hidden md:flex bg-white border-r border-gray-200 p-4"
      >
        <div className="flex flex-col w-full">
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              className="cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              <img
                src={tempLogo}
                alt="DormControl Logo"
                className={`${isDesktopSidebarOpen ? 'w-24 h-24' : 'w-12 h-12'} object-contain mb-2 transition-all duration-200`}
              />
            </button>
          </div>

          <nav className="mb-8">
            {currentUser === null ? (
              // Skeleton loader
              <>
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 mb-2">
                    <div className="w-5 h-5 bg-gray-200 rounded-md animate-pulse"></div>
                    {isDesktopSidebarOpen && <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>}
                  </div>
                ))}
              </>
            ) : (
              menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => setCurrentSection(item.path as "dashboard" | "users" | "settings" | "import")}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                    currentSection === item.path ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                  }`}
                >
                  <item.icon size={20} />
                  {isDesktopSidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              ))
            )}
          </nav>

          {isDesktopSidebarOpen && (
            <div className="mt-8 border-t border-gray-200 pt-4">
              <CopyrightText />
            </div>
          )}
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
    </div>
  )
}
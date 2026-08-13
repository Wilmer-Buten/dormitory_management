"use client"

import { useEffect, useMemo, useRef, useState, Fragment } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Toaster } from "react-hot-toast"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import { SearchBar } from "../components/SearchBar"
import { DateSelector } from "../components/DateSelector"
import { ViewToggle } from "../components/ViewToggle"
import { BuildingSelector } from "../components/BuildingSelector"
import { FloorSelector } from "../components/FloorSelector"
import { Stats } from "../components/Stats"
import { RoomCard } from "../components/RoomCard"
import { SuiteCard } from "../components/SuiteCard"
import { useStore } from "../store/useStore"
import { useQuery } from "@tanstack/react-query"
import { Pagination } from "./Pagination"
import { floorFromRoom } from "../types"

function Attendance() {
  const {
    rooms,
    searchQuery,
    viewMode,
    selectedSuite,
    selectedBuilding,
    selectedFloor,
    enableFetchRoomsQuery,
    currentPage, 
    currentUser, 
    selectedStat,
    selectedDate,
    isCleanCheckDay,
    setEnableFetchRoomsQuery,
    onPageChange,
    setSelectedSuite,
    getSuites,
    getTranslation,
    fetchRooms,
    setRooms,
    getFilteredRooms,
    setViewMode,
    getDefaultViewMode,
    fetchCleanCheckStatus,
    isLoading
  } = useStore()

  const [refreshDone, setRefreshDone] = useState(false)
  const hasSetInitialViewMode = useRef(false)
  const itemsPerPage = 18 

  const { data, error, isLoading: isLoadingRooms, refetch } = useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    enabled: enableFetchRoomsQuery
    
  })

  useEffect(() => { 
    if(currentUser &&rooms.length === 0){
      setEnableFetchRoomsQuery(true)
    }
  }, [currentUser])

  useEffect(() => {
    if (enableFetchRoomsQuery) {
      refetch().finally(() => setEnableFetchRoomsQuery(false)); 
      setRefreshDone(true)
    }
  }, [enableFetchRoomsQuery]);

  useEffect(() => {
    if (data && refreshDone) {
      setRooms(data)
      setRefreshDone(false)
      if (!hasSetInitialViewMode.current) {
        hasSetInitialViewMode.current = true
        setViewMode(getDefaultViewMode())
      }
    }
  }, [data, currentUser])

  useEffect(() => {
    void fetchCleanCheckStatus()
  }, [selectedDate, selectedBuilding, fetchCleanCheckStatus])

  const t = getTranslation()

  const filteredRooms = useMemo(() => {
    return getFilteredRooms();
  }, [selectedStat, searchQuery, selectedBuilding, selectedSuite, selectedFloor, rooms]);

  const suites = useMemo(() => getSuites(), [rooms, selectedBuilding, selectedFloor]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredRooms.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    onPageChange(page)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error loading data</h2>
          <p className="text-slate-500 text-sm">{error.message}</p>
          <button
            onClick={() => fetchRooms()}
            className="btn-primary btn-md mt-5"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoadingRooms || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Contenedor flexible para título y banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t.attendance.title}</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">{t.attendance.subtitle}</p>
        </motion.div>

        <AnimatePresence>
          {isCleanCheckDay && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-3.5 flex items-start gap-3 w-full lg:w-auto lg:max-w-md shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-semibold text-teal-900 tracking-tight">{t.attendance.cleanCheckDayBanner}</p>
                <p className="text-sm text-teal-700/90 mt-0.5">{t.attendance.cleanCheckDayHint}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-6">
        <Stats />
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6">
        <div className="sm:flex-1 sm:min-w-[220px]">
          <SearchBar />
        </div>
        <div className={`grid ${currentUser?.building_id ? "grid-cols-2" : "grid-cols-2"} sm:flex gap-3`}>
          <DateSelector />
          {!currentUser?.building_id && <BuildingSelector />}
          <FloorSelector />
        </div>
        <ViewToggle />
      </div>

      {selectedSuite && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedSuite(null)}
          className="flex items-center gap-2 text-brand-600 mb-4 hover:text-brand-700 text-sm font-medium"
        >
          <ArrowLeft size={18} />
          <span>{t.backToSuites}</span>
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {viewMode === "suites" && !selectedSuite
            ? suites.map((suite) => <SuiteCard isLoading={enableFetchRoomsQuery} key={suite.id} suite={suite} />)
            : currentItems.map((room, index) => {
                const floor = floorFromRoom(room)
                const prevFloor = index > 0 ? floorFromRoom(currentItems[index - 1]) : null
                const showFloorDivider = index === 0 || floor !== prevFloor
                return (
                  <Fragment key={room.id}>
                    {showFloorDivider && (
                      <div className="col-span-full flex items-center gap-3 pt-1 first:pt-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                          Floor {floor}
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-200/80 to-transparent" />
                      </div>
                    )}
                    <RoomCard room={room} isLoading={enableFetchRoomsQuery} />
                  </Fragment>
                )
              })
          }
        </div>
      </AnimatePresence>

      {filteredRooms.length === 0 && viewMode !== "suites" && (
        <div className="text-center py-16 text-slate-400">
          <p>No rooms match your current filters.</p>
        </div>
      )}

      {viewMode !== "suites" && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  )
}

export default Attendance;

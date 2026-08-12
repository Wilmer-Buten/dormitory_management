import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Toaster } from "react-hot-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import { SearchBar } from "../components/SearchBar"
import { DateSelector } from "../components/DateSelector"
import { ViewToggle } from "../components/ViewToggle"
import { BuildingSelector } from "../components/BuildingSelector"
import { Stats } from "../components/Stats"
import { RoomCard } from "../components/RoomCard"
import { SuiteCard } from "../components/SuiteCard"
import { useStore } from "../store/useStore"
import { useQuery } from "@tanstack/react-query"
import { Pagination } from "./Pagination"

function Attendance() {
  const {
    rooms,
    searchQuery,
    viewMode,
    selectedSuite,
    selectedBuilding,
    enableFetchRoomsQuery,
    currentPage, 
    currentUser, 
    selectedStat,
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

  const t = getTranslation()

  const filteredRooms = useMemo(() => {
    return getFilteredRooms();
  }, [selectedStat, searchQuery, selectedBuilding, selectedSuite, rooms]);

  const suites = useMemo(() => getSuites(), [rooms]);

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

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t.attendance.title}</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1">{t.attendance.subtitle}</p>
      </motion.div>

      <div className="mb-6">
        <Stats />
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6">
        <div className="sm:flex-1 sm:min-w-[220px]">
          <SearchBar />
        </div>
        <div className={`grid ${currentUser?.building_id ? "grid-cols-1" : "grid-cols-2"} sm:flex gap-3`}>
          <DateSelector />
          {!currentUser?.building_id && <BuildingSelector />}
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
            : currentItems.map((room) => <RoomCard key={room.id} room={room} isLoading={enableFetchRoomsQuery} />)
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

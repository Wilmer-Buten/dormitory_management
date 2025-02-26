import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Toaster } from "react-hot-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import { SearchBar } from "../components/SearchBar"
import { DateSelector } from "../components/DateSelector"
import { ViewToggle } from "../components/ViewToggle"
import { BuildingSelector } from "../components/BuildingSelector"
import { UserProfile } from "../components/UserProfile"
import { Stats } from "../components/Stats"
import { RoomCard } from "../components/RoomCard"
import { SuiteCard } from "../components/SuiteCard"
import { useStore } from "../store/useStore"
import { useQuery } from "@tanstack/react-query"
import { Pagination } from "./Pagination"

function Dashboard() {
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
    isLoading
  } = useStore()

  const [refreshDone, setRefreshDone] = useState(false)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error loading data</h2>
          <p className="text-gray-600">{error.message}</p>
          <button
            onClick={() => fetchRooms()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoadingRooms || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.title}</h1>
            <p className="text-gray-600">{t.subtitle}</p>
          </motion.div>
          <div className="flex gap-4">
            <UserProfile />
          </div>
        </div>

        <div className="mb-8">
          <Stats />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <SearchBar />
          </div>
          <DateSelector />
          <div className="sm:col-span-2 lg:col-span-1">
            <BuildingSelector />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <ViewToggle />
          </div>
        </div>
        {selectedSuite && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedSuite(null)}
            className="flex items-center gap-2 text-blue-600 mb-4 hover:text-blue-700"
          >
            <ArrowLeft size={20} />
            <span>{t.backToSuites}</span>
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viewMode === "suites" && !selectedSuite
              ? suites.map((suite) => <SuiteCard isLoading={enableFetchRoomsQuery} key={suite.id} suite={suite} />)
              : currentItems.map((room) => <RoomCard key={room.id} room={room} isLoading={enableFetchRoomsQuery} />)
            }
          </div>
        </AnimatePresence>

        {viewMode !== "suites" && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  )
}

export default Dashboard;


import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { DateSelector } from '../components/DateSelector';
import { ViewToggle } from '../components/ViewToggle';
import { BuildingSelector } from '../components/BuildingSelector';
import { LanguageSelector } from '../components/LanguageSelector';
import { UserProfile } from '../components/UserProfile';
import { Stats } from '../components/Stats';
import { RoomCard } from '../components/RoomCard';
import { SuiteCard } from '../components/SuiteCard';
import { useStore } from '../store/useStore';
import {useQuery, useMutation } from '@tanstack/react-query';

function Dashboard() {
    const [enableQuery, setEnableQuery] = useState(true);
    const { 
        rooms, 
        searchQuery, 
        viewMode, 
        selectedSuite, 
        selectedBuilding,
        isLoading,
        err,
        setSelectedSuite, 
        getSuites,
        getTranslation,
        fetchRooms,
        updateStudentPresence,
        setRooms, 
        setIsLoading,
        setCurrentUser 
      } = useStore();
    
      const { data, error } = useQuery({
        queryKey: ['rooms'],
        queryFn: fetchRooms,
        enabled: enableQuery
      });

      useEffect(() => {

        console.log(data)
        if(data){
            setRooms(data);
            setEnableQuery(false);
            setCurrentUser({
                username: 'Wilmer',
                name: 'Wilmer Buten',
                avatar: 'https://randomuser.me/api/portraits/men/12.jpg'
            });
        }
      },[data]);

    //   useEffect(() => {
    //     fetchRooms();
    //     fetchCurrentUser();
    //   }, []);
    
      const t = getTranslation();
    
      const filteredRooms = rooms.filter((room) => {
        if (selectedSuite && room.suiteId !== selectedSuite) return false;
        if (selectedBuilding !== 'all' && room.building !== selectedBuilding) return false;
        
        const searchLower = searchQuery.toLowerCase();
        return (
          room.number.toLowerCase().includes(searchLower) ||
          room.students.some((student) =>
            student.name.toLowerCase().includes(searchLower)
          )
        );
      });
    
      const suites = getSuites();
    
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
        );
      }
    
      if (isLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        );
      }
    
      return (
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-start mb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {t.title}
                </h1>
                <p className="text-gray-600">
                  {t.subtitle}
                </p>
              </motion.div>
              <div className="flex gap-4">
                <LanguageSelector />
                <UserProfile />
              </div>
            </div>
    
            <div className="mb-8">
              <Stats />
            </div>
    
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <SearchBar />
              <DateSelector />
              <BuildingSelector />
              <ViewToggle />
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
                {viewMode === 'suites' && !selectedSuite ? (
                  suites.map((suite) => (
                    <SuiteCard key={suite.id} suite={suite} />
                  ))
                ) : (
                  filteredRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))
                )}
              </div>
            </AnimatePresence>
          </div>
        </div>
      );
}

export default Dashboard
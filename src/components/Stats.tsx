import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { UserCheck, UserX, Users, Home, Eye } from "lucide-react";
import { useStore } from "../store/useStore";

const StatsSkeleton = () => (
  <div className="h-6 bg-gray-200 rounded animate-pulse" />
);

const MemoizedStatCard = React.memo(({ title, value, icon: Icon, color, type, selectedStat, setSelectedStat, isLoading }: any) => (
  <motion.button
    onClick={() => !isLoading && setSelectedStat(type)}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: isLoading ? 1 : 1.02 }}
    whileTap={{ scale: isLoading ? 1 : 0.98 }}
    disabled={isLoading}
    className={`w-full bg-white p-6 rounded-2xl shadow-lg transition-all ${
      selectedStat === type && !isLoading ? "ring-2 ring-blue-500 ring-offset-2" : "hover:shadow-xl"
    } ${color} ${isLoading ? "cursor-default" : "cursor-pointer"}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-gray-500 text-sm">{title}</p>
        {isLoading ? (
          <div className="mt-2 w-16">
            <StatsSkeleton />
          </div>
        ) : (
          <p className="text-2xl font-bold mt-1">{value}</p>
        )}
      </div>
      <Icon 
        className={`${
          selectedStat === type && !isLoading 
            ? "text-blue-500" 
            : isLoading 
              ? "text-gray-300" 
              : "text-gray-400"
        }`} 
        size={24} 
      />
    </div>
  </motion.button>
));

export const Stats: React.FC = React.memo(() => {
  const getStats = useStore((state) => state.getStats);
  const rooms = useStore((state) => state.rooms);
  const getTranslation = useStore((state) => state.getTranslation);
  const selectedStat = useStore((state) => state.selectedStat);
  const setSelectedStat = useStore((state) => state.setSelectedStat);
  const isLoadingRooms = useStore((state) => state.enableFetchRoomsQuery);
  const stats = useMemo(() => getStats(), [getStats, rooms]);
  const t = useMemo(() => getTranslation(), [getTranslation]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <MemoizedStatCard
        title={t.totalRooms}
        value={stats.totalRooms}
        icon={Home}
        color="hover:shadow-blue-100"
        type="all"
        selectedStat={selectedStat}
        setSelectedStat={setSelectedStat}
        isLoading={isLoadingRooms}
      />
      <MemoizedStatCard
        title={t.present}
        value={stats.presentCount}
        icon={UserCheck}
        color="hover:shadow-green-100"
        type="present"
        selectedStat={selectedStat}
        setSelectedStat={setSelectedStat}
        isLoading={isLoadingRooms}
      />
      <MemoizedStatCard
        title="In room"
        value={stats.inRoomCount}
        icon={Eye}
        color="hover:shadow-yellow-100"
        type="inRoom"
        selectedStat={selectedStat}
        setSelectedStat={setSelectedStat}
        isLoading={isLoadingRooms}
      />
      <MemoizedStatCard
        title={t.absent}
        value={stats.absentCount}
        icon={UserX}
        color="hover:shadow-red-100"
        type="absent"
        selectedStat={selectedStat}
        setSelectedStat={setSelectedStat}
        isLoading={isLoadingRooms}
      />
      <MemoizedStatCard
        title={t.pending}
        value={stats.pendingCount}
        icon={Users}
        color="hover:shadow-yellow-100"
        type="pending"
        selectedStat={selectedStat}
        setSelectedStat={setSelectedStat}
        isLoading={isLoadingRooms}
      />
    </div>
  );
});

export default Stats
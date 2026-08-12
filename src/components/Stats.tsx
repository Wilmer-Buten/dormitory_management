import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { UserCheck, UserX, Users, Home, Eye } from "lucide-react";
import { useStore } from "../store/useStore";

const StatsSkeleton = () => (
  <div className="h-6 w-14 bg-slate-200 rounded animate-pulse" />
);

const STAT_STYLES: Record<string, { iconBg: string; iconColor: string; ring: string }> = {
  all:     { iconBg: "bg-brand-50",  iconColor: "text-brand-600",  ring: "ring-brand-500" },
  present: { iconBg: "bg-green-50",  iconColor: "text-green-600",  ring: "ring-green-500" },
  inRoom:  { iconBg: "bg-yellow-50", iconColor: "text-yellow-600", ring: "ring-yellow-500" },
  absent:  { iconBg: "bg-red-50",    iconColor: "text-red-600",    ring: "ring-red-500" },
  pending: { iconBg: "bg-slate-100", iconColor: "text-slate-500",  ring: "ring-slate-400" },
};

const MemoizedStatCard = React.memo(({ title, value, icon: Icon, type, selectedStat, setSelectedStat, isLoading }: any) => {
  const style = STAT_STYLES[type] ?? STAT_STYLES.pending;
  const isActive = selectedStat === type && !isLoading;
  return (
    <motion.button
      onClick={() => !isLoading && setSelectedStat(type)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      disabled={isLoading}
      className={`w-full text-left bg-white p-4 sm:p-5 rounded-2xl border transition-all ${
        isActive ? `ring-2 ${style.ring} ring-offset-1 border-transparent shadow-card-hover` : "border-slate-100 shadow-card hover:shadow-card-hover"
      } ${isLoading ? "cursor-default" : "cursor-pointer"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
          <Icon size={19} className={style.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-500 text-xs sm:text-sm truncate">{title}</p>
          {isLoading ? (
            <div className="mt-1"><StatsSkeleton /></div>
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{value}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
});

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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <MemoizedStatCard
        title={t.totalRooms}
        value={stats.totalRooms}
        icon={Home}
        type="all"
        selectedStat={selectedStat}
        setSelectedStat={setSelectedStat}
        isLoading={isLoadingRooms}
      />
      <MemoizedStatCard
        title={t.present}
        value={stats.presentCount}
        icon={UserCheck}
        type="present"
        selectedStat={selectedStat}
        setSelectedStat={setSelectedStat}
        isLoading={isLoadingRooms}
      />
      <MemoizedStatCard
        title="In room"
        value={stats.inRoomCount}
        icon={Eye}
        type="inRoom"
        selectedStat={selectedStat}
        setSelectedStat={setSelectedStat}
        isLoading={isLoadingRooms}
      />
      <MemoizedStatCard
        title={t.absent}
        value={stats.absentCount}
        icon={UserX}
        type="absent"
        selectedStat={selectedStat}
        setSelectedStat={setSelectedStat}
        isLoading={isLoadingRooms}
      />
      <MemoizedStatCard
        title={t.pending}
        value={stats.pendingCount}
        icon={Users}
        type="pending"
        selectedStat={selectedStat}
        setSelectedStat={setSelectedStat}
        isLoading={isLoadingRooms}
      />
    </div>
  );
});

export default Stats

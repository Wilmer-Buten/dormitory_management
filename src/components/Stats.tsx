import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, UserX, Users, Home } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Stats: React.FC = () => {
  const stats = useStore((state) => state.getStats());
  const t = useStore((state) => state.getTranslation());

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white p-6 rounded-2xl shadow-lg ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="text-gray-400" size={24} />
      </div>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title={t.totalRooms}
        value={stats.totalRooms}
        icon={Home}
        color="hover:shadow-blue-100"
      />
      <StatCard
        title={t.present}
        value={stats.presentCount}
        icon={UserCheck}
        color="hover:shadow-green-100"
      />
      <StatCard
        title={t.absent}
        value={stats.absentCount}
        icon={UserX}
        color="hover:shadow-red-100"
      />
      <StatCard
        title={t.pending}
        value={stats.pendingCount}
        icon={Users}
        color="hover:shadow-yellow-100"
      />
    </div>
  );
};
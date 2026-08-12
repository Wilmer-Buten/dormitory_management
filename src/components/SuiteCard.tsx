import React from 'react';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { Suite } from '../types';
import { useStore } from '../store/useStore';
import Skeleton from './Skeleton';

interface SuiteCardProps {
  suite: Suite;
  isLoading?: boolean;
}

export const SuiteCard: React.FC<SuiteCardProps> = ({ suite, isLoading }) => {
  const { setSelectedSuite } = useStore();

  const getRoomStatus = (id: string) => {
    const room = suite.rooms.find(r => r.id === id);
    if (!room) return 'pending';
    const allPresent = room.students.every(s => s.isPresent === 1 || s.isPresent === true);
    const allAbsent = room.students.every(s => s.isPresent === 0 || s.isPresent === false);
    const anyChecked = room.students.some(s => s.isPresent !== null);

    if (allPresent) return 'present';
    if (allAbsent) return 'absent';
    if (anyChecked) return 'partial';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'partial': return 'bg-yellow-500';
      default: return 'bg-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-16 rounded-xl mx-auto" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => setSelectedSuite(suite.id)}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card hover:shadow-card-hover transition-all cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Layers size={17} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 truncate leading-tight">
            Suite {suite.rooms[0].suiteNumber}
          </h3>
          <p className="text-xs text-slate-400 truncate">{suite.rooms[0].building}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {suite.rooms.map((room) => (
          <div key={room.id} className="flex flex-col items-center">
            <div
              className={`w-full aspect-square max-w-[4.5rem] rounded-xl ${getStatusColor(getRoomStatus(room.id))} 
                flex items-center justify-center text-white font-semibold text-lg shadow-sm`}
            >
              {room.letter}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

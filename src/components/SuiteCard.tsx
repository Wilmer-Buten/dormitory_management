import React from 'react';
import { motion } from 'framer-motion';
import { Suite } from '../types';
import { useStore } from '../store/useStore';

interface SuiteCardProps {
  suite: Suite;
}

export const SuiteCard: React.FC<SuiteCardProps> = ({ suite }) => {
  const { setSelectedSuite } = useStore();

  const getRoomStatus = (id: string) => {
    const room = suite.rooms.find(r => r.id === id);
    if (!room) return 'pending';
    console.log(room)
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
      default: return 'bg-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => setSelectedSuite(suite.id)}
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Suite {suite.rooms[0].number}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {suite.rooms.map((room) => (
          <div key={room.id} className="flex flex-col items-center">
            <div
              className={`w-16 h-16 rounded-xl ${getStatusColor(getRoomStatus(room.id))} 
                flex items-center justify-center text-white font-semibold text-lg`}
            >
              {room.letter}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
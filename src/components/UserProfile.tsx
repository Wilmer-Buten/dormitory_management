import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

export const UserProfile: React.FC = () => {
  const { currentUser, getTranslation } = useStore();
  const t = getTranslation();

  if (!currentUser) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm"
    >
      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
        {currentUser.name.charAt(0)}
      </div>
      <div>
        <p className="text-sm text-gray-500">{t.welcome},</p>
        <p className="font-semibold text-gray-800">{currentUser.name}</p>
      </div>
    </motion.div>
  );
};
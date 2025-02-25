import React from 'react';
import { Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';

export const DateSelector: React.FC = () => {
  const { selectedDate, setSelectedDate, enableFetchRoomsQuery, setEnableFetchRoomsQuery } = useStore();

  return (
    <div className="relative">
      <Calendar
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        size={20}
      />
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => {
          console.log(e.target.value)
          setSelectedDate(e.target.value)
          !enableFetchRoomsQuery && setEnableFetchRoomsQuery(true);
        }}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
    </div>
  );
};
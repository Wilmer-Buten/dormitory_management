import React from 'react';
import { Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';

export const DateSelector: React.FC = () => {
  const { selectedDate, setSelectedDate, enableFetchRoomsQuery, setEnableFetchRoomsQuery } = useStore();

  return (
    <div className="relative">
      <Calendar
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        size={18}
      />
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => {
          setSelectedDate(e.target.value)
          !enableFetchRoomsQuery && setEnableFetchRoomsQuery(true);
        }}
        className="input input-icon"
      />
    </div>
  );
};
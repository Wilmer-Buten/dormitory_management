import React from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../store/useStore';

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, getTranslation } = useStore();
  const t = getTranslation();

  return (
    <div className="relative">
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t.search}
        className="input input-icon"
      />
    </div>
  );
};
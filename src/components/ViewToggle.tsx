import React from 'react';
import { LayoutGrid, Grid2X2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ViewToggle: React.FC = () => {
  const { viewMode, setViewMode, getTranslation } = useStore();
  const t = getTranslation();

  return (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => setViewMode('rooms')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          viewMode === 'rooms'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Grid2X2 size={18} />
        <span>{t.rooms}</span>
      </button>
      <button
        onClick={() => setViewMode('suites')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          viewMode === 'suites'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        <LayoutGrid size={18} />
        <span>{t.suites}</span>
      </button>
    </div>
  );
};
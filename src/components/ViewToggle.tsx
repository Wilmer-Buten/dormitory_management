import React, { useEffect } from 'react';
import { LayoutGrid, Grid2X2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ViewToggle: React.FC = () => {
  const { viewMode, setViewMode, getTranslation, canSelectSuiteView } = useStore();
  const t = getTranslation();
  const suitesAvailable = canSelectSuiteView();

  useEffect(() => {
    if (!suitesAvailable && viewMode === 'suites') {
      setViewMode('rooms');
    }
  }, [suitesAvailable, viewMode, setViewMode]);

  if (!suitesAvailable) {
    return null;
  }

  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
      <button
        onClick={() => setViewMode('rooms')}
        className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          viewMode === 'rooms'
            ? 'bg-white text-brand-600 shadow-sm'
            : 'text-slate-500 hover:bg-slate-200/60'
        }`}
      >
        <Grid2X2 size={17} />
        <span>{t.rooms}</span>
      </button>
      <button
        onClick={() => setViewMode('suites')}
        className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          viewMode === 'suites'
            ? 'bg-white text-brand-600 shadow-sm'
            : 'text-slate-500 hover:bg-slate-200/60'
        }`}
      >
        <LayoutGrid size={17} />
        <span>{t.suites}</span>
      </button>
    </div>
  );
};
import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { useStore } from '../store/useStore';
import { floorFromRoom } from '../types';

export const FloorSelector: React.FC = () => {
  const {
    rooms,
    selectedBuilding,
    selectedFloor,
    setSelectedFloor,
    getTranslation,
  } = useStore();
  const t = getTranslation();

  const floors = useMemo(() => {
    const scoped =
      selectedBuilding === 'all'
        ? rooms
        : rooms.filter((r) => r.building === selectedBuilding);
    const set = new Set<number>();
    for (const room of scoped) set.add(floorFromRoom(room));
    return [...set].sort((a, b) => a - b);
  }, [rooms, selectedBuilding]);

  if (floors.length <= 1) return null;

  return (
    <div className="relative">
      <Layers
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        size={18}
      />
      <select
        value={selectedFloor === 'all' ? 'all' : String(selectedFloor)}
        onChange={(e) => {
          const v = e.target.value;
          setSelectedFloor(v === 'all' ? 'all' : Number(v));
        }}
        className="input input-icon appearance-none pr-9 min-w-[8.5rem]"
        aria-label="Filter by floor"
      >
        <option value="all">{(t as any).floors?.all ?? 'All floors'}</option>
        {floors.map((f) => (
          <option key={f} value={f}>
            Floor {f}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FloorSelector;

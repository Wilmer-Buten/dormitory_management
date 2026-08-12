import React, { useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export const BuildingSelector: React.FC = () => {
  const { selectedBuilding, setSelectedBuilding, getTranslation, buildings, fetchBuildings } = useStore();
  const t = getTranslation();

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const options = [
    { id: 'all', name: t.buildings.all },
    ...buildings.map((building) => ({
      id: building.name,
      name: building.name.charAt(0).toUpperCase() + building.name.slice(1),
    })),
  ];

  return (
    <div className="relative">
      <Building2
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        size={18}
      />
      <select
        value={selectedBuilding}
        onChange={(e) => setSelectedBuilding(e.target.value)}
        className="input input-icon appearance-none pr-9"
      >
        {options.map((building) => (
          <option key={building.id} value={building.id}>
            {building.name}
          </option>
        ))}
      </select>
    </div>
  );
};

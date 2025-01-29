import React from 'react';
import { Building2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export const BuildingSelector: React.FC = () => {
  const { selectedBuilding, setSelectedBuilding, getTranslation } = useStore();
  const t = getTranslation();

  const buildings = [
    { id: 'all', name: t.buildings.all },
    { id: 'edwards', name: t.buildings.edwards },
    { id: 'holland', name: t.buildings.holland },
    { id: 'peterson', name: t.buildings.peterson },
    { id: 'wade', name: t.buildings.wade },
  ];

  return (
    <div className="relative">
      <Building2
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        size={20}
      />
      <select
        value={selectedBuilding}
        onChange={(e) => setSelectedBuilding(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white"
      >
        {buildings.map((building) => (
          <option key={building.id} value={building.id}>
            {building.name}
          </option>
        ))}
      </select>
    </div>
  );
};
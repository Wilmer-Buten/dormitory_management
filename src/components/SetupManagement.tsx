import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Building2, Plus, Trash2, ChevronDown, ChevronRight,
  DoorOpen, Layers, Loader2, AlertTriangle, X, Check, Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import SemesterManagement from './SemesterManagement';
import DataImport from './DataImport';
import CleanCheckDays from './CleanCheckDays';
import { AccessRestricted } from './AccessRestricted';

const API = import.meta.env.VITE_API_URL;

type SetupTab = 'buildings' | 'semesters' | 'import' | 'cleanCheck';

interface BuildingData {
  id: number;
  name: string;
  code: string;
  layout_type: 'suite' | 'shared_bath' | 'standalone';
  suite_count: number;
  room_count: number;
}

interface SuiteData {
  id: number;
  building_id: number;
  number: number;
  room_count: number;
}

interface RoomData {
  id: number;
  building_id: number;
  suite_id: number | null;
  suite_number: number | null;
  letter: string;
  number: number;
  student_count: number;
}

const LAYOUT_LABELS: Record<string, string> = {
  suite:       'Suite',
  shared_bath: 'Shared Bath',
  standalone:  'Standalone',
};

const LAYOUT_COLORS: Record<string, string> = {
  suite:       'bg-oakwood-blue-50 text-oakwood-blue',
  shared_bath: 'bg-oakwood-gold-50 text-oakwood-gold-dark',
  standalone:  'bg-green-50 text-green-700',
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function authHeader(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function SetupManagement({ defaultTab = 'buildings' }: { defaultTab?: SetupTab }) {
  const { accessToken, currentUser, getTranslation, setCurrentSection } = useStore();
  const t = getTranslation();
  const isSupervisor = currentUser?.role === 'supervisor';
  const [activeTab, setActiveTab] = useState<SetupTab>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const selectTab = (tab: SetupTab) => {
    setActiveTab(tab);
    const section =
      tab === 'buildings' ? 'setup' :
      tab === 'semesters' ? 'semesters' :
      tab === 'import' ? 'import' :
      'cleanCheck';
    setCurrentSection(section);
  };

  const semesterButtonCallbackRef = useRef<(() => void) | null>(null);
  const [, forceUpdate] = useState({});

  const handleSemesterAddClick = useCallback((cb: () => void) => {
    if (semesterButtonCallbackRef.current !== cb) {
      semesterButtonCallbackRef.current = cb;
      forceUpdate({});
    }
  }, []);

  const [buildings, setBuildings]         = useState<BuildingData[]>([]);
  const [suites, setSuites]               = useState<Record<number, SuiteData[]>>({});
  const [rooms, setRooms]                 = useState<Record<number, RoomData[]>>({});
  const [expandedBuilding, setExpandedBuilding] = useState<number | null>(null);
  const [expandedSuite, setExpandedSuite] = useState<number | null>(null);
  const [loadingBuilding, setLoadingBuilding] = useState<number | null>(null);
  const [loading, setLoading]             = useState(true);

  const [addBuildingOpen, setAddBuildingOpen]   = useState(false);
  const [addSuiteOpen, setAddSuiteOpen]         = useState<number | null>(null);
  const [addRoomOpen, setAddRoomOpen]           = useState<{ buildingId: number; suiteId?: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm]       = useState<{ type: string; id: number; label: string; buildingId: number; suiteId?: number | null } | null>(null);
  const [editBuilding, setEditBuilding]         = useState<BuildingData | null>(null);
  const [editSuite, setEditSuite]               = useState<{ buildingId: number; suite: SuiteData } | null>(null);
  const [editRoom, setEditRoom]                 = useState<{ buildingId: number; room: RoomData } | null>(null);

  const [newBuildingName, setNewBuildingName]     = useState('');
  const [newBuildingCode, setNewBuildingCode]     = useState('');
  const [newBuildingLayout, setNewBuildingLayout] = useState<'suite' | 'shared_bath' | 'standalone'>('suite');
  const [newSuiteNumber, setNewSuiteNumber]       = useState('');
  const [newRoomLetter, setNewRoomLetter]         = useState('A');
  const [newRoomNumber, setNewRoomNumber]         = useState('');
  const [saving, setSaving]                       = useState(false);

  const fetchBuildings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/setup/buildings`, { headers: authHeader(accessToken) });
      if (!res.ok) throw new Error('Failed to fetch buildings');
      setBuildings(await res.json());
    } catch {
      toast.error('Error loading buildings');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isSupervisor) fetchBuildings();
    else setLoading(false);
  }, [fetchBuildings, isSupervisor]);

  const loadBuildingData = async (b: BuildingData) => {
    const id = b.id;
    setLoadingBuilding(id);
    try {
      const headers = { headers: authHeader(accessToken) };
      const [suitesRes, roomsRes] = await Promise.all([
        fetch(`${API}/setup/buildings/${id}/suites`, headers),
        fetch(`${API}/setup/buildings/${id}/rooms`,  headers),
      ]);
      const [suitesData, roomsData] = await Promise.all([suitesRes.json(), roomsRes.json()]);
      setSuites(prev => ({ ...prev, [id]: suitesData }));
      setRooms (prev => ({ ...prev, [id]: roomsData  }));
    } catch {
      toast.error('Error loading building data');
    } finally {
      setLoadingBuilding(null);
    }
  };

  const toggleBuilding = async (b: BuildingData) => {
    if (expandedBuilding === b.id) {
      setExpandedBuilding(null);
      setExpandedSuite(null);
    } else {
      setExpandedBuilding(b.id);
      setExpandedSuite(null);
      if (!suites[b.id]) await loadBuildingData(b);
    }
  };

  const handleAddBuilding = async () => {
    if (!newBuildingName.trim() || !newBuildingCode.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/setup/buildings`, {
        method: 'POST',
        headers: authHeader(accessToken),
        body: JSON.stringify({ name: newBuildingName.trim(), code: newBuildingCode.trim(), layout_type: newBuildingLayout }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.message || 'Error creating building');
      setBuildings(prev => [...prev, created]);
      setAddBuildingOpen(false);
      setNewBuildingName('');
      setNewBuildingCode('');
      toast.success(`Building "${created.name}" created`);
    } catch (err: any) { toast.error(err.message || 'Error creating building'); }
    finally { setSaving(false); }
  };

  const handleEditBuilding = async () => {
    if (!editBuilding || !editBuilding.name.trim() || !editBuilding.code.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/setup/buildings/${editBuilding.id}`, {
        method: 'PUT',
        headers: authHeader(accessToken),
        body: JSON.stringify({ name: editBuilding.name.trim(), code: editBuilding.code.trim(), layout_type: editBuilding.layout_type }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Error updating building');
      setBuildings(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
      setEditBuilding(null);
      toast.success('Building updated');
    } catch (err: any) { toast.error(err.message || 'Error updating building'); }
    finally { setSaving(false); }
  };

  const handleEditSuite = async () => {
    if (!editSuite) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/setup/suites/${editSuite.suite.id}`, {
        method: 'PUT',
        headers: authHeader(accessToken),
        body: JSON.stringify({ number: editSuite.suite.number }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Error updating suite');
      setSuites(prev => ({
        ...prev,
        [editSuite.buildingId]: (prev[editSuite.buildingId] || []).map(s => s.id === updated.id ? { ...s, ...updated } : s),
      }));
      setEditSuite(null);
      toast.success('Suite updated');
    } catch (err: any) { toast.error(err.message || 'Error updating suite'); }
    finally { setSaving(false); }
  };

  const handleEditRoom = async () => {
    if (!editRoom) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/setup/rooms/${editRoom.room.id}`, {
        method: 'PUT',
        headers: authHeader(accessToken),
        body: JSON.stringify({ letter: editRoom.room.letter, number: editRoom.room.number, suite_id: editRoom.room.suite_id }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Error updating room');
      setRooms(prev => ({
        ...prev,
        [editRoom.buildingId]: (prev[editRoom.buildingId] || []).map(r => r.id === updated.id ? { ...r, ...updated } : r),
      }));
      setEditRoom(null);
      toast.success('Room updated');
    } catch (err: any) { toast.error(err.message || 'Error updating room'); }
    finally { setSaving(false); }
  };

  const handleAddSuite = async (buildingId: number) => {
    if (!newSuiteNumber.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/setup/suites`, {
        method: 'POST',
        headers: authHeader(accessToken),
        body: JSON.stringify({ building_id: buildingId, number: parseInt(newSuiteNumber) }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setSuites(prev => ({ ...prev, [buildingId]: [...(prev[buildingId] || []), created] }));
      setBuildings(prev => prev.map(b => b.id === buildingId ? { ...b, suite_count: b.suite_count + 1 } : b));
      setAddSuiteOpen(null);
      setNewSuiteNumber('');
      toast.success(`Suite ${created.number} created`);
    } catch { toast.error('Error creating suite'); }
    finally { setSaving(false); }
  };

  const handleAddRoom = async () => {
    if (!addRoomOpen || !newRoomNumber.trim()) return;
    setSaving(true);
    try {
      const { buildingId, suiteId } = addRoomOpen;
      const res = await fetch(`${API}/setup/rooms`, {
        method: 'POST',
        headers: authHeader(accessToken),
        body: JSON.stringify({ building_id: buildingId, suite_id: suiteId || null, letter: newRoomLetter, number: parseInt(newRoomNumber) }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setRooms(prev => ({ ...prev, [buildingId]: [...(prev[buildingId] || []), created] }));
      setBuildings(prev => prev.map(b => b.id === buildingId ? { ...b, room_count: b.room_count + 1 } : b));
      if (suiteId) {
        setSuites(prev => ({
          ...prev,
          [buildingId]: (prev[buildingId] || []).map(s =>
            s.id === suiteId ? { ...s, room_count: s.room_count + 1 } : s
          ),
        }));
      }
      setAddRoomOpen(null);
      setNewRoomLetter('A');
      setNewRoomNumber('');
      toast.success(`Room ${newRoomLetter}${newRoomNumber} created`);
    } catch { toast.error('Error creating room'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    const { type, id, buildingId, suiteId } = deleteConfirm;
    try {
      const endpoint = type === 'building' ? `buildings/${id}` : type === 'suite' ? `suites/${id}` : `rooms/${id}`;
      const res = await fetch(`${API}/setup/${endpoint}`, {
        method: 'DELETE', headers: authHeader(accessToken),
      });
      if (!res.ok) throw new Error();

      if (type === 'building') {
        setBuildings(prev => prev.filter(b => b.id !== id));
        setSuites(prev => { const updated = { ...prev }; delete updated[id]; return updated; });
        setRooms(prev => { const updated = { ...prev }; delete updated[id]; return updated; });
        if (expandedBuilding === id) setExpandedBuilding(null);
      } else if (type === 'suite') {
        const removedRoomCount = (rooms[buildingId] || []).filter(r => r.suite_id === id).length;
        setSuites(prev => ({ ...prev, [buildingId]: (prev[buildingId] || []).filter(s => s.id !== id) }));
        setRooms(prev => ({ ...prev, [buildingId]: (prev[buildingId] || []).filter(r => r.suite_id !== id) }));
        setBuildings(prev => prev.map(b => b.id === buildingId
          ? { ...b, suite_count: Math.max(0, b.suite_count - 1), room_count: Math.max(0, b.room_count - removedRoomCount) }
          : b));
      } else {
        setRooms(prev => ({ ...prev, [buildingId]: (prev[buildingId] || []).filter(r => r.id !== id) }));
        setBuildings(prev => prev.map(b => b.id === buildingId ? { ...b, room_count: Math.max(0, b.room_count - 1) } : b));
        if (suiteId) {
          setSuites(prev => ({
            ...prev,
            [buildingId]: (prev[buildingId] || []).map(s => s.id === suiteId ? { ...s, room_count: Math.max(0, s.room_count - 1) } : s),
          }));
        }
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
    } catch { toast.error(`Error deleting ${type}`); }
    finally { setSaving(false); setDeleteConfirm(null); }
  };

  if (loading && activeTab === 'buildings' && !isSupervisor) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-oakwood-blue" />
      </div>
    );
  }

  const tabClass = (tab: SetupTab) =>
    `px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
      activeTab === tab
        ? 'text-oakwood-blue border-b-2 border-oakwood-gold'
        : 'text-slate-500 hover:text-slate-700'
    }`;

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-oakwood-blue tracking-tight">{t.menu.setup}</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          {isSupervisor
            ? 'Import residents and configure clean check weekdays for your building'
            : 'Manage buildings, suites, rooms, imports and clean check days'}
        </p>
        
        <div className="flex items-center justify-between mt-4 border-b border-slate-200 gap-3">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto">
            {!isSupervisor && (
              <>
                <button onClick={() => selectTab('buildings')} className={tabClass('buildings')}>
                  {t.menu.dormitories}
                </button>
                <button onClick={() => selectTab('semesters')} className={tabClass('semesters')}>
                  Semesters
                </button>
              </>
            )}
            <button onClick={() => selectTab('import')} className={tabClass('import')}>
              {t.menu.import}
            </button>
            <button onClick={() => selectTab('cleanCheck')} className={tabClass('cleanCheck')}>
              {t.menu.cleanCheck}
            </button>
            {isSupervisor && (
              <button onClick={() => selectTab('buildings')} className={tabClass('buildings')}>
                {t.menu.dormitories}
              </button>
            )}
          </div>
          
          {!isSupervisor && activeTab === 'buildings' ? (
            <button
              onClick={() => setAddBuildingOpen(true)}
              className="btn-primary btn-md text-sm mb-0.5 shrink-0"
            >
              <Plus size={16} /> Add Building
            </button>
          ) : !isSupervisor && activeTab === 'semesters' && semesterButtonCallbackRef.current ? (
            <button
              onClick={semesterButtonCallbackRef.current}
              className="btn-primary btn-md text-sm mb-0.5 shrink-0"
            >
              <Plus size={16} /> Add Semester
            </button>
          ) : null}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'import' ? (
        <DataImport />
      ) : activeTab === 'cleanCheck' ? (
        <CleanCheckDays embedded />
      ) : activeTab === 'semesters' ? (
        isSupervisor ? <AccessRestricted /> : (
          <SemesterManagement showInlineButton onAddClick={handleSemesterAddClick} />
        )
      ) : isSupervisor ? (
        <AccessRestricted />
      ) : (
        <>

          {/* Buildings list */}
      {buildings.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>No buildings yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buildings.map(b => {
            const isExpanded = expandedBuilding === b.id;
            const bRooms   = rooms[b.id]  || [];
            const bSuites  = suites[b.id] || [];

            return (
              <div key={b.id} className="card overflow-hidden">
                {/* Building header */}
                <div className="flex flex-wrap items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleBuilding(b)}>
                  <div className="text-slate-400 shrink-0">
                    {loadingBuilding === b.id
                      ? <Loader2 size={18} className="animate-spin" />
                      : isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                    }
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Building2 size={17} />
                  </div>
                  <div className="flex-1 min-w-[8rem]">
                    <p className="font-semibold text-slate-800 truncate">{b.name}</p>
                    <p className="text-xs text-slate-400">
                      {b.suite_count > 0 && `${b.suite_count} suite${b.suite_count !== 1 ? 's' : ''} · `}
                      {b.room_count} room{b.room_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className={`badge ${LAYOUT_COLORS[b.layout_type]}`}>
                      {LAYOUT_LABELS[b.layout_type]}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); setEditBuilding({ ...b }); }}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirm({ type: 'building', id: b.id, label: b.name, buildingId: b.id }); }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 pb-4 pt-3 space-y-3">

                    {/* SUITE layout */}
                    {b.layout_type === 'suite' && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Suites</p>
                          <button
                            onClick={() => { setAddSuiteOpen(b.id); setNewSuiteNumber(''); }}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium py-1 px-1.5"
                          >
                            <Plus size={12} /> Add Suite
                          </button>
                        </div>

                        {addSuiteOpen === b.id && (
                          <div className="flex gap-2 items-center bg-white border border-brand-200 rounded-xl p-2">
                            <Layers size={14} className="text-brand-400 shrink-0" />
                            <input
                              autoFocus
                              type="number"
                              placeholder="Suite number (e.g. 101)"
                              value={newSuiteNumber}
                              onChange={e => setNewSuiteNumber(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAddSuite(b.id)}
                              className="flex-1 text-sm outline-none bg-transparent min-w-0"
                            />
                            <button onClick={() => handleAddSuite(b.id)} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                            <button onClick={() => setAddSuiteOpen(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                          </div>
                        )}

                        {bSuites.length === 0 && addSuiteOpen !== b.id && (
                          <p className="text-xs text-slate-400 pl-1">No suites yet.</p>
                        )}

                        {bSuites.map(suite => {
                          const suiteRooms = bRooms.filter(r => r.suite_id === suite.id);
                          const isExpS = expandedSuite === suite.id;
                          return (
                            <div key={suite.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                              <div
                                className="flex flex-wrap items-center gap-2 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setExpandedSuite(isExpS ? null : suite.id)}
                              >
                                {isExpS ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                <Layers size={14} className="text-purple-400" />
                                <span className="text-sm font-medium text-slate-700 flex-1 min-w-[5rem]">Suite {suite.number}</span>
                                <span className="text-xs text-slate-400">{suite.room_count} room{suite.room_count !== 1 ? 's' : ''}</span>
                                <div className="flex items-center gap-1 ml-auto">
                                  <button
                                    onClick={e => { e.stopPropagation(); setAddRoomOpen({ buildingId: b.id, suiteId: suite.id }); setNewRoomLetter('A'); setNewRoomNumber(''); }}
                                    className="p-1.5 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                    title="Add room"
                                  ><Plus size={13} /></button>
                                  <button
                                    onClick={e => { e.stopPropagation(); setEditSuite({ buildingId: b.id, suite: { ...suite } }); }}
                                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                  ><Pencil size={13} /></button>
                                  <button
                                    onClick={e => { e.stopPropagation(); setDeleteConfirm({ type: 'suite', id: suite.id, label: `Suite ${suite.number}`, buildingId: b.id }); }}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  ><Trash2 size={13} /></button>
                                </div>
                              </div>

                              {isExpS && (
                                <div className="border-t border-slate-100 px-3 pb-3 pt-2 space-y-1.5 bg-slate-50">
                                  {suiteRooms.map(room => (
                                    <div key={room.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white border border-slate-100">
                                      <DoorOpen size={13} className="text-slate-400 shrink-0" />
                                      <span className="text-sm text-slate-700 flex-1 truncate">Room {room.letter}{room.number}</span>
                                      <span className="text-xs text-slate-400 shrink-0">{room.student_count} student{room.student_count !== 1 ? 's' : ''}</span>
                                      <button
                                        onClick={() => setEditRoom({ buildingId: b.id, room: { ...room } })}
                                        className="p-1.5 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                      ><Pencil size={12} /></button>
                                      <button
                                        onClick={() => setDeleteConfirm({ type: 'room', id: room.id, label: `Room ${room.letter}${room.number}`, buildingId: b.id, suiteId: room.suite_id })}
                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      ><Trash2 size={12} /></button>
                                    </div>
                                  ))}
                                  {suiteRooms.length === 0 && <p className="text-xs text-slate-400 pl-1">No rooms in this suite.</p>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* SHARED_BATH / STANDALONE layout — rooms directly */}
                    {b.layout_type !== 'suite' && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rooms</p>
                          <button
                            onClick={() => { setAddRoomOpen({ buildingId: b.id }); setNewRoomLetter('A'); setNewRoomNumber(''); }}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium py-1 px-1.5"
                          >
                            <Plus size={12} /> Add Room
                          </button>
                        </div>

                        {bRooms.length === 0 && (
                          <p className="text-xs text-slate-400 pl-1">No rooms yet.</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {bRooms.map(room => (
                            <div key={room.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200">
                              <DoorOpen size={13} className="text-slate-400 shrink-0" />
                              <span className="text-sm text-slate-700 flex-1 truncate">Room {room.letter}{room.number}</span>
                              <span className="text-xs text-slate-400 shrink-0">{room.student_count}</span>
                              <button
                                onClick={() => setEditRoom({ buildingId: b.id, room: { ...room } })}
                                className="p-1.5 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              ><Pencil size={12} /></button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'room', id: room.id, label: `Room ${room.letter}${room.number}`, buildingId: b.id, suiteId: room.suite_id })}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              ><Trash2 size={12} /></button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Add Building Modal */}
      {addBuildingOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-popover w-full max-w-md p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-slate-900">New Building</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="label">Name</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Edwards Hall"
                  value={newBuildingName}
                  onChange={e => setNewBuildingName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddBuilding()}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label">Code</label>
                <input
                  type="text"
                  placeholder="e.g. EDW"
                  maxLength={10}
                  value={newBuildingCode}
                  onChange={e => setNewBuildingCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleAddBuilding()}
                  className="input text-sm"
                />
              </div>
            </div>
            <div>
              <label className="label">Layout type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['suite', 'shared_bath', 'standalone'] as const).map(lt => (
                  <button
                    key={lt}
                    onClick={() => setNewBuildingLayout(lt)}
                    className={`text-xs py-2.5 rounded-xl border-2 font-medium transition-colors ${
                      newBuildingLayout === lt
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >{LAYOUT_LABELS[lt]}</button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {newBuildingLayout === 'suite'       && 'Rooms are grouped into suites (e.g. two rooms share a common area).'}
                {newBuildingLayout === 'shared_bath' && 'Individual rooms sharing common bathrooms per floor.'}
                {newBuildingLayout === 'standalone'  && 'Each room is fully independent.'}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setAddBuildingOpen(false)} className="btn-secondary btn-md flex-1 text-sm">Cancel</button>
              <button onClick={handleAddBuilding} disabled={saving || !newBuildingName.trim() || !newBuildingCode.trim()}
                className="btn-primary btn-md flex-1 text-sm">
                {saving && <Loader2 size={14} className="animate-spin" />} Create Building
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Building Modal */}
      {editBuilding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-popover w-full max-w-md p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-slate-900">Edit Building</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="label">Name</label>
                <input
                  autoFocus
                  type="text"
                  value={editBuilding.name}
                  onChange={e => setEditBuilding({ ...editBuilding, name: e.target.value })}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label">Code</label>
                <input
                  type="text"
                  maxLength={10}
                  value={editBuilding.code}
                  onChange={e => setEditBuilding({ ...editBuilding, code: e.target.value.toUpperCase() })}
                  className="input text-sm"
                />
              </div>
            </div>
            <div>
              <label className="label">Layout type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['suite', 'shared_bath', 'standalone'] as const).map(lt => (
                  <button
                    key={lt}
                    onClick={() => setEditBuilding({ ...editBuilding, layout_type: lt })}
                    className={`text-xs py-2.5 rounded-xl border-2 font-medium transition-colors ${
                      editBuilding.layout_type === lt
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >{LAYOUT_LABELS[lt]}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditBuilding(null)} className="btn-secondary btn-md flex-1 text-sm">Cancel</button>
              <button onClick={handleEditBuilding} disabled={saving || !editBuilding.name.trim() || !editBuilding.code.trim()}
                className="btn-primary btn-md flex-1 text-sm">
                {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Suite Modal */}
      {editSuite && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-popover w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-slate-900">Edit Suite</h2>
            <div>
              <label className="label">Suite number</label>
              <input
                autoFocus
                type="number"
                value={editSuite.suite.number}
                onChange={e => setEditSuite({ ...editSuite, suite: { ...editSuite.suite, number: e.target.value as any } })}
                onKeyDown={e => e.key === 'Enter' && handleEditSuite()}
                className="input text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditSuite(null)} className="btn-secondary btn-md flex-1 text-sm">Cancel</button>
              <button onClick={handleEditSuite} disabled={saving}
                className="btn-primary btn-md flex-1 text-sm">
                {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {editRoom && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-popover w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-slate-900">Edit Room</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Letter</label>
                <select
                  value={editRoom.room.letter || ''}
                  onChange={e => setEditRoom({ ...editRoom, room: { ...editRoom.room, letter: e.target.value } })}
                  className="input text-sm"
                >
                  <option value="">—</option>
                  {LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Number</label>
                <input
                  autoFocus
                  type="number"
                  value={editRoom.room.number ?? ''}
                  onChange={e => setEditRoom({ ...editRoom, room: { ...editRoom.room, number: e.target.value as any } })}
                  onKeyDown={e => e.key === 'Enter' && handleEditRoom()}
                  className="input text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditRoom(null)} className="btn-secondary btn-md flex-1 text-sm">Cancel</button>
              <button onClick={handleEditRoom} disabled={saving}
                className="btn-primary btn-md flex-1 text-sm">
                {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {addRoomOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-popover w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-slate-900">New Room</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Letter</label>
                <select
                  value={newRoomLetter}
                  onChange={e => setNewRoomLetter(e.target.value)}
                  className="input text-sm"
                >
                  {LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Number</label>
                <input
                  autoFocus
                  type="number"
                  placeholder="e.g. 1"
                  value={newRoomNumber}
                  onChange={e => setNewRoomNumber(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddRoom()}
                  className="input text-sm"
                />
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Room will be created as <span className="font-semibold text-slate-700">Room {newRoomLetter}{newRoomNumber || '?'}</span>
              {addRoomOpen.suiteId && ` in Suite ${suites[addRoomOpen.buildingId]?.find(s => s.id === addRoomOpen.suiteId)?.number}`}
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setAddRoomOpen(null)} className="btn-secondary btn-md flex-1 text-sm">Cancel</button>
              <button onClick={handleAddRoom} disabled={saving || !newRoomNumber.trim()}
                className="btn-primary btn-md flex-1 text-sm">
                {saving && <Loader2 size={14} className="animate-spin" />} Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-popover w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Delete {deleteConfirm.type}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete <strong>{deleteConfirm.label}</strong>?
                  {deleteConfirm.type === 'building' && ' This will also delete all associated suites and rooms.'}
                  {deleteConfirm.type === 'suite'    && ' This will also delete all rooms inside this suite.'}
                  {deleteConfirm.type === 'room'     && ' Students in this room will also be removed.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary btn-md flex-1 text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={saving}
                className="btn-danger-solid btn-md flex-1 text-sm">
                {saving && <Loader2 size={14} className="animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

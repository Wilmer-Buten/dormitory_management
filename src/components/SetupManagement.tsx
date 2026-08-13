import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Building2, Plus, Trash2, ChevronDown, ChevronRight,
  Loader2, AlertTriangle, Pencil, DoorOpen, LayoutGrid, Table2, UserPlus, Check, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import SemesterManagement from './SemesterManagement';
import DataImport from './DataImport';
import CleanCheckDays from './CleanCheckDays';
import { AccessRestricted } from './AccessRestricted';
import { BuildingBlueprint, BuildingSilhouette, floorFromNumber } from './BuildingBlueprint';
import { BuildingRoomsTable } from './BuildingRoomsTable';

const API = import.meta.env.VITE_API_URL;

type SetupTab = 'buildings' | 'semesters' | 'import' | 'cleanCheck';

interface BuildingData {
  id: number;
  name: string;
  code: string;
  layout_type: 'suite' | 'shared_bath' | 'standalone';
  floors: number;
  suite_count: number;
  room_count: number;
}

interface SuiteData {
  id: number;
  building_id: number;
  number: number;
  room_count: number;
}

interface RoomStudent {
  id: number;
  name: string;
  lastname?: string | null;
  student_uid?: string | null;
}

interface RoomData {
  id: number;
  building_id: number;
  suite_id: number | null;
  suite_number: number | null;
  letter: string | null;
  number: number | string | null;
  student_count: number;
  students?: RoomStudent[];
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

type FloorPlanRow = {
  floor: number;
  start: number;
  end: number;
  units: number[];
  unitsText: string;
};

function isConsecutiveUnits(units: number[]) {
  if (units.length <= 1) return true;
  const sorted = sortUnitSuffixes(units);
  const normalized = sorted.map(u => (u === 100 ? 0 : u));
  for (let i = 1; i < normalized.length; i++) {
    if (normalized[i] !== normalized[i - 1] + 1) return false;
  }
  return true;
}

/** Internal 100 = room xx00 (100, 200, 300). */
function sortUnitSuffixes(units: number[]) {
  return [...units].sort((a, b) => {
    const aa = a === 100 ? 0 : a;
    const bb = b === 100 ? 0 : b;
    return aa - bb;
  });
}

function numberToUnitSuffix(n: number, floor?: number): number | null {
  if (!Number.isFinite(n) || n < 0) return null;
  let suffix: number;
  if (n === 0) suffix = 100;
  else if (n < 100) suffix = Math.trunc(n);
  else {
    const fl = Math.floor(n / 100) || 1;
    if (floor != null && fl !== Number(floor)) return null;
    const rem = n % 100;
    suffix = rem === 0 ? 100 : rem;
  }
  if (suffix < 1 || suffix > 100) return null;
  return suffix;
}

function addSuffixSpan(out: Set<number>, fromSuffix: number, toSuffix: number) {
  const a = fromSuffix === 100 ? 0 : fromSuffix;
  const b = toSuffix === 100 ? 0 : toSuffix;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  for (let i = lo; i <= hi; i++) out.add(i === 0 ? 100 : i);
}

/** Parse "0,1,4,5-8" or "100,101,105-108" → suffixes (100 = xx00). */
function parseUnitsText(text: string, floor?: number): number[] {
  const parts = text.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const out = new Set<number>();
  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (rangeMatch) {
      const left = numberToUnitSuffix(Number(rangeMatch[1]), floor);
      const right = numberToUnitSuffix(Number(rangeMatch[2]), floor);
      if (left == null || right == null) continue;
      addSuffixSpan(out, left, right);
      continue;
    }
    const n = Number(part.trim());
    const suffix = numberToUnitSuffix(n, floor);
    if (suffix != null) out.add(suffix);
  }
  return sortUnitSuffixes([...out]);
}

/** Compact list for display: 0, 1, 4, 5-8 */
function unitsToText(units: number[]) {
  const sorted = sortUnitSuffixes(units).map(u => (u === 100 ? 0 : u));
  if (!sorted.length) return '';
  const chunks: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j += 1;
    if (j > i + 1) chunks.push(`${sorted[i]}-${sorted[j]}`);
    else if (j === i + 1) {
      chunks.push(String(sorted[i]));
      chunks.push(String(sorted[j]));
    } else chunks.push(String(sorted[i]));
    i = j + 1;
  }
  return chunks.join(', ');
}

function unitsFromRange(start: number, end: number) {
  let s = Math.trunc(Number(start));
  let e = Math.trunc(Number(end));
  if (!Number.isFinite(s)) s = 1;
  if (!Number.isFinite(e)) return s === 0 ? [100] : [];
  if (s < 0 || s > 99) s = 1;
  if (e < 0) return [];
  if (s === 0 && e === 0) return [100];
  if (e > 99) e = 99;
  const units: number[] = [];
  if (s === 0) {
    units.push(100);
    s = 1;
  }
  if (e < s) return units;
  for (let u = s; u <= e; u++) units.push(u);
  return sortUnitSuffixes(units);
}

function fullUnitNumber(floor: number, suffix: number) {
  if (suffix === 100 || suffix === 0) return floor * 100;
  return floor * 100 + suffix;
}

function previewFullNumbers(floor: number, units: number[]) {
  return sortUnitSuffixes(units).map(u => fullUnitNumber(floor, u)).join(', ');
}

function rangePreview(floor: number, start: number, end: number) {
  const units = unitsFromRange(start, end);
  if (!units.length) return 'empty';
  if (units.length === 1) return String(fullUnitNumber(floor, units[0]));
  const first = fullUnitNumber(floor, units[0]);
  const last = fullUnitNumber(floor, units[units.length - 1]);
  return `${first}–${last}`;
}

function makePlanRow(floor: number, units: number[]): FloorPlanRow {
  const sorted = sortUnitSuffixes(units);
  const hasXx00 = sorted.includes(100);
  const rest = sorted.filter(u => u !== 100);
  return {
    floor,
    units: sorted,
    unitsText: unitsToText(sorted),
    start: hasXx00 ? 0 : (rest[0] || sorted[0] || 1),
    end: rest.length ? rest[rest.length - 1] : (hasXx00 ? 0 : 0),
  };
}

function authHeader(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function SetupManagement({ defaultTab = 'buildings' }: { defaultTab?: SetupTab }) {
  const { accessToken, currentUser, getTranslation, setCurrentSection } = useStore();
  const t = getTranslation();
  const isSupervisor = currentUser?.role === 'supervisor';
  const isAdmin = currentUser?.role === 'admin';
  const canCreateDeleteBuilding = isAdmin;
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
  const [editBuildingOriginalFloors, setEditBuildingOriginalFloors] = useState(1);
  const [manageGenerate, setManageGenerate] = useState(true);
  const [manageSameFloors, setManageSameFloors] = useState(true);
  const [manageAllowGaps, setManageAllowGaps] = useState(false);
  const [manageUnitStart, setManageUnitStart] = useState(0);
  const [manageUnitEnd, setManageUnitEnd] = useState(4);
  const [manageUnitsText, setManageUnitsText] = useState('0, 1, 2, 3, 4');
  const [manageFloorPlans, setManageFloorPlans] = useState<FloorPlanRow[]>([]);
  const [manageRoomsPerSuite, setManageRoomsPerSuite] = useState(2);
  const [editSuite, setEditSuite]               = useState<{ buildingId: number; suite: SuiteData } | null>(null);
  const [editRoom, setEditRoom]                 = useState<{ buildingId: number; room: RoomData } | null>(null);
  const [editRoomStudents, setEditRoomStudents] = useState<RoomStudent[]>([]);
  const [loadingRoomStudents, setLoadingRoomStudents] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentLastname, setNewStudentLastname] = useState('');
  const [newStudentUid, setNewStudentUid] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentLastname, setEditStudentLastname] = useState('');
  const [editStudentUid, setEditStudentUid] = useState('');
  const [buildingView, setBuildingView] = useState<Record<number, 'blueprint' | 'table'>>({});

  const [newBuildingName, setNewBuildingName]     = useState('');
  const [newBuildingCode, setNewBuildingCode]     = useState('');
  const [newBuildingLayout, setNewBuildingLayout] = useState<'suite' | 'shared_bath' | 'standalone'>('suite');
  const [newBuildingFloors, setNewBuildingFloors] = useState(3);
  const [newBuildingSameFloors, setNewBuildingSameFloors] = useState(true);
  const [newBuildingAllowGaps, setNewBuildingAllowGaps] = useState(false);
  const [newBuildingUnitStart, setNewBuildingUnitStart] = useState(0);
  const [newBuildingUnitEnd, setNewBuildingUnitEnd] = useState(4);
  const [newBuildingUnitsText, setNewBuildingUnitsText] = useState('0, 1, 2, 3, 4');
  const [newBuildingFloorPlans, setNewBuildingFloorPlans] = useState<FloorPlanRow[]>([
    makePlanRow(1, [100, 1, 2, 3, 4]),
    makePlanRow(2, [100, 1, 2, 3, 4]),
    makePlanRow(3, [100, 1, 2, 3, 4]),
  ]);
  const [newBuildingRoomsPerSuite, setNewBuildingRoomsPerSuite] = useState(2);
  const [newSuiteNumber, setNewSuiteNumber]       = useState('');
  const [newRoomLetter, setNewRoomLetter]         = useState('A');
  const [newRoomNumber, setNewRoomNumber]         = useState('');
  const [saving, setSaving]                       = useState(false);

  const syncFloorPlans = (floors: number, units: number[]) => {
    const safeFloors = Math.max(1, Math.min(30, floors));
    setNewBuildingFloorPlans(prev =>
      Array.from({ length: safeFloors }, (_, i) => {
        const floor = i + 1;
        const existing = prev.find(p => p.floor === floor);
        return existing ?? makePlanRow(floor, units);
      })
    );
  };

  const resetNewBuildingForm = () => {
    setNewBuildingName('');
    setNewBuildingCode('');
    setNewBuildingLayout('suite');
    setNewBuildingFloors(3);
    setNewBuildingSameFloors(true);
    setNewBuildingAllowGaps(false);
    setNewBuildingUnitStart(0);
    setNewBuildingUnitEnd(4);
    setNewBuildingUnitsText('0, 1, 2, 3, 4');
    setNewBuildingFloorPlans([
      makePlanRow(1, [100, 1, 2, 3, 4]),
      makePlanRow(2, [100, 1, 2, 3, 4]),
      makePlanRow(3, [100, 1, 2, 3, 4]),
    ]);
    setNewBuildingRoomsPerSuite(2);
  };

  const unitLabel = newBuildingLayout === 'suite' ? 'suite' : 'room';
  const resolvedNewUnits = newBuildingAllowGaps
    ? parseUnitsText(newBuildingUnitsText)
    : unitsFromRange(newBuildingUnitStart, newBuildingUnitEnd);
  const createPreviewPlans: FloorPlanRow[] = newBuildingSameFloors
    ? Array.from({ length: newBuildingFloors }, (_, i) => makePlanRow(i + 1, resolvedNewUnits))
    : newBuildingFloorPlans.map(p =>
        makePlanRow(
          p.floor,
          newBuildingAllowGaps
            ? parseUnitsText(p.unitsText || unitsToText(p.units))
            : unitsFromRange(p.start, p.end)
        )
      );
  const createPreviewTotal = createPreviewPlans.reduce((sum, p) => sum + p.units.length, 0);

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
    fetchBuildings();
  }, [fetchBuildings]);

  const unitSuffixFromNumber = (raw: number | string | null | undefined) => {
    const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? '').replace(/\D/g, ''), 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n < 100) return n;
    const suffix = n % 100;
    return suffix === 0 ? 100 : suffix;
  };

  const deriveFloorPlans = (
    building: BuildingData,
    floorCount: number,
    bSuites: SuiteData[],
    bRooms: RoomData[],
  ) => {
    const plans: FloorPlanRow[] = [];
    let allowGaps = false;
    for (let floor = 1; floor <= floorCount; floor++) {
      const suffixes =
        building.layout_type === 'suite'
          ? bSuites
              .filter(s => floorFromNumber(s.number) === floor)
              .map(s => unitSuffixFromNumber(s.number))
              .filter((n): n is number => n != null)
          : bRooms
              .filter(r => !r.suite_id && floorFromNumber(r.number ?? r.suite_number) === floor)
              .map(r => unitSuffixFromNumber(r.number ?? r.suite_number))
              .filter((n): n is number => n != null);

      const unique = [...new Set(suffixes)].sort((a, b) => a - b);
      if (unique.length > 1 && !isConsecutiveUnits(unique)) allowGaps = true;
      plans.push(makePlanRow(floor, unique));
    }
    return { plans, allowGaps };
  };

  const openEditBuilding = async (building: BuildingData, currentFloors: number) => {
    setEditBuilding({ ...building, floors: currentFloors });
    setEditBuildingOriginalFloors(currentFloors);
    setManageGenerate(true);
    setManageSameFloors(false);
    setManageRoomsPerSuite(2);

    let bSuites = Array.isArray(suites[building.id]) ? suites[building.id] : [];
    let bRooms = Array.isArray(rooms[building.id]) ? rooms[building.id] : [];
    if (!suites[building.id] || !rooms[building.id] || !Array.isArray(suites[building.id]) || !Array.isArray(rooms[building.id])) {
      try {
        const headers = { headers: authHeader(accessToken) };
        const [suitesRes, roomsRes] = await Promise.all([
          fetch(`${API}/setup/buildings/${building.id}/suites`, headers),
          fetch(`${API}/setup/buildings/${building.id}/rooms`, headers),
        ]);
        const suitesJson = await suitesRes.json();
        const roomsJson = await roomsRes.json();
        bSuites = Array.isArray(suitesJson) ? suitesJson : [];
        bRooms = Array.isArray(roomsJson) ? roomsJson : [];
        setSuites(prev => ({ ...prev, [building.id]: bSuites }));
        setRooms(prev => ({ ...prev, [building.id]: bRooms }));
      } catch {
        bSuites = [];
        bRooms = [];
      }
    }

    const { plans, allowGaps } = deriveFloorPlans(building, currentFloors, bSuites, bRooms);
    setManageAllowGaps(allowGaps);
    setManageFloorPlans(plans);
    const withUnits = plans.filter(p => p.units.length > 0);
    if (withUnits.length) {
      const sample = withUnits[0];
      setManageUnitStart(sample.start);
      setManageUnitEnd(sample.end);
      setManageUnitsText(unitsToText(sample.units));
      const allSame =
        withUnits.length === currentFloors &&
        withUnits.every(p => unitsToText(p.units) === unitsToText(sample.units));
      setManageSameFloors(allSame);
    } else {
      setManageUnitStart(0);
      setManageUnitEnd(4);
      setManageUnitsText('0, 1, 2, 3, 4');
    }
  };

  const resizeEditFloorPlans = (target: number, fallbackUnits: number[]) => {
    const safeTarget = Math.max(1, Math.min(30, target));
    setManageFloorPlans(prev =>
      Array.from({ length: safeTarget }, (_, i) => {
        const floor = i + 1;
        return prev.find(p => p.floor === floor) ?? makePlanRow(floor, fallbackUnits);
      })
    );
  };

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
      if (!suitesRes.ok) throw new Error(suitesData?.message || 'Error loading suites');
      if (!roomsRes.ok) throw new Error(roomsData?.message || 'Error loading rooms');
      setSuites(prev => ({ ...prev, [id]: Array.isArray(suitesData) ? suitesData : [] }));
      setRooms (prev => ({ ...prev, [id]: Array.isArray(roomsData) ? roomsData : [] }));
    } catch (err: any) {
      toast.error(err?.message || 'Error loading building data');
      setSuites(prev => ({ ...prev, [id]: Array.isArray(prev[id]) ? prev[id] : [] }));
      setRooms(prev => ({ ...prev, [id]: Array.isArray(prev[id]) ? prev[id] : [] }));
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
    if (!canCreateDeleteBuilding) {
      toast.error('Only admins can create buildings');
      return;
    }
    if (!newBuildingName.trim() || !newBuildingCode.trim()) return;
    if (newBuildingAllowGaps) {
      if (newBuildingSameFloors && resolvedNewUnits.length === 0 && newBuildingUnitsText.trim()) {
        toast.error('Enter valid unit numbers (e.g. 0, 1, 4, 5-8)');
        return;
      }
    } else if (newBuildingSameFloors && newBuildingUnitEnd < newBuildingUnitStart) {
      toast.error('End number must be ≥ start number');
      return;
    }
    if (!newBuildingSameFloors) {
      const invalid = createPreviewPlans.find(p => !newBuildingAllowGaps && p.end > 0 && p.end < p.start);
      if (invalid) {
        toast.error(`Floor ${invalid.floor}: end number must be ≥ start`);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/setup/buildings`, {
        method: 'POST',
        headers: authHeader(accessToken),
        body: JSON.stringify({
          name: newBuildingName.trim(),
          code: newBuildingCode.trim(),
          layout_type: newBuildingLayout,
          floors: newBuildingFloors,
          same_floors: newBuildingSameFloors,
          allow_gaps: newBuildingAllowGaps,
          unit_start: newBuildingUnitStart,
          unit_end: newBuildingUnitEnd,
          units: newBuildingSameFloors ? resolvedNewUnits : undefined,
          floor_plans: newBuildingSameFloors
            ? undefined
            : createPreviewPlans.map(p => ({ floor: p.floor, units: p.units })),
          rooms_per_suite: newBuildingRoomsPerSuite,
          generate: createPreviewTotal > 0,
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.message || 'Error creating building');
      setBuildings(prev => [...prev, { ...created, floors: created.floors ?? newBuildingFloors }]);
      setAddBuildingOpen(false);
      resetNewBuildingForm();
      toast.success(`Building "${created.name}" created`);
    } catch (err: any) { toast.error(err.message || 'Error creating building'); }
    finally { setSaving(false); }
  };

  const handleEditBuilding = async () => {
    if (!editBuilding || !editBuilding.name.trim() || !editBuilding.code.trim()) return;
    const targetFloors = editBuilding.floors || 1;
    const resolvedManageUnits = manageAllowGaps
      ? parseUnitsText(manageUnitsText)
      : unitsFromRange(manageUnitStart, manageUnitEnd);
    const editPlans: FloorPlanRow[] = manageSameFloors
      ? Array.from({ length: targetFloors }, (_, i) => makePlanRow(i + 1, resolvedManageUnits))
      : Array.from({ length: targetFloors }, (_, i) => {
          const floor = i + 1;
          const existing = manageFloorPlans.find(p => p.floor === floor);
          if (!existing) return makePlanRow(floor, resolvedManageUnits);
          return makePlanRow(
            floor,
            manageAllowGaps
              ? parseUnitsText(existing.unitsText || unitsToText(existing.units))
              : unitsFromRange(existing.start, existing.end)
          );
        });

    if (manageGenerate && manageAllowGaps && manageSameFloors && resolvedManageUnits.length === 0 && manageUnitsText.trim()) {
      toast.error('Enter valid unit numbers (e.g. 0, 1, 4, 5-8)');
      return;
    }
    if (manageGenerate && !manageAllowGaps && manageSameFloors && manageUnitEnd < manageUnitStart) {
      toast.error('End number must be ≥ start number');
      return;
    }
    if (manageGenerate && !manageSameFloors && !manageAllowGaps) {
      const invalid = editPlans.find(p => p.end > 0 && p.end < p.start);
      if (invalid) {
        toast.error(`Floor ${invalid.floor}: end number must be ≥ start`);
        return;
      }
    }
    setSaving(true);
    try {
      const metaRes = await fetch(`${API}/setup/buildings/${editBuilding.id}`, {
        method: 'PUT',
        headers: authHeader(accessToken),
        body: JSON.stringify({
          name: editBuilding.name.trim(),
          code: editBuilding.code.trim(),
          layout_type: editBuilding.layout_type,
          floors: editBuildingOriginalFloors,
        }),
      });
      const metaUpdated = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaUpdated.message || 'Error updating building');

      const floorsRes = await fetch(`${API}/setup/buildings/${editBuilding.id}/floors`, {
        method: 'POST',
        headers: authHeader(accessToken),
        body: JSON.stringify({
          target_floors: targetFloors,
          sync_units: manageGenerate,
          same_floors: manageSameFloors,
          allow_gaps: manageAllowGaps,
          unit_start: manageUnitStart,
          unit_end: manageUnitEnd,
          units: manageSameFloors ? resolvedManageUnits : undefined,
          floor_plans: manageSameFloors
            ? undefined
            : editPlans.map(p => ({ floor: p.floor, units: p.units })),
          rooms_per_suite: manageRoomsPerSuite,
        }),
      });
      const floorsPayload = await floorsRes.json();
      if (!floorsRes.ok) throw new Error(floorsPayload.message || 'Error updating floors');
      await loadBuildingData(editBuilding);

      setBuildings(prev => prev.map(b =>
        b.id === editBuilding.id
          ? {
              ...b,
              ...metaUpdated,
              floors: floorsPayload.floors ?? targetFloors,
              suite_count: floorsPayload.suite_count ?? b.suite_count,
              room_count: floorsPayload.room_count ?? b.room_count,
            }
          : b
      ));
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

  const syncRoomStudentCount = (buildingId: number, roomId: number, students: RoomStudent[]) => {
    setRooms(prev => ({
      ...prev,
      [buildingId]: (prev[buildingId] || []).map(r =>
        r.id === roomId ? { ...r, students, student_count: students.length } : r
      ),
    }));
  };

  const closeEditRoom = () => {
    setEditRoom(null);
    setEditRoomStudents([]);
    setAddingStudent(false);
    setNewStudentName('');
    setNewStudentLastname('');
    setNewStudentUid('');
    setEditingStudentId(null);
  };

  const openEditRoom = async (buildingId: number, room: RoomData) => {
    setEditRoom({ buildingId, room: { ...room } });
    setAddingStudent(false);
    setEditingStudentId(null);
    setNewStudentName('');
    setNewStudentLastname('');
    setNewStudentUid('');
    if (Array.isArray(room.students) && room.students.length) {
      setEditRoomStudents(room.students);
      setLoadingRoomStudents(false);
    } else {
      setEditRoomStudents([]);
      setLoadingRoomStudents(true);
    }
    try {
      const res = await fetch(`${API}/students/room/${room.id}`, { headers: authHeader(accessToken) });
      if (!res.ok) throw new Error('Failed to load students');
      const list = await res.json();
      const normalized: RoomStudent[] = (list || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        lastname: s.lastname ?? null,
        student_uid: s.student_uid ?? s.studentUid ?? null,
      }));
      setEditRoomStudents(normalized);
      syncRoomStudentCount(buildingId, room.id, normalized);
    } catch {
      if (!Array.isArray(room.students)) toast.error('Could not load students for this room');
    } finally {
      setLoadingRoomStudents(false);
    }
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
        [editRoom.buildingId]: (prev[editRoom.buildingId] || []).map(r =>
          r.id === updated.id
            ? { ...r, ...updated, students: editRoomStudents, student_count: editRoomStudents.length }
            : r
        ),
      }));
      closeEditRoom();
      toast.success('Room updated');
    } catch (err: any) { toast.error(err.message || 'Error updating room'); }
    finally { setSaving(false); }
  };

  const handleAddRoomStudent = async () => {
    if (!editRoom || !newStudentName.trim() || !newStudentLastname.trim() || !newStudentUid.trim()) return;
    if (editRoomStudents.length >= 2) {
      toast.error('Room is full (maximum 2 residents)');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/students/add/`, {
        method: 'POST',
        headers: authHeader(accessToken),
        body: JSON.stringify({
          name: newStudentName.trim(),
          lastname: newStudentLastname.trim(),
          roomId: editRoom.room.id,
          studentUid: newStudentUid.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && (/full/i.test(String(data.message || '')) || data.error === 'Room is full')) {
          throw new Error('Room is full (maximum 2 residents)');
        }
        throw new Error(data.message || 'Error adding student');
      }
      const created: RoomStudent = {
        id: data.student.id,
        name: data.student.name,
        lastname: data.student.lastname ?? null,
        student_uid: data.student.studentUid ?? data.student.student_uid ?? null,
      };
      const next = [...editRoomStudents, created];
      setEditRoomStudents(next);
      syncRoomStudentCount(editRoom.buildingId, editRoom.room.id, next);
      setAddingStudent(false);
      setNewStudentName('');
      setNewStudentLastname('');
      setNewStudentUid('');
      toast.success('Student added');
    } catch (err: any) { toast.error(err.message || 'Error adding student'); }
    finally { setSaving(false); }
  };

  const handleSaveRoomStudent = async (studentId: number) => {
    if (!editRoom || !editStudentName.trim() || !editStudentLastname.trim() || !editStudentUid.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/students/${studentId}`, {
        method: 'PUT',
        headers: authHeader(accessToken),
        body: JSON.stringify({
          name: editStudentName.trim(),
          lastname: editStudentLastname.trim(),
          studentUid: editStudentUid.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error updating student');
      const next = editRoomStudents.map(s =>
        s.id === studentId
          ? {
              id: data.student.id,
              name: data.student.name,
              lastname: data.student.lastname ?? null,
              student_uid: data.student.student_uid ?? data.student.studentUid ?? null,
            }
          : s
      );
      setEditRoomStudents(next);
      syncRoomStudentCount(editRoom.buildingId, editRoom.room.id, next);
      setEditingStudentId(null);
      toast.success('Student updated');
    } catch (err: any) { toast.error(err.message || 'Error updating student'); }
    finally { setSaving(false); }
  };

  const handleDeleteRoomStudent = async (studentId: number) => {
    if (!editRoom) return;
    if (!confirm('Remove this student from the room?')) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/students/delete/${studentId}`, {
        method: 'DELETE',
        headers: authHeader(accessToken),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Error deleting student');
      const next = editRoomStudents.filter(s => s.id !== studentId);
      setEditRoomStudents(next);
      syncRoomStudentCount(editRoom.buildingId, editRoom.room.id, next);
      if (editingStudentId === studentId) setEditingStudentId(null);
      toast.success('Student removed');
    } catch (err: any) { toast.error(err.message || 'Error deleting student'); }
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
    if (!addRoomOpen) return;
    const { buildingId, suiteId } = addRoomOpen;
    const building = buildings.find(b => b.id === buildingId);
    const isSuiteRoom = !!suiteId || building?.layout_type === 'suite';
    if (isSuiteRoom && !newRoomLetter) return;
    if (!isSuiteRoom && !newRoomNumber.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/setup/rooms`, {
        method: 'POST',
        headers: authHeader(accessToken),
        body: JSON.stringify({
          building_id: buildingId,
          suite_id: suiteId || null,
          letter: isSuiteRoom ? newRoomLetter : null,
          number: isSuiteRoom ? null : parseInt(newRoomNumber),
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setRooms(prev => ({ ...prev, [buildingId]: [...(prev[buildingId] || []), { ...created, student_count: 0, suite_number: suites[buildingId]?.find(s => s.id === suiteId)?.number ?? null }] }));
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
      toast.success(isSuiteRoom ? `Room ${newRoomLetter} created` : `Room ${newRoomNumber} created`);
    } catch { toast.error('Error creating room'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'building' && !canCreateDeleteBuilding) {
      toast.error('Only admins can delete buildings');
      setDeleteConfirm(null);
      return;
    }
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

  if (loading && activeTab === 'buildings') {
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
            ? 'Manage your building layout, import residents, and clean check weekdays'
            : 'Manage buildings, suites, rooms, imports and clean check days'}
        </p>
        
        <div className="flex items-center justify-between mt-4 border-b border-slate-200 gap-3">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto">
            <button onClick={() => selectTab('buildings')} className={tabClass('buildings')}>
              {t.menu.dormitories}
            </button>
            {!isSupervisor && (
              <button onClick={() => selectTab('semesters')} className={tabClass('semesters')}>
                Semesters
              </button>
            )}
            <button onClick={() => selectTab('import')} className={tabClass('import')}>
              {t.menu.import}
            </button>
            <button onClick={() => selectTab('cleanCheck')} className={tabClass('cleanCheck')}>
              {t.menu.cleanCheck}
            </button>
          </div>
          
          {canCreateDeleteBuilding && activeTab === 'buildings' ? (
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
      ) : (
        <>

          {/* Buildings list */}
      {buildings.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>{isSupervisor ? 'No building assigned to your account.' : 'No buildings yet. Add one to get started.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buildings.map(b => {
            const isExpanded = expandedBuilding === b.id;
            const bRooms   = Array.isArray(rooms[b.id]) ? rooms[b.id] : [];
            const bSuites  = Array.isArray(suites[b.id]) ? suites[b.id] : [];
            const floorCount = Math.max(
              b.floors || 1,
              ...(b.layout_type === 'suite'
                ? bSuites.map(s => floorFromNumber(s.number))
                : bRooms.map(r => floorFromNumber(r.number ?? r.suite_number))),
              1
            );
            const unitsPerFloorHint = Math.max(
              2,
              Math.min(6, Math.ceil((b.layout_type === 'suite' ? (b.suite_count || 4) : (b.room_count || 4)) / floorCount))
            );

            const nextUnitNumber = (floor: number) => {
              const existing =
                b.layout_type === 'suite'
                  ? bSuites.filter(s => floorFromNumber(s.number) === floor).map(s => Number(s.number))
                  : bRooms.filter(r => floorFromNumber(r.number) === floor).map(r => Number(r.number));
              const base = floor * 100;
              let n = base;
              while (existing.includes(n)) n += 1;
              return String(n);
            };

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
                  <BuildingSilhouette
                    floors={floorCount}
                    unitsPerFloor={unitsPerFloorHint}
                    className="w-14 shrink-0"
                  />
                  <div className="flex-1 min-w-[8rem]">
                    <p className="font-semibold text-slate-800 truncate capitalize">{b.name}</p>
                    <p className="text-xs text-slate-400">
                      {floorCount} floor{floorCount !== 1 ? 's' : ''}
                      {b.suite_count > 0 && ` · ${b.suite_count} suite${b.suite_count !== 1 ? 's' : ''}`}
                      {` · ${b.room_count} room${b.room_count !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className={`badge ${LAYOUT_COLORS[b.layout_type]}`}>
                      {LAYOUT_LABELS[b.layout_type]}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); openEditBuilding(b, floorCount); }}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    {canCreateDeleteBuilding && (
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteConfirm({ type: 'building', id: b.id, label: b.name, buildingId: b.id }); }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded content — blueprint or table */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 pb-4 pt-3 space-y-3">
                    {loadingBuilding === b.id ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-7 h-7 animate-spin text-oakwood-blue" />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-slate-500">
                            Graphic layout or spreadsheet-style table
                          </p>
                          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
                            <button
                              type="button"
                              onClick={() => setBuildingView(prev => ({ ...prev, [b.id]: 'blueprint' }))}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                (buildingView[b.id] || 'blueprint') === 'blueprint'
                                  ? 'bg-oakwood-blue text-white'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <LayoutGrid size={13} /> Layout
                            </button>
                            <button
                              type="button"
                              onClick={() => setBuildingView(prev => ({ ...prev, [b.id]: 'table' }))}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                buildingView[b.id] === 'table'
                                  ? 'bg-oakwood-blue text-white'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <Table2 size={13} /> Table
                            </button>
                          </div>
                        </div>

                        {(buildingView[b.id] || 'blueprint') === 'blueprint' ? (
                      <BuildingBlueprint
                        layoutType={b.layout_type}
                        floors={floorCount}
                        suites={bSuites}
                        rooms={bRooms}
                        selectedSuiteId={expandedSuite}
                        onSelectSuite={(suiteId) =>
                          setExpandedSuite(prev => (prev === suiteId ? null : suiteId))
                        }
                        onEditSuite={(suiteId) => {
                          const suite = bSuites.find(s => s.id === suiteId);
                          if (suite) setEditSuite({ buildingId: b.id, suite: { ...suite } });
                        }}
                        onDeleteSuite={(suiteId) => {
                          const suite = bSuites.find(s => s.id === suiteId);
                          if (suite) setDeleteConfirm({ type: 'suite', id: suite.id, label: `Suite ${suite.number}`, buildingId: b.id });
                        }}
                        onAddSuite={(floor) => {
                          setAddSuiteOpen(b.id);
                          setNewSuiteNumber(nextUnitNumber(floor));
                        }}
                        onSelectRoom={(roomId) => {
                          const room = bRooms.find(r => r.id === roomId);
                          if (room) openEditRoom(b.id, room);
                        }}
                        onEditRoom={(roomId) => {
                          const room = bRooms.find(r => r.id === roomId);
                          if (room) openEditRoom(b.id, room);
                        }}
                        onDeleteRoom={(roomId) => {
                          const room = bRooms.find(r => r.id === roomId);
                          if (room) {
                            setDeleteConfirm({
                              type: 'room',
                              id: room.id,
                              label: `Room ${room.letter || ''}${room.number ?? ''}`,
                              buildingId: b.id,
                              suiteId: room.suite_id,
                            });
                          }
                        }}
                        onAddRoom={(floor, suiteId) => {
                          setAddRoomOpen({ buildingId: b.id, suiteId });
                          setNewRoomLetter('A');
                          setNewRoomNumber(suiteId ? '' : nextUnitNumber(floor));
                        }}
                        onAddFloor={async () => {
                          const nextFloors = floorCount + 1;
                          try {
                            const res = await fetch(`${API}/setup/buildings/${b.id}`, {
                              method: 'PUT',
                              headers: authHeader(accessToken),
                              body: JSON.stringify({
                                name: b.name,
                                code: b.code,
                                layout_type: b.layout_type,
                                floors: nextFloors,
                              }),
                            });
                            const updated = await res.json();
                            if (!res.ok) throw new Error(updated.message || 'Error adding floor');
                            setBuildings(prev => prev.map(x => x.id === b.id ? { ...x, floors: nextFloors } : x));
                            toast.success(`Floor ${nextFloors} added`);
                          } catch (err: any) {
                            toast.error(err.message || 'Error adding floor');
                          }
                        }}
                      />
                        ) : (
                          <BuildingRoomsTable
                            layoutType={b.layout_type}
                            suites={bSuites}
                            rooms={bRooms}
                            onEditRoom={(roomId) => {
                              const room = bRooms.find(r => r.id === roomId);
                              if (room) openEditRoom(b.id, room);
                            }}
                            onDeleteRoom={(roomId) => {
                              const room = bRooms.find(r => r.id === roomId);
                              if (room) {
                                setDeleteConfirm({
                                  type: 'room',
                                  id: room.id,
                                  label: `Room ${room.letter || ''}${room.number ?? ''}`,
                                  buildingId: b.id,
                                  suiteId: room.suite_id,
                                });
                              }
                            }}
                            onAddRoom={(floor, suiteId) => {
                              setAddRoomOpen({ buildingId: b.id, suiteId });
                              setNewRoomLetter('A');
                              setNewRoomNumber(suiteId ? '' : nextUnitNumber(floor));
                            }}
                            onEditSuite={(suiteId) => {
                              const suite = bSuites.find(s => s.id === suiteId);
                              if (suite) setEditSuite({ buildingId: b.id, suite: { ...suite } });
                            }}
                            onDeleteSuite={(suiteId) => {
                              const suite = bSuites.find(s => s.id === suiteId);
                              if (suite) setDeleteConfirm({ type: 'suite', id: suite.id, label: `Suite ${suite.number}`, buildingId: b.id });
                            }}
                            onAddSuite={(floor) => {
                              setAddSuiteOpen(b.id);
                              setNewSuiteNumber(nextUnitNumber(floor));
                            }}
                          />
                        )}
                      </>
                    )}

                    {(buildingView[b.id] || 'blueprint') === 'blueprint' && b.layout_type === 'suite' && expandedSuite && (() => {
                      const suite = bSuites.find(s => s.id === expandedSuite);
                      if (!suite) return null;
                      const suiteRooms = bRooms.filter(r => r.suite_id === suite.id);
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-oakwood-blue">
                              Suite {suite.number} rooms
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setAddRoomOpen({ buildingId: b.id, suiteId: suite.id });
                                setNewRoomLetter('A');
                                setNewRoomNumber('');
                              }}
                              className="text-xs font-medium text-oakwood-blue hover:text-oakwood-blue-dark inline-flex items-center gap-1"
                            >
                              <Plus size={13} /> Add room
                            </button>
                          </div>
                          {suiteRooms.length === 0 ? (
                            <p className="text-xs text-slate-400 py-2">No rooms yet — add letters A, B, …</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {suiteRooms.map(room => (
                                <div
                                  key={room.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5"
                                >
                                  <DoorOpen size={12} className="text-slate-400" />
                                  <button
                                    type="button"
                                    onClick={() => openEditRoom(b.id, room)}
                                    className="text-sm font-semibold text-slate-800 hover:text-oakwood-blue"
                                  >
                                    {room.letter || room.number || '?'}
                                  </button>
                                  <span className="text-[10px] text-slate-400">{room.student_count}</span>
                                  <button
                                    type="button"
                                    onClick={() => openEditRoom(b.id, room)}
                                    className="p-1 text-slate-400 hover:text-brand-600 rounded"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirm({
                                      type: 'room',
                                      id: room.id,
                                      label: `Room ${room.letter || room.number || ''}`,
                                      buildingId: b.id,
                                      suiteId: room.suite_id,
                                    })}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
          <div className="bg-white rounded-2xl shadow-popover w-full max-w-3xl p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900">New Building</h2>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="label">Name</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Edwards Hall"
                  value={newBuildingName}
                  onChange={e => setNewBuildingName(e.target.value)}
                  className="input text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Code</label>
                <input
                  type="text"
                  placeholder="e.g. EDW"
                  maxLength={10}
                  value={newBuildingCode}
                  onChange={e => setNewBuildingCode(e.target.value.toUpperCase())}
                  className="input text-sm"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="label">Layout</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['suite', 'shared_bath', 'standalone'] as const).map(lt => (
                    <button
                      key={lt}
                      type="button"
                      title={LAYOUT_LABELS[lt]}
                      onClick={() => setNewBuildingLayout(lt)}
                      className={`text-[10px] leading-tight py-2.5 px-1 rounded-lg border-2 font-medium transition-colors ${
                        newBuildingLayout === lt
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >{lt === 'suite' ? 'Suite' : lt === 'shared_bath' ? 'Shared' : 'Solo'}</button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Floors</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={newBuildingFloors}
                  onChange={e => {
                    const next = Math.max(1, Number(e.target.value) || 1);
                    setNewBuildingFloors(next);
                    syncFloorPlans(next, resolvedNewUnits.length ? resolvedNewUnits : [1, 2, 3, 4]);
                  }}
                  className="input text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBuildingSameFloors}
                  onChange={e => {
                    const checked = e.target.checked;
                    setNewBuildingSameFloors(checked);
                    if (!checked) syncFloorPlans(newBuildingFloors, resolvedNewUnits.length ? resolvedNewUnits : [1, 2, 3, 4]);
                  }}
                  className="mt-0.5 rounded border-slate-300 text-oakwood-blue focus:ring-oakwood-blue"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">All floors are the same</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Same {unitLabel} numbers on every floor
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBuildingAllowGaps}
                  onChange={e => {
                    const checked = e.target.checked;
                    setNewBuildingAllowGaps(checked);
                    if (checked) {
                      const units = unitsFromRange(newBuildingUnitStart, newBuildingUnitEnd);
                      setNewBuildingUnitsText(unitsToText(units.length ? units : [100, 1, 2, 3, 4]));
                      setNewBuildingFloorPlans(prev =>
                        prev.map(p => makePlanRow(p.floor, unitsFromRange(p.start, p.end)))
                      );
                    } else {
                      const units = parseUnitsText(newBuildingUnitsText);
                      if (units.length) {
                        const row = makePlanRow(1, units);
                        setNewBuildingUnitStart(row.start);
                        setNewBuildingUnitEnd(row.end);
                      }
                    }
                  }}
                  className="mt-0.5 rounded border-slate-300 text-oakwood-blue focus:ring-oakwood-blue"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">Numbers can have gaps</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    E.g. 0, 1, 4, 5-8 (0 = room 100; 5-8 = range)
                  </span>
                </span>
              </label>
            </div>

            {newBuildingSameFloors ? (
              newBuildingAllowGaps ? (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                  <div>
                    <label className="label">Unit numbers (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. 0, 1, 4, 5-8"
                      value={newBuildingUnitsText}
                      onChange={e => setNewBuildingUnitsText(e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 pb-2.5 sm:max-w-[14rem]">
                    Fl1: {previewFullNumbers(1, resolvedNewUnits) || '—'}
                  </p>
                </div>
              ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                    <label className="label">From number</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={newBuildingUnitStart}
                    onChange={e => {
                      const start = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                      setNewBuildingUnitStart(start);
                      if (newBuildingUnitEnd < start) setNewBuildingUnitEnd(start);
                    }}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label">To number</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={newBuildingUnitEnd}
                    onChange={e => {
                      const end = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                      setNewBuildingUnitEnd(Math.max(newBuildingUnitStart, end));
                    }}
                    className="input text-sm"
                  />
                </div>
                {newBuildingLayout === 'suite' && (
                  <div className="col-span-2">
                    <label className="label">Rooms per suite</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={newBuildingRoomsPerSuite}
                      onChange={e => setNewBuildingRoomsPerSuite(Math.max(1, Number(e.target.value) || 1))}
                      className="input text-sm"
                    />
                  </div>
                )}
              </div>
              )
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">
                  {newBuildingLayout === 'suite' ? 'Suites' : 'Rooms'} per floor
                  {newBuildingAllowGaps ? ' (list)' : ' (from → to)'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {newBuildingFloorPlans.map(plan => (
                    <div
                      key={plan.floor}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2"
                    >
                      {newBuildingAllowGaps ? (
                        <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                          <span className="text-xs font-semibold text-slate-500 w-8">Fl {plan.floor}</span>
                          <input
                            type="text"
                            placeholder="0, 1, 4, 5-8"
                            value={plan.unitsText}
                            onChange={e => {
                              const text = e.target.value;
                              const units = parseUnitsText(text);
                              setNewBuildingFloorPlans(prev => prev.map(p =>
                                p.floor === plan.floor
                                  ? { ...makePlanRow(p.floor, units), unitsText: text }
                                  : p
                              ));
                            }}
                            className="input text-sm"
                          />
                          <span className="col-span-2 text-[10px] text-slate-400 truncate pl-10">
                            {previewFullNumbers(plan.floor, parseUnitsText(plan.unitsText)) || 'empty'}
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-1.5 items-center">
                          <span className="text-xs font-semibold text-slate-500 w-8">Fl {plan.floor}</span>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            aria-label={`Floor ${plan.floor} from`}
                            value={plan.start}
                            onChange={e => {
                              const start = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                              setNewBuildingFloorPlans(prev => prev.map(p =>
                                p.floor === plan.floor
                                  ? makePlanRow(p.floor, unitsFromRange(start, Math.max(start, p.end)))
                                  : p
                              ));
                            }}
                            className="input text-sm"
                          />
                          <input
                            type="number"
                            min={0}
                            max={99}
                            aria-label={`Floor ${plan.floor} to`}
                            value={plan.end}
                            onChange={e => {
                              const end = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                              setNewBuildingFloorPlans(prev => prev.map(p =>
                                p.floor === plan.floor
                                  ? makePlanRow(p.floor, unitsFromRange(p.start, end))
                                  : p
                              ));
                            }}
                            className="input text-sm"
                          />
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {rangePreview(plan.floor, plan.start, plan.end) === 'empty'
                              ? '—'
                              : rangePreview(plan.floor, plan.start, plan.end)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400">
                    {newBuildingAllowGaps ? 'Use 0/100 for room 100; ranges like 5-8; or full numbers.' : 'From 0 = room 100. To < From clears a floor.'}
                  </p>
                  {newBuildingLayout === 'suite' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 whitespace-nowrap">Rooms / suite</label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={newBuildingRoomsPerSuite}
                        onChange={e => setNewBuildingRoomsPerSuite(Math.max(1, Number(e.target.value) || 1))}
                        className="input text-sm w-16"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {newBuildingSameFloors && newBuildingAllowGaps && newBuildingLayout === 'suite' && (
              <div className="max-w-xs">
                <label className="label">Rooms per suite</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={newBuildingRoomsPerSuite}
                  onChange={e => setNewBuildingRoomsPerSuite(Math.max(1, Number(e.target.value) || 1))}
                  className="input text-sm"
                />
              </div>
            )}

            <div className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 space-y-1">
              <p>
                Will create <strong>{newBuildingFloors}</strong> floor{newBuildingFloors !== 1 ? 's' : ''}
                {createPreviewTotal > 0 ? (
                  <> with <strong>{createPreviewTotal}</strong> {unitLabel}{createPreviewTotal !== 1 ? 's' : ''}
                    {newBuildingLayout === 'suite' ? <> (<strong>{newBuildingRoomsPerSuite}</strong> rooms each)</> : null}
                  </>
                ) : (
                  ' (empty — add units later from the blueprint)'
                )}
                .
              </p>
              {createPreviewTotal > 0 && (
                <p className="text-slate-400">
                  {newBuildingSameFloors
                    ? newBuildingAllowGaps
                      ? `Each floor: ${previewFullNumbers(1, resolvedNewUnits) || '—'} pattern (…, 2xx, 3xx, …)`
                      : `Each floor: ${rangePreview(1, newBuildingUnitStart, newBuildingUnitEnd)}, ${rangePreview(2, newBuildingUnitStart, newBuildingUnitEnd)}, …`
                    : createPreviewPlans
                        .filter(p => p.units.length > 0)
                        .map(p => `Fl${p.floor}: ${previewFullNumbers(p.floor, p.units)}`)
                        .join(' · ')}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setAddBuildingOpen(false); resetNewBuildingForm(); }} className="btn-secondary btn-md flex-1 text-sm">Cancel</button>
              <button onClick={handleAddBuilding} disabled={saving || !newBuildingName.trim() || !newBuildingCode.trim()}
                className="btn-primary btn-md flex-1 text-sm">
                {saving && <Loader2 size={14} className="animate-spin" />} Create Building
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Building Modal */}
      {editBuilding && (() => {
        const currentFloors = editBuildingOriginalFloors;
        const targetFloors = editBuilding.floors || 1;
        const isIncreasing = targetFloors > currentFloors;
        const isDecreasing = targetFloors < currentFloors;
        const newFloors = Math.max(0, targetFloors - currentFloors);
        const unitKind = editBuilding.layout_type === 'suite' ? 'suite' : 'room';
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-popover w-full max-w-3xl p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-900">Edit Building</h2>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="label">Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={editBuilding.name}
                    onChange={e => setEditBuilding({ ...editBuilding, name: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Code</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editBuilding.code}
                    onChange={e => setEditBuilding({ ...editBuilding, code: e.target.value.toUpperCase() })}
                    className="input text-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="label">Layout</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['suite', 'shared_bath', 'standalone'] as const).map(lt => (
                      <button
                        key={lt}
                        type="button"
                        title={LAYOUT_LABELS[lt]}
                        onClick={() => setEditBuilding({ ...editBuilding, layout_type: lt })}
                        className={`text-[10px] leading-tight py-2.5 px-1 rounded-lg border-2 font-medium transition-colors ${
                          editBuilding.layout_type === lt
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >{lt === 'suite' ? 'Suite' : lt === 'shared_bath' ? 'Shared' : 'Solo'}</button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Floors</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, targetFloors - 1);
                        setEditBuilding({ ...editBuilding, floors: next });
                        resizeEditFloorPlans(next, manageAllowGaps ? parseUnitsText(manageUnitsText) : unitsFromRange(manageUnitStart, manageUnitEnd));
                      }}
                      className="btn-secondary btn-sm px-2"
                      aria-label="Fewer floors"
                    >−</button>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={targetFloors}
                      onChange={e => {
                        const next = Math.max(1, Math.min(30, Number(e.target.value) || 1));
                        setEditBuilding({ ...editBuilding, floors: next });
                        resizeEditFloorPlans(next, manageAllowGaps ? parseUnitsText(manageUnitsText) : unitsFromRange(manageUnitStart, manageUnitEnd));
                      }}
                      className="input text-sm text-center"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(30, targetFloors + 1);
                        setEditBuilding({ ...editBuilding, floors: next });
                        resizeEditFloorPlans(next, manageAllowGaps ? parseUnitsText(manageUnitsText) : unitsFromRange(manageUnitStart, manageUnitEnd));
                      }}
                      className="btn-secondary btn-sm px-2"
                      aria-label="More floors"
                    >+</button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">was {currentFloors}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {editBuilding.layout_type === 'suite' ? 'Suites / rooms per floor' : 'Rooms per floor'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Saving adds missing units and removes ones not in the plan.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={manageGenerate}
                      onChange={e => setManageGenerate(e.target.checked)}
                      className="rounded border-slate-300 text-oakwood-blue focus:ring-oakwood-blue"
                    />
                    <span className="text-sm text-slate-700">Sync units</span>
                  </label>
                </div>

                {manageGenerate && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={manageSameFloors}
                          onChange={e => {
                            const checked = e.target.checked;
                            setManageSameFloors(checked);
                            const fallback = manageAllowGaps
                              ? parseUnitsText(manageUnitsText)
                              : unitsFromRange(manageUnitStart, manageUnitEnd);
                            if (!checked) resizeEditFloorPlans(targetFloors, fallback.length ? fallback : [1, 2, 3, 4]);
                            else {
                              setManageFloorPlans(
                                Array.from({ length: targetFloors }, (_, i) => makePlanRow(i + 1, fallback))
                              );
                            }
                          }}
                          className="mt-0.5 rounded border-slate-300 text-oakwood-blue focus:ring-oakwood-blue"
                        />
                        <span>
                          <span className="block text-sm font-medium text-slate-800">All floors are the same</span>
                          <span className="block text-xs text-slate-500 mt-0.5">Uncheck to edit each floor</span>
                        </span>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={manageAllowGaps}
                          onChange={e => {
                            const checked = e.target.checked;
                            setManageAllowGaps(checked);
                            if (checked) {
                              const units = unitsFromRange(manageUnitStart, manageUnitEnd);
                              setManageUnitsText(unitsToText(units.length ? units : [100, 1, 2, 3, 4]));
                              setManageFloorPlans(prev =>
                                prev.map(p => makePlanRow(p.floor, unitsFromRange(p.start, p.end)))
                              );
                            } else {
                              const units = parseUnitsText(manageUnitsText);
                              if (units.length) {
                                const row = makePlanRow(1, units);
                                setManageUnitStart(row.start);
                                setManageUnitEnd(row.end);
                              }
                            }
                          }}
                          className="mt-0.5 rounded border-slate-300 text-oakwood-blue focus:ring-oakwood-blue"
                        />
                        <span>
                          <span className="block text-sm font-medium text-slate-800">Numbers can have gaps</span>
                          <span className="block text-xs text-slate-500 mt-0.5">e.g. 0, 1, 4, 5-8 (0 = room 100)</span>
                        </span>
                      </label>
                    </div>

                    {manageSameFloors ? (
                      manageAllowGaps ? (
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                          <div>
                            <label className="label">Unit numbers (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. 0, 1, 4, 5-8"
                              value={manageUnitsText}
                              onChange={e => setManageUnitsText(e.target.value)}
                              className="input text-sm"
                            />
                          </div>
                          <div className="flex flex-wrap items-end gap-3">
                            <p className="text-[11px] text-slate-400 pb-2.5">
                              Fl1: {previewFullNumbers(1, parseUnitsText(manageUnitsText)) || '—'}
                            </p>
                            {editBuilding.layout_type === 'suite' && (
                              <div className="w-28">
                                <label className="label">Rooms / suite</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={8}
                                  value={manageRoomsPerSuite}
                                  onChange={e => setManageRoomsPerSuite(Math.max(1, Number(e.target.value) || 1))}
                                  className="input text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="label">From number</label>
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={manageUnitStart}
                              onChange={e => {
                                const start = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                                setManageUnitStart(start);
                                if (manageUnitEnd < start) setManageUnitEnd(start);
                              }}
                              className="input text-sm"
                            />
                          </div>
                          <div>
                            <label className="label">To number</label>
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={manageUnitEnd}
                              onChange={e => {
                                const end = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                                setManageUnitEnd(end);
                              }}
                              className="input text-sm"
                            />
                          </div>
                          {editBuilding.layout_type === 'suite' && (
                            <div className="col-span-2">
                              <label className="label">Rooms per suite (new only)</label>
                              <input
                                type="number"
                                min={1}
                                max={8}
                                value={manageRoomsPerSuite}
                                onChange={e => setManageRoomsPerSuite(Math.max(1, Number(e.target.value) || 1))}
                                className="input text-sm"
                              />
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-medium text-slate-600">
                            {unitKind}s per floor{manageAllowGaps ? ' (list)' : ' (from → to)'}
                          </p>
                          {editBuilding.layout_type === 'suite' && (
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-slate-600 whitespace-nowrap">Rooms / suite</label>
                              <input
                                type="number"
                                min={1}
                                max={8}
                                value={manageRoomsPerSuite}
                                onChange={e => setManageRoomsPerSuite(Math.max(1, Number(e.target.value) || 1))}
                                className="input text-sm w-16"
                              />
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                          {Array.from({ length: targetFloors }, (_, i) => {
                            const floor = i + 1;
                            const plan = manageFloorPlans.find(p => p.floor === floor) || makePlanRow(
                              floor,
                              manageAllowGaps
                                ? parseUnitsText(manageUnitsText)
                                : unitsFromRange(manageUnitStart, manageUnitEnd)
                            );
                            return (
                              <div
                                key={floor}
                                className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2"
                              >
                                {manageAllowGaps ? (
                                  <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                                    <span className="text-xs font-semibold text-slate-500 w-8">Fl {floor}</span>
                                    <input
                                      type="text"
                                      placeholder="0, 1, 4, 5-8"
                                      value={plan.unitsText}
                                      onChange={e => {
                                        const text = e.target.value;
                                        const units = parseUnitsText(text);
                                        setManageFloorPlans(prev => {
                                          const base = Array.from({ length: targetFloors }, (_, j) => {
                                            const f = j + 1;
                                            return prev.find(p => p.floor === f) || makePlanRow(f, []);
                                          });
                                          return base.map(p =>
                                            p.floor === floor
                                              ? { ...makePlanRow(floor, units), unitsText: text }
                                              : p
                                          );
                                        });
                                      }}
                                      className="input text-sm"
                                    />
                                    <span className="col-span-2 text-[10px] text-slate-400 truncate pl-10">
                                      {previewFullNumbers(floor, parseUnitsText(plan.unitsText)) || 'empty'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-1.5 items-center">
                                    <span className="text-xs font-semibold text-slate-500 w-8">Fl {floor}</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={99}
                                      aria-label={`Floor ${floor} from`}
                                      value={plan.start}
                                      onChange={e => {
                                        const start = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                                        setManageFloorPlans(prev => {
                                          const base = Array.from({ length: targetFloors }, (_, j) => {
                                            const f = j + 1;
                                            return prev.find(p => p.floor === f) || makePlanRow(f, unitsFromRange(manageUnitStart, manageUnitEnd));
                                          });
                                          return base.map(p =>
                                            p.floor === floor
                                              ? makePlanRow(floor, unitsFromRange(start, Math.max(start, p.end)))
                                              : p
                                          );
                                        });
                                      }}
                                      className="input text-sm"
                                    />
                                    <input
                                      type="number"
                                      min={0}
                                      max={99}
                                      aria-label={`Floor ${floor} to`}
                                      value={plan.end}
                                      onChange={e => {
                                        const end = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                                        setManageFloorPlans(prev => {
                                          const base = Array.from({ length: targetFloors }, (_, j) => {
                                            const f = j + 1;
                                            return prev.find(p => p.floor === f) || makePlanRow(f, unitsFromRange(manageUnitStart, manageUnitEnd));
                                          });
                                          return base.map(p =>
                                            p.floor === floor
                                              ? makePlanRow(floor, unitsFromRange(p.start, end))
                                              : p
                                          );
                                        });
                                      }}
                                      className="input text-sm"
                                    />
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                      {rangePreview(floor, plan.start, plan.end) === 'empty'
                                        ? '—'
                                        : rangePreview(floor, plan.start, plan.end)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {manageAllowGaps
                            ? 'Use 0/100 for room 100; ranges like 5-8; or full numbers.'
                            : 'From 0 = room 100. To < From clears a floor.'}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
                      {manageSameFloors
                        ? manageAllowGaps
                          ? <>Each floor: {unitKind}s <strong>{previewFullNumbers(1, parseUnitsText(manageUnitsText)) || '—'}</strong> pattern</>
                          : <>Each floor: {unitKind}s <strong>{rangePreview(1, manageUnitStart, manageUnitEnd)}</strong> pattern</>
                        : <>Custom {manageAllowGaps ? 'lists' : 'ranges'} for floors 1–{targetFloors}.</>}
                      {isIncreasing ? <> · Adding {newFloors} floor{newFloors !== 1 ? 's' : ''}.</> : null}
                      {isDecreasing ? <> · Removing floors {targetFloors + 1}–{currentFloors}.</> : null}
                    </p>
                  </>
                )}
              </div>

              {isDecreasing && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                  Reducing to <strong>{targetFloors}</strong> floor{targetFloors !== 1 ? 's' : ''} will delete
                  all suites/rooms on floors <strong>{targetFloors + 1}–{currentFloors}</strong> (and their students).
                </div>
              )}


              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditBuilding(null)} className="btn-secondary btn-md flex-1 text-sm">Cancel</button>
                <button onClick={handleEditBuilding} disabled={saving || !editBuilding.name.trim() || !editBuilding.code.trim()}
                  className="btn-primary btn-md flex-1 text-sm">
                  {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Suite Modal */}
      {addSuiteOpen !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-popover w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-slate-900">New Suite</h2>
            <div>
              <label className="label">Suite number</label>
              <input
                autoFocus
                type="number"
                placeholder="e.g. 201"
                value={newSuiteNumber}
                onChange={e => setNewSuiteNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSuite(addSuiteOpen)}
                className="input text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setAddSuiteOpen(null)} className="btn-secondary btn-md flex-1 text-sm">Cancel</button>
              <button onClick={() => handleAddSuite(addSuiteOpen)} disabled={saving || !newSuiteNumber.trim()}
                className="btn-primary btn-md flex-1 text-sm">
                {saving && <Loader2 size={14} className="animate-spin" />} Create Suite
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
          <div className="bg-white rounded-2xl shadow-popover w-full max-w-lg p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Room</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update room details and manage students
                </p>
              </div>
              <button type="button" onClick={closeEditRoom} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

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
                  type="number"
                  value={editRoom.room.number ?? ''}
                  onChange={e => setEditRoom({ ...editRoom, room: { ...editRoom.room, number: e.target.value as any } })}
                  className="input text-sm"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Students</p>
                  <p className="text-[11px] text-slate-500">
                    {editRoomStudents.length} in this room
                  </p>
                </div>
                {!addingStudent && (
                  <button
                    type="button"
                    disabled={editRoomStudents.length >= 2}
                    title={editRoomStudents.length >= 2 ? 'Room is full (maximum 2 residents)' : 'Add resident'}
                    onClick={() => { setAddingStudent(true); setEditingStudentId(null); }}
                    className="btn-secondary btn-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus size={13} /> Add
                  </button>
                )}
              </div>
              {editRoomStudents.length >= 2 && !addingStudent && (
                <p className="text-[11px] text-amber-600">Room is full (maximum 2 residents)</p>
              )}

              {loadingRoomStudents ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-oakwood-blue" />
                </div>
              ) : (
                <div className="space-y-2">
                  {editRoomStudents.length === 0 && !addingStudent && (
                    <p className="text-sm text-slate-400 py-2 text-center">No students assigned</p>
                  )}
                  {editRoomStudents.map(student => (
                    <div key={student.id} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                      {editingStudentId === student.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              autoFocus
                              type="text"
                              value={editStudentName}
                              onChange={e => setEditStudentName(e.target.value)}
                              className="input text-sm"
                              placeholder="First name"
                            />
                            <input
                              type="text"
                              value={editStudentLastname}
                              onChange={e => setEditStudentLastname(e.target.value)}
                              className="input text-sm"
                              placeholder="Last name"
                            />
                          </div>
                          <input
                            type="text"
                            value={editStudentUid}
                            onChange={e => setEditStudentUid(e.target.value)}
                            className="input text-sm"
                            placeholder="Institutional ID (required)"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={() => setEditingStudentId(null)} className="btn-secondary btn-sm text-xs">
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={saving || !editStudentName.trim() || !editStudentLastname.trim() || !editStudentUid.trim()}
                              onClick={() => handleSaveRoomStudent(student.id)}
                              className="btn-primary btn-sm text-xs"
                            >
                              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {[student.name, student.lastname].filter(Boolean).join(' ')}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {student.student_uid || 'No institutional ID'}
                            </p>
                          </div>
                          <button
                            type="button"
                            title="Edit student"
                            onClick={() => {
                              setEditingStudentId(student.id);
                              setEditStudentName(student.name);
                              setEditStudentLastname(student.lastname || '');
                              setEditStudentUid(student.student_uid || '');
                              setAddingStudent(false);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-oakwood-blue hover:bg-white"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            title="Remove student"
                            onClick={() => handleDeleteRoomStudent(student.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {addingStudent && (
                    <div className="rounded-lg border border-dashed border-oakwood-blue/30 bg-oakwood-blue-50/40 px-2.5 py-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={newStudentName}
                          onChange={e => setNewStudentName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddRoomStudent()}
                          className="input text-sm"
                          placeholder="First name"
                        />
                        <input
                          type="text"
                          value={newStudentLastname}
                          onChange={e => setNewStudentLastname(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddRoomStudent()}
                          className="input text-sm"
                          placeholder="Last name"
                        />
                      </div>
                      <input
                        type="text"
                        value={newStudentUid}
                        onChange={e => setNewStudentUid(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddRoomStudent()}
                        className="input text-sm"
                        placeholder="Institutional ID (required)"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setAddingStudent(false); setNewStudentName(''); setNewStudentLastname(''); setNewStudentUid(''); }}
                          className="btn-secondary btn-sm text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={saving || !newStudentName.trim() || !newStudentLastname.trim() || !newStudentUid.trim()}
                          onClick={handleAddRoomStudent}
                          className="btn-primary btn-sm text-xs"
                        >
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add student
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={closeEditRoom} className="btn-secondary btn-md flex-1 text-sm">Close</button>
              <button onClick={handleEditRoom} disabled={saving}
                className="btn-primary btn-md flex-1 text-sm">
                {saving && <Loader2 size={14} className="animate-spin" />} Save room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {addRoomOpen && (() => {
        const building = buildings.find(b => b.id === addRoomOpen.buildingId);
        const isSuiteRoom = !!addRoomOpen.suiteId || building?.layout_type === 'suite';
        const suiteNum = addRoomOpen.suiteId
          ? suites[addRoomOpen.buildingId]?.find(s => s.id === addRoomOpen.suiteId)?.number
          : null;
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-popover w-full max-w-sm p-6 space-y-4 animate-slide-up">
              <h2 className="text-lg font-bold text-slate-900">New Room</h2>
              {isSuiteRoom ? (
                <div>
                  <label className="label">Letter</label>
                  <select
                    autoFocus
                    value={newRoomLetter}
                    onChange={e => setNewRoomLetter(e.target.value)}
                    className="input text-sm"
                  >
                    {LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <p className="text-sm text-slate-500 mt-2">
                    Creates <span className="font-semibold text-slate-700">Room {newRoomLetter}</span>
                    {suiteNum != null && <> in Suite {suiteNum}</>}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="label">Room number</label>
                  <input
                    autoFocus
                    type="number"
                    placeholder="e.g. 201"
                    value={newRoomNumber}
                    onChange={e => setNewRoomNumber(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddRoom()}
                    className="input text-sm"
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    Creates <span className="font-semibold text-slate-700">Room {newRoomNumber || '?'}</span>
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAddRoomOpen(null)} className="btn-secondary btn-md flex-1 text-sm">Cancel</button>
                <button
                  onClick={handleAddRoom}
                  disabled={saving || (isSuiteRoom ? !newRoomLetter : !newRoomNumber.trim())}
                  className="btn-primary btn-md flex-1 text-sm"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />} Create Room
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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

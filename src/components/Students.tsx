import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, X, Calendar, MapPin, User,
  CheckCircle2, XCircle, Clock, ArrowLeft, Loader2,
  TrendingUp, Eye, UserPlus, DoorOpen
} from 'lucide-react';
import { useStore } from '../store/useStore';
import toast, { Toaster } from 'react-hot-toast';

interface StudentDetail {
  id: number | string;
  name: string;
  lastname?: string | null;
  student_uid?: string | null;
  room: string;
  building: string;
  suite_number?: number | string | null;
  room_letter?: string | null;
}

interface AssignableRoom {
  id: number;
  letter: string | null;
  number: number | string | null;
  suite_number: number | string | null;
  student_count?: number;
}

interface AttendanceRecord {
  date: string;
  is_present: boolean | number | null;
  in_room: boolean | number | null;
  checked_by: string | null;
  checked_at: string | null;
}

type DetailStatus = 'present' | 'in_room' | 'absent' | 'pending';

const API = import.meta.env.VITE_API_URL;

const isTruthy = (v: boolean | number | null | undefined) => v === true || v === 1;
const isFalsyFlag = (v: boolean | number | null | undefined) => v === false || v === 0;

function classifyRecord(record: AttendanceRecord): DetailStatus {
  if (isTruthy(record.is_present)) return 'present';
  if (isTruthy(record.in_room)) return 'in_room';
  if (isFalsyFlag(record.is_present)) return 'absent';
  return 'pending';
}

function toDateKey(raw: string | null | undefined): string {
  if (!raw) return '';
  const s = String(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function roomOptionLabel(room: AssignableRoom): string {
  if (room.letter) {
    const suite = room.suite_number != null ? String(room.suite_number) : '';
    return suite ? `${suite}${String(room.letter).toUpperCase()}` : String(room.letter).toUpperCase();
  }
  if (room.number != null && room.number !== '') return String(room.number);
  return `Room #${room.id}`;
}

function Students() {
  const { currentUser, accessToken, buildings, fetchBuildings, getTranslation } = useStore();
  const queryClient = useQueryClient();
  const t = getTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLastname, setCreateLastname] = useState('');
  const [createUid, setCreateUid] = useState('');
  const [createBuildingId, setCreateBuildingId] = useState<number | null>(null);
  const [createRoomId, setCreateRoomId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isSupervisor = currentUser?.role === 'supervisor';
  const canCreateResidents = isAdmin || isSupervisor;
  const buildingId = isAdmin ? selectedBuildingId : currentUser?.building_id;

  useEffect(() => {
    if (canCreateResidents || isAdmin) {
      if (buildings.length === 0) fetchBuildings();
    }
  }, [canCreateResidents, isAdmin, buildings.length, fetchBuildings]);

  const openCreateModal = () => {
    const defaultBuilding = isAdmin
      ? selectedBuildingId ?? buildings[0]?.id ?? null
      : currentUser?.building_id ?? null;
    setCreateBuildingId(defaultBuilding);
    setCreateRoomId(null);
    setCreateName('');
    setCreateLastname('');
    setCreateUid('');
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setShowCreateModal(false);
  };

  const { data: assignableRooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['assignable-rooms', createBuildingId],
    queryFn: async () => {
      const res = await fetch(`${API}/setup/buildings/${createBuildingId}/rooms`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to load rooms');
      const data = await res.json();
      return (Array.isArray(data) ? data : []) as AssignableRoom[];
    },
    enabled: showCreateModal && !!accessToken && createBuildingId != null,
    staleTime: 0,
  });

  useEffect(() => {
    setCreateRoomId(null);
  }, [createBuildingId]);

  const { data: students = [], isLoading: isLoadingStudents, isError: isStudentsError, refetch: refetchStudents } = useQuery({
    queryKey: ['students-list', buildingId],
    queryFn: async () => {
      const url = buildingId
        ? `${API}/students?building_id=${buildingId}`
        : `${API}/students`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch students');
      return res.json() as Promise<StudentDetail[]>;
    },
    enabled: !!accessToken,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const MAX_RESIDENTS_PER_ROOM = 2;
  const selectedCreateRoom = assignableRooms.find((r) => r.id === createRoomId) || null;
  const selectedRoomIsFull =
    selectedCreateRoom != null && Number(selectedCreateRoom.student_count || 0) >= MAX_RESIDENTS_PER_ROOM;

  const handleCreateResident = async () => {
    if (!createName.trim() || !createLastname.trim() || !createRoomId) {
      toast.error('Name, last name, and room are required');
      return;
    }
    if (selectedRoomIsFull) {
      toast.error(t.roomIsFull);
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API}/students/add/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createName.trim(),
          lastname: createLastname.trim(),
          roomId: createRoomId,
          studentUid: createUid.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          const msg = String(data.message || '');
          if (/full/i.test(msg) || data.error === 'Room is full') throw new Error(t.roomIsFull);
          throw new Error(msg || 'A resident with this ID already exists');
        }
        throw new Error(data.message || 'Failed to create resident');
      }
      toast.success('Resident created');
      setShowCreateModal(false);
      await queryClient.invalidateQueries({ queryKey: ['students-list'] });
      await queryClient.invalidateQueries({ queryKey: ['overview-rooms'] });
      await refetchStudents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create resident');
    } finally {
      setCreating(false);
    }
  };

  const {
    data: attendanceHistory = [],
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['student-attendance', selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return [];

      const res = await fetch(`${API}/students/${selectedStudent.id}/attendance`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch attendance history');
      return res.json() as Promise<AttendanceRecord[]>;
    },
    enabled: !!selectedStudent && !!accessToken,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;

    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.lastname || '').toLowerCase().includes(term) ||
        `${s.name} ${s.lastname || ''}`.toLowerCase().includes(term) ||
        (s.student_uid || '').toLowerCase().includes(term) ||
        String(s.room || '').toLowerCase().includes(term) ||
        String(s.building || '').toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const attendanceStats = useMemo(() => {
    if (!attendanceHistory.length) {
      return { present: 0, inRoom: 0, absent: 0, pending: 0, rate: 0 };
    }

    let present = 0;
    let inRoom = 0;
    let absent = 0;
    let pending = 0;
    for (const r of attendanceHistory) {
      const status = classifyRecord(r);
      if (status === 'present') present++;
      else if (status === 'in_room') inRoom++;
      else if (status === 'absent') absent++;
      else pending++;
    }
    const total = present + inRoom + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, inRoom, absent, pending, rate };
  }, [attendanceHistory]);

  const getStatusBadge = (record: AttendanceRecord) => {
    const status = classifyRecord(record);
    if (status === 'present') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
          <CheckCircle2 size={12} />
          {t.present}
        </span>
      );
    }
    if (status === 'in_room') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium">
          <Eye size={12} />
          {t.inRoom}
        </span>
      );
    }
    if (status === 'absent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
          <XCircle size={12} />
          {t.absent}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
        <Clock size={12} />
        {t.pending}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const key = toDateKey(dateStr);
    if (!key) return '—';
    return new Date(`${key}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '—';
    // MySQL DATETIME without timezone: treat as local wall clock
    const normalized = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T');
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return timestamp;
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openStudent = (student: StudentDetail) => setSelectedStudent(student);

  if (selectedStudent) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Toaster position="top-right" />

        <button
          type="button"
          onClick={() => setSelectedStudent(null)}
          className="flex items-center gap-2 text-oakwood-blue hover:text-oakwood-blue-dark mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Residents</span>
        </button>

        <div className="bg-white rounded-xl border-l-4 border-oakwood-gold shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-oakwood-blue-50 flex items-center justify-center shrink-0">
              <User size={32} className="text-oakwood-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-oakwood-blue">
                {[selectedStudent.name, selectedStudent.lastname].filter(Boolean).join(' ')}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">{t.studentId}:</span>
                  <span className="font-medium text-slate-700 font-mono">
                    {selectedStudent.student_uid || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={16} className="text-oakwood-gold" />
                  <span className="capitalize">
                    {selectedStudent.building} · Room {selectedStudent.room}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{attendanceStats.present}</p>
                <p className="text-xs text-slate-500">{t.present}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Eye size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{attendanceStats.inRoom}</p>
                <p className="text-xs text-slate-500">{t.inRoom}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{attendanceStats.absent}</p>
                <p className="text-xs text-slate-500">{t.absent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <Clock size={20} className="text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{attendanceStats.pending}</p>
                <p className="text-xs text-slate-500">{t.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-oakwood-blue-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-oakwood-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-oakwood-blue">{attendanceStats.rate}%</p>
                <p className="text-xs text-slate-500">Attendance Rate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Attendance History</h2>
            <p className="text-sm text-slate-500 mt-1">Check-in records for this resident</p>
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-oakwood-blue" />
            </div>
          ) : isHistoryError ? (
            <div className="p-10 text-center text-slate-400">
              <p className="mb-4">Could not load attendance history</p>
              <button type="button" onClick={() => refetchHistory()} className="btn-primary btn-md">
                Retry
              </button>
            </div>
          ) : attendanceHistory.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Calendar size={48} className="mx-auto mb-3 opacity-50" />
              <p>No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Checked By</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceHistory.map((record, idx) => (
                    <tr key={`${toDateKey(record.date)}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900">{formatDate(record.date)}</td>
                      <td className="px-6 py-4">{getStatusBadge(record)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{record.checked_by || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatTime(record.checked_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-oakwood-blue tracking-tight">Residents</h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Click a resident to view attendance history and stats
          </p>
        </div>
        {canCreateResidents && (
          <button type="button" onClick={openCreateModal} className="btn-primary btn-md w-full sm:w-auto">
            <UserPlus size={17} />
            Add Resident
          </button>
        )}
      </motion.div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, room, or building..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-oakwood-blue focus:border-transparent"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {isAdmin && (
            <select
              value={selectedBuildingId || ''}
              onChange={(e) => setSelectedBuildingId(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-oakwood-blue focus:border-transparent"
            >
              <option value="">All Buildings</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isLoadingStudents ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-oakwood-blue" />
        </div>
      ) : isStudentsError ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 text-center">
          <Users size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 mb-4">Could not load residents</p>
          <button type="button" onClick={() => refetchStudents()} className="btn-primary btn-md">
            Retry
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 text-center">
          <Users size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400">
            {searchTerm ? 'No residents found matching your search' : 'No residents found'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{t.studentId}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Building</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => openStudent(student)}
                    className="hover:bg-oakwood-blue-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-oakwood-blue-50 flex items-center justify-center shrink-0">
                          <User size={18} className="text-oakwood-blue" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {[student.name, student.lastname].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {student.student_uid || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.room}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">{student.building}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStudent(student);
                        }}
                        className="text-oakwood-blue hover:text-oakwood-blue-dark font-medium text-sm transition-colors"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoadingStudents && filteredStudents.length > 0 && (
        <p className="text-sm text-slate-500 mt-4 text-center">
          Showing {filteredStudents.length} of {students.length} residents
        </p>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-popover w-full max-w-lg p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add Resident</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create a resident and assign them to an existing room
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="input text-sm"
                  placeholder="Amy"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Last name</label>
                <input
                  type="text"
                  value={createLastname}
                  onChange={(e) => setCreateLastname(e.target.value)}
                  className="input text-sm"
                  placeholder="Buten"
                />
              </div>
            </div>

            <div>
              <label className="label">{t.studentId}</label>
              <input
                type="text"
                value={createUid}
                onChange={(e) => setCreateUid(e.target.value)}
                className="input text-sm"
                placeholder="Optional institutional ID"
              />
            </div>

            {isAdmin && (
              <div>
                <label className="label">{t.building}</label>
                <select
                  value={createBuildingId ?? ''}
                  onChange={(e) => setCreateBuildingId(e.target.value ? Number(e.target.value) : null)}
                  className="input text-sm"
                >
                  <option value="">Select building…</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name.charAt(0).toUpperCase() + b.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Room</label>
              <div className="relative">
                <DoorOpen
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <select
                  value={createRoomId ?? ''}
                  onChange={(e) => setCreateRoomId(e.target.value ? Number(e.target.value) : null)}
                  disabled={!createBuildingId || isLoadingRooms}
                  className="input text-sm pl-9 appearance-none"
                >
                  <option value="">
                    {!createBuildingId
                      ? 'Select a building first…'
                      : isLoadingRooms
                        ? 'Loading rooms…'
                        : assignableRooms.length === 0
                          ? 'No rooms in this building'
                          : 'Select room…'}
                  </option>
                  {assignableRooms.map((room) => {
                    const count = Number(room.student_count || 0);
                    const full = count >= MAX_RESIDENTS_PER_ROOM;
                    return (
                      <option key={room.id} value={room.id} disabled={full}>
                        {roomOptionLabel(room)} · {count}/{MAX_RESIDENTS_PER_ROOM}
                        {full ? ' — full' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              {selectedRoomIsFull && (
                <p className="text-sm text-amber-600 mt-1.5">{t.roomIsFull}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateResident}
                disabled={
                  creating ||
                  !createName.trim() ||
                  !createLastname.trim() ||
                  !createRoomId ||
                  selectedRoomIsFull
                }
                className="btn-primary btn-md"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {creating ? 'Creating…' : 'Create Resident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;

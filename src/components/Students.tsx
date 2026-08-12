import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, Search, X, Calendar, MapPin, User, 
  CheckCircle2, XCircle, Clock, ArrowLeft, Loader2,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { useStore } from '../store/useStore';
import toast, { Toaster } from 'react-hot-toast';

interface StudentDetail {
  id: string;
  name: string;
  room: string;
  building: string;
  suite_number: number;
  room_letter: string;
}

interface AttendanceRecord {
  date: string;
  is_present: boolean | null;
  in_room: boolean | null;
  checked_by: string | null;
  checked_at: string | null;
}

const API = import.meta.env.VITE_API_URL;

function Students() {
  const { currentUser, accessToken, buildings, fetchBuildings, getTranslation } = useStore();
  const t = getTranslation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const buildingId = isAdmin ? selectedBuildingId : currentUser?.building_id;

  useEffect(() => {
    if (isAdmin && buildings.length === 0) {
      fetchBuildings();
    }
  }, [isAdmin]);

  // Fetch students list
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students-list', buildingId],
    queryFn: async () => {
      const url = buildingId 
        ? `${API}/students?building_id=${buildingId}`
        : `${API}/students`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch students');
      return res.json() as Promise<StudentDetail[]>;
    },
    enabled: !!accessToken && (isAdmin ? buildingId !== null : true)
  });

  // Fetch attendance history for selected student
  const { data: attendanceHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['student-attendance', selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return [];
      
      const res = await fetch(`${API}/students/${selectedStudent.id}/attendance`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch attendance history');
      return res.json() as Promise<AttendanceRecord[]>;
    },
    enabled: !!selectedStudent && !!accessToken
  });

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    
    const term = searchTerm.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.room.toLowerCase().includes(term) ||
      s.building.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Calculate attendance stats
  const attendanceStats = useMemo(() => {
    if (!attendanceHistory.length) return { present: 0, absent: 0, pending: 0, rate: 0 };
    
    const present = attendanceHistory.filter(r => r.is_present === true).length;
    const absent = attendanceHistory.filter(r => r.is_present === false).length;
    const pending = attendanceHistory.filter(r => r.is_present === null).length;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { present, absent, pending, rate };
  }, [attendanceHistory]);

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.is_present === true) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
          <CheckCircle2 size={12} />
          Present
        </span>
      );
    } else if (record.is_present === false) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
          <XCircle size={12} />
          Absent
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <Clock size={12} />
          Pending
        </span>
      );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedStudent) {
    return (
      <div>
        <Toaster position="top-right" />
        
        {/* Back button */}
        <button
          onClick={() => setSelectedStudent(null)}
          className="flex items-center gap-2 text-oakwood-blue hover:text-oakwood-blue-dark mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Students</span>
        </button>

        {/* Student Header */}
        <div className="bg-white rounded-xl border-l-4 border-oakwood-gold shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-oakwood-blue-50 flex items-center justify-center shrink-0">
              <User size={32} className="text-oakwood-blue" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-oakwood-blue">{selectedStudent.name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <MapPin size={16} className="text-oakwood-gold" />
                  <span>{selectedStudent.building} - Room {selectedStudent.room}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{attendanceStats.present}</p>
                <p className="text-xs text-slate-500">Present Days</p>
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
                <p className="text-xs text-slate-500">Absent Days</p>
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
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
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

        {/* Attendance History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Attendance History</h2>
            <p className="text-sm text-slate-500 mt-1">Complete check-in record for this student</p>
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-oakwood-blue" />
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
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
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
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-oakwood-blue tracking-tight">Students</h1>
        <p className="text-slate-600 text-sm sm:text-base mt-1">View all students and their attendance history</p>
      </motion.div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, room, or building..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-oakwood-blue focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Building filter for admins */}
          {isAdmin && (
            <select
              value={selectedBuildingId || ''}
              onChange={(e) => setSelectedBuildingId(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-oakwood-blue focus:border-transparent"
            >
              <option value="">All Buildings</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Students List */}
      {isLoadingStudents ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-oakwood-blue" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 text-center">
          <Users size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400">
            {searchTerm ? 'No students found matching your search' : 'No students found'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Building</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-oakwood-blue-50 flex items-center justify-center shrink-0">
                          <User size={18} className="text-oakwood-blue" />
                        </div>
                        <span className="font-medium text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.room}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">{student.building}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
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

      {/* Results count */}
      {!isLoadingStudents && filteredStudents.length > 0 && (
        <p className="text-sm text-slate-500 mt-4 text-center">
          Showing {filteredStudents.length} of {students.length} students
        </p>
      )}
    </div>
  );
}

export default Students;

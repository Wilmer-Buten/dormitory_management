import { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Loader2, AlertTriangle, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';

const API = import.meta.env.VITE_API_URL;

interface Semester {
  id: number;
  year: number;
  term: 'spring' | 'fall';
  start_date: string;
  end_date: string;
}

interface ActiveSemester extends Semester {
  set_at: string;
  set_by_name: string;
}

function authHeader(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function SemesterSelector() {
  const { accessToken, currentUser } = useStore();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemester, setActiveSemester] = useState<ActiveSemester | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const buildingId = currentUser?.building_id;
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!buildingId) return;
    fetchData();
  }, [buildingId, accessToken]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { headers: authHeader(accessToken) };
      const [semestersRes, activeRes] = await Promise.all([
        fetch(`${API}/semesters`, headers),
        fetch(`${API}/buildings/${buildingId}/semester`, headers),
      ]);
      
      if (semestersRes.ok) setSemesters(await semestersRes.json());
      if (activeRes.ok) setActiveSemester(await activeRes.json());
    } catch {
      toast.error('Error loading semester data');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeSemester = async (semesterId: number) => {
    try {
      const res = await fetch(`${API}/buildings/${buildingId}/semester`, {
        method: 'PUT',
        headers: authHeader(accessToken),
        body: JSON.stringify({ semester_id: semesterId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to change semester');
      }

      await fetchData();
      setDropdownOpen(false);
      toast.success('Semester changed successfully');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Error changing semester');
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const res = await fetch(`${API}/buildings/${buildingId}/archive`, {
        method: 'POST',
        headers: authHeader(accessToken),
      });
      
      if (!res.ok) throw new Error('Failed to archive');
      
      toast.success('Current semester data archived');
      setArchiveModalOpen(false);
      await fetchData();
    } catch {
      toast.error('Error archiving semester data');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
        <Loader2 size={14} className="animate-spin text-gray-400" />
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!activeSemester) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle size={14} className="text-yellow-600" />
        <span className="text-xs text-yellow-700">No active semester</span>
      </div>
    );
  }

  const termLabel = activeSemester.term === 'spring' ? 'Spring' : 'Fall';
  const currentLabel = `${termLabel} ${activeSemester.year}`;

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Calendar size={14} className="text-blue-600" />
        <span className="text-xs font-medium text-blue-700">{currentLabel}</span>
        <ChevronDown size={12} className="text-blue-600" />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Select Semester</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {semesters.map(sem => {
                const label = `${sem.term === 'spring' ? 'Spring' : 'Fall'} ${sem.year}`;
                const isCurrent = sem.id === activeSemester.id;
                return (
                  <button
                    key={sem.id}
                    onClick={() => !isCurrent && handleChangeSemester(sem.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isCurrent
                        ? 'bg-blue-50 text-blue-700 font-medium cursor-default'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {label} {isCurrent && <span className="text-xs text-blue-500">(current)</span>}
                  </button>
                );
              })}
            </div>
            {isAdmin && (
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={() => { setDropdownOpen(false); setArchiveModalOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
                >
                  <Archive size={12} />
                  Archive Current Semester
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {archiveModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Archive size={20} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Archive Semester</h2>
                <p className="text-sm text-gray-500 mt-1">
                  This will mark all current students as inactive and archive attendance records for <strong>{currentLabel}</strong>.
                  You can then switch to a new semester and import new students.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setArchiveModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="flex-1 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {archiving && <Loader2 size={14} className="animate-spin" />}
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

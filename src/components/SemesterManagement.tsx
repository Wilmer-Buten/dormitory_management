import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Loader2, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { ignoreSemesterChange } from '../utils/semesterGuard';

const API = import.meta.env.VITE_API_URL;

interface Semester {
  id: number;
  year: number;
  term: 'spring' | 'fall';
  start_date: string;
  end_date: string;
  created_at: string;
}

interface ActiveSemester extends Semester {
  set_at: string;
  set_by_name: string;
}

function authHeader(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function SemesterManagement({ 
  showInlineButton = false,
  onAddClick 
}: { 
  showInlineButton?: boolean;
  onAddClick?: (callback: () => void) => void;
}) {
  const { accessToken } = useStore();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemester, setActiveSemester] = useState<ActiveSemester | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [saving, setSaving] = useState(false);

  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newTerm, setNewTerm] = useState<'spring' | 'fall'>('spring');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  useEffect(() => { fetchData(); }, []);
  
  const handleAddClick = useCallback(() => {
    setAddModalOpen(true);
  }, []);
  
  useEffect(() => {
    if (showInlineButton && onAddClick) {
      onAddClick(handleAddClick);
    }
  }, [showInlineButton, onAddClick, handleAddClick]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { headers: authHeader(accessToken) };
      const [semestersRes, activeRes] = await Promise.all([
        fetch(`${API}/semesters`, headers),
        fetch(`${API}/semester/active`, headers),
      ]);
      if (semestersRes.ok) setSemesters(await semestersRes.json());
      if (activeRes.ok) setActiveSemester(await activeRes.json());
    } catch {
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newStartDate || !newEndDate) {
      toast.error('Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/semesters`, {
        method: 'POST',
        headers: authHeader(accessToken),
        body: JSON.stringify({ year: newYear, term: newTerm, start_date: newStartDate, end_date: newEndDate }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create');
      }
      const created = await res.json();
      setSemesters(prev => [created, ...prev]);
      setAddModalOpen(false);
      resetForm();
      toast.success(`${newTerm === 'spring' ? 'Spring' : 'Fall'} ${newYear} created`);
      
      if (semesters.length === 0) {
        await handleSwitch(created.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating semester');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitch = async (semesterId: number) => {
    setSaving(true);
    try {
      // Prevent modal from showing to admin who just changed semester
      ignoreSemesterChange();
      
      const res = await fetch(`${API}/semester/active`, {
        method: 'PUT',
        headers: authHeader(accessToken),
        body: JSON.stringify({ semester_id: semesterId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Semester changed! Previous data archived.');
      await fetchData();
      setSwitchModalOpen(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error('Error changing semester');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewYear(new Date().getFullYear());
    setNewTerm('spring');
    setNewStartDate('');
    setNewEndDate('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-oakwood-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!showInlineButton && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Semesters</h2>
            <p className="text-sm text-slate-500 mt-1">Manage academic semesters</p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary btn-md text-sm"
          >
            <Plus size={16} /> Add Semester
          </button>
        </div>
      )}

      {/* Active Semester Card */}
      {activeSemester && (
        <div className="bg-oakwood-blue-50 border-2 border-oakwood-gold rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-oakwood-blue uppercase tracking-wide mb-1">Current Semester</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {activeSemester.term === 'spring' ? 'Spring' : 'Fall'} {activeSemester.year}
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                {new Date(activeSemester.start_date).toLocaleDateString()} – {new Date(activeSemester.end_date).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Set by {activeSemester.set_by_name} on {new Date(activeSemester.set_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <Calendar size={12} /> Active
            </div>
          </div>
        </div>
      )}

      {/* All Semesters List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">All Semesters</h3>
        </div>
        {semesters.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
            <p>No semesters yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {semesters.map(sem => {
              const label = `${sem.term === 'spring' ? 'Spring' : 'Fall'} ${sem.year}`;
              const termColor = sem.term === 'spring' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200';
              const isActive = activeSemester?.id === sem.id;
              return (
                <div key={sem.id} className={`flex items-center gap-3 p-4 bg-white border rounded-lg ${isActive ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}`}>
                  <Calendar size={18} className={isActive ? 'text-blue-500' : 'text-gray-400'} />
                  <div className="flex-1">
                    <p className={`font-semibold ${isActive ? 'text-blue-900' : 'text-gray-800'}`}>{label}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(sem.start_date).toLocaleDateString()} – {new Date(sem.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${termColor}`}>
                    {sem.term === 'spring' ? 'Spring' : 'Fall'}
                  </span>
                  {!isActive && (
                    <button
                      onClick={() => { setSelectedSemester(sem); setSwitchModalOpen(true); }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Switch to this
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Switch Semester Modal */}
      {switchModalOpen && selectedSemester && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Archive size={20} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Start New Semester?</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Switching to <strong>{selectedSemester.term === 'spring' ? 'Spring' : 'Fall'} {selectedSemester.year}</strong> will:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>Archive all current students (mark as inactive)</li>
                  <li>Save all attendance records with current semester</li>
                  <li>Clear the dashboard for new data</li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  You'll need to import new students after switching.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setSwitchModalOpen(false); setSelectedSemester(null); }}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSwitch(selectedSemester.id)}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Start Semester
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">New Semester</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Year</label>
                <input
                  type="number"
                  value={newYear}
                  onChange={e => setNewYear(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Term</label>
                <select
                  value={newTerm}
                  onChange={e => setNewTerm(e.target.value as 'spring' | 'fall')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="spring">Spring</option>
                  <option value="fall">Fall</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Start Date</label>
              <input
                type="date"
                value={newStartDate}
                onChange={e => setNewStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">End Date</label>
              <input
                type="date"
                value={newEndDate}
                onChange={e => setNewEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setAddModalOpen(false); resetForm(); }}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newStartDate || !newEndDate}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Create Semester
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

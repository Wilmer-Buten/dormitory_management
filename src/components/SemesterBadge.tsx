import { useState, useEffect } from 'react';
import { Calendar, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';

const API = import.meta.env.VITE_API_URL;

interface ActiveSemester {
  id: number;
  year: number;
  term: 'spring' | 'fall';
  start_date: string;
  end_date: string;
  set_at: string;
  set_by_name: string;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export default function SemesterBadge() {
  const { accessToken } = useStore();
  const [activeSemester, setActiveSemester] = useState<ActiveSemester | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSemester();
  }, [accessToken]);

  const fetchActiveSemester = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/semester/active`, { headers: authHeader(accessToken) });
      if (res.ok) setActiveSemester(await res.json());
    } catch {
      toast.error('Error loading semester');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
        <Loader2 size={14} className="animate-spin text-slate-400" />
        <span className="text-xs text-slate-500">Loading...</span>
      </div>
    );
  }

  if (!activeSemester) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle size={14} className="text-yellow-600" />
        <span className="text-xs text-yellow-700">No semester</span>
      </div>
    );
  }

  const termLabel = activeSemester.term === 'spring' ? 'Spring' : 'Fall';
  const termColor = activeSemester.term === 'spring' 
    ? 'bg-oakwood-blue-50 text-oakwood-blue border-oakwood-blue-200' 
    : 'bg-oakwood-gold-50 text-oakwood-gold-dark border-oakwood-gold-300';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border-2 rounded-lg shadow-sm ${termColor}`}>
      <Calendar size={14} />
      <span className="text-xs font-semibold tracking-wide">{termLabel} {activeSemester.year}</span>
    </div>
  );
}

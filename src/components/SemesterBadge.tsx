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
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-lg">
        <Loader2 size={14} className="animate-spin text-white/80" />
        <span className="text-xs text-white/80">Loading...</span>
      </div>
    );
  }

  if (!activeSemester) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-oakwood-gold/20 border border-oakwood-gold/40 rounded-lg">
        <AlertTriangle size={14} className="text-oakwood-gold" />
        <span className="text-xs text-oakwood-gold-light">No semester</span>
      </div>
    );
  }

  const termLabel = activeSemester.term === 'spring' ? 'Spring' : 'Fall';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border border-oakwood-gold/50 rounded-lg shadow-sm bg-oakwood-gold text-oakwood-blue-dark">
      <Calendar size={14} />
      <span className="text-xs font-semibold tracking-wide">{termLabel} {activeSemester.year}</span>
    </div>
  );
}

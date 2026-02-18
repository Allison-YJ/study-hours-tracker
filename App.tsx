import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  BookOpen, LayoutDashboard, LogOut, PlusCircle, 
  CheckCircle2, AlertCircle
} from 'lucide-react';

// --- CONFIGURATION ---
// Automatically use real backend if on localhost (Docker), otherwise use Mock (AI Studio)
const MOCK_ENABLED = window.location.hostname !== 'localhost'; 

const API = {
  AUTH: 'http://localhost:8082',
  ENTRY: 'http://localhost:8080',
  RESULTS: 'http://localhost:8081'
};
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// --- MOCK SERVICE LOGIC (For Demo Environments) ---
const getMockData = () => {
  const sessions = JSON.parse(localStorage.getItem('mock_sessions') || '[]');
  if (sessions.length === 0) return null;

  const totalMinutes = sessions.reduce((sum: number, s: any) => sum + s.duration_minutes, 0);
  const subjects: any = {};
  const dates = new Set();
  let maxSession = 0;

  sessions.forEach((s: any) => {
    subjects[s.subject] = (subjects[s.subject] || 0) + s.duration_minutes;
    dates.add(s.study_date);
    if (s.duration_minutes > maxSession) maxSession = s.duration_minutes;
  });

  return {
    username: 'demo_user',
    metrics: {
      total_minutes: totalMinutes,
      avg_minutes_per_day: totalMinutes / (dates.size || 1),
      max_session: maxSession,
      session_count: sessions.length
    },
    subject_breakdown: Object.keys(subjects).map(k => ({ subject: k, minutes: subjects[k] }))
  };
};

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'entry' | 'dashboard'>('login');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(60);
  const [subject, setSubject] = useState('');
  const [note, setNote] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dashboard Data
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (token) {
      if (view === 'login') setView('entry');
      if (view === 'dashboard') fetchAnalytics();
    }
  }, [token, view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (MOCK_ENABLED) {
      setTimeout(() => {
        localStorage.setItem('token', 'mock_token_123');
        setToken('mock_token_123');
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch(`${API.AUTH}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
      } else {
        setError(data.detail || 'Invalid credentials');
      }
    } catch (err) {
      setError('Backend connection failed. Is Docker running?');
    } finally {
      setLoading(false);
    }
  };

  const submitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setError('');

    if (MOCK_ENABLED) {
      const sessions = JSON.parse(localStorage.getItem('mock_sessions') || '[]');
      sessions.push({ study_date: studyDate, duration_minutes: duration, subject, note });
      localStorage.setItem('mock_sessions', JSON.stringify(sessions));
      setTimeout(() => {
        setSuccessMsg('Session recorded (Mock Mode)!');
        setSubject('');
        setNote('');
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(`${API.ENTRY}/sessions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ study_date: studyDate, duration_minutes: duration, subject, note })
      });
      if (res.ok) {
        setSuccessMsg('Session recorded successfully!');
        setSubject('');
        setNote('');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to save session.');
      }
    } catch (err) {
      setError('Error connecting to data service.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    if (MOCK_ENABLED) {
      setAnalytics(getMockData());
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API.RESULTS}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAnalytics(await res.json());
    } catch (err) {
      console.error('Analytics fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setView('login');
  };

  if (view === 'login') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-blue-600 p-8 text-white text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Study Tracker</h1>
            <p className="text-blue-100 mt-2">Microservices System</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 ring-blue-500/20 transition" value={username} onChange={e => setUsername(e.target.value)} placeholder="demo" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input type="password" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 ring-blue-500/20 transition" value={password} onChange={e => setPassword(e.target.value)} placeholder="demo1234" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
              {loading ? 'Connecting...' : 'Sign In'}
            </button>
            <div className="text-center space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Environment</p>
              <p className="text-xs text-blue-600 font-medium">{MOCK_ENABLED ? 'AI Studio Mode (Demo)' : 'Local Docker Mode'}</p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <nav className="w-full md:w-64 bg-white border-r border-gray-200 p-6 space-y-8 flex-shrink-0">
        <div className="flex items-center gap-3 text-blue-600 font-bold text-xl"><BookOpen /><span>Tracker</span></div>
        <div className="space-y-2">
          <button onClick={() => setView('entry')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${view === 'entry' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}><PlusCircle className="w-5 h-5" />Enter Data</button>
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${view === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}><LayoutDashboard className="w-5 h-5" />Show Results</button>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-red-600 mt-auto pt-8 border-t"><LogOut className="w-5 h-5" />Sign Out</button>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {view === 'entry' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <header><h1 className="text-2xl font-bold text-gray-900">Log New Session</h1><p className="text-gray-500">Add your latest study progress to the system.</p></header>
              <form onSubmit={submitSession} className="bg-white p-8 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
                {successMsg && <div className="col-span-full bg-green-50 text-green-600 p-4 rounded-xl flex items-center gap-3"><CheckCircle2 className="w-5 h-5" />{successMsg}</div>}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Date of Study</label>
                  <input type="date" required className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition" value={studyDate} onChange={e => setStudyDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Duration (Minutes)</label>
                  <input type="number" min="1" required className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition" value={duration} onChange={e => setDuration(parseInt(e.target.value))} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Subject / Topic</label>
                  <input type="text" required placeholder="e.g. Mathematics, React Hooks, etc." className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition" value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Notes (Optional)</label>
                  <textarea className="w-full p-3 border rounded-xl h-32 outline-none focus:border-blue-500 transition resize-none" placeholder="What did you learn today?" value={note} onChange={e => setNote(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition w-fit shadow-lg shadow-blue-500/20 disabled:opacity-50">
                  {loading ? 'Processing...' : 'Save Session'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <header className="flex justify-between items-center">
                <div><h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1><p className="text-gray-500">Pre-computed metrics from MongoDB (Python Engine)</p></div>
                <button onClick={fetchAnalytics} className="bg-white border border-gray-200 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition shadow-sm">Refresh Results</button>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Minutes', value: analytics?.metrics.total_minutes || 0, color: 'text-blue-600' },
                  { label: 'Daily Average', value: analytics?.metrics.avg_minutes_per_day?.toFixed(1) || 0, color: 'text-emerald-600' },
                  { label: 'Longest Session', value: (analytics?.metrics.max_session || 0) + 'm', color: 'text-amber-600' },
                  { label: 'Total Sessions', value: analytics?.metrics.session_count || 0, color: 'text-purple-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm h-96 flex flex-col">
                  <h3 className="font-bold text-gray-800 mb-6 text-sm uppercase tracking-widest">Subject Distribution</h3>
                  {analytics?.subject_breakdown.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.subject_breakdown} dataKey="minutes" nameKey="subject" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8}>
                          {analytics.subject_breakdown.map((_:any, i:number) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-2">
                      <LayoutDashboard className="w-10 h-10 opacity-20" />
                      <p className="text-sm">No session data found.</p>
                    </div>
                  )}
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm h-96 flex flex-col">
                  <h3 className="font-bold text-gray-800 mb-6 text-sm uppercase tracking-widest">Minutes per Subject</h3>
                  {analytics?.subject_breakdown.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.subject_breakdown}>
                        <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="minutes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-2">
                      <LayoutDashboard className="w-10 h-10 opacity-20" />
                      <p className="text-sm">Record sessions to see charts.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
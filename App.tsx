import React, { useState, useEffect } from 'react';

// --- CONFIGURATION ---
const MOCK_ENABLED = window.location.hostname !== 'localhost'; 

const API = {
  AUTH: 'http://localhost:8082',
  ENTRY: 'http://localhost:8080',
  RESULTS: 'http://localhost:8081'
};

// --- MOCK SERVICE LOGIC ---
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
    subject_breakdown: Object.keys(subjects).map(k => ({ subject: k, minutes: subjects[k] })),
    last_updated: new Date().toISOString()
  };
};

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'entry' | 'dashboard'>('login');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(60);
  const [subject, setSubject] = useState('');
  const [note, setNote] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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
      }, 500);
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
      setError('Connection failed. Ensure backend services are running.');
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
      setSuccessMsg('Session recorded successfully (Demo).');
      setSubject('');
      setNote('');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API.ENTRY}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ study_date: studyDate, duration_minutes: duration, subject, note })
      });
      if (res.ok) {
        setSuccessMsg('Session recorded successfully!');
        setSubject('');
        setNote('');
      } else {
        setError('Failed to save session.');
      }
    } catch (err) {
      setError('Network error.');
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
      console.error('Fetch error', err);
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
      <div className="container">
        <h1>Study Hours Tracker</h1>
        <hr />
        <h3>Login</h3>
        <form onSubmit={handleLogin}>
          {error && <p className="error">{error}</p>}
          <div>
            <label>Username:</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Login'}</button>
          <p style={{fontSize: '12px'}}>Mode: {MOCK_ENABLED ? 'Demo' : 'Docker'}</p>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-bar">
        <h1>Study Tracker</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
      
      <nav>
        <button className={view === 'entry' ? 'active' : ''} onClick={() => setView('entry')}>Log Hours</button>
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>View Results</button>
      </nav>

      {view === 'entry' ? (
        <div>
          <h2>Log Study Session</h2>
          <form onSubmit={submitSession}>
            {successMsg && <p className="success">{successMsg}</p>}
            {error && <p className="error">{error}</p>}
            <div>
              <label>Date:</label>
              <input type="date" required value={studyDate} onChange={e => setStudyDate(e.target.value)} />
            </div>
            <div>
              <label>Minutes:</label>
              <input type="number" required value={duration} onChange={e => setDuration(parseInt(e.target.value))} />
            </div>
            <div>
              <label>Subject:</label>
              <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} placeholder="Math, Science, etc." />
            </div>
            <div>
              <label>Notes:</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional notes" />
            </div>
            <button type="submit" disabled={loading}>Submit Record</button>
          </form>
        </div>
      ) : (
        <div>
          <div className="header-bar">
            <h2>Analytics Results</h2>
            <button onClick={fetchAnalytics}>Refresh</button>
          </div>

          <div className="timestamp">
            Last Updated: {analytics?.last_updated ? new Date(analytics.last_updated).toLocaleString() : "(not available)"}
          </div>

          <div className="card">
            <strong>Overall Statistics</strong>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Minutes</td>
                  <td>{analytics?.metrics.total_minutes || 0}</td>
                </tr>
                <tr>
                  <td>Daily Average</td>
                  <td>{analytics?.metrics.avg_minutes_per_day?.toFixed(2) || 0} min</td>
                </tr>
                <tr>
                  <td>Longest Session</td>
                  <td>{analytics?.metrics.max_session || 0} min</td>
                </tr>
                <tr>
                  <td>Total Sessions</td>
                  <td>{analytics?.metrics.session_count || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Breakdown by Subject</h3>
          {analytics?.subject_breakdown && analytics.subject_breakdown.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Total Minutes</th>
                </tr>
              </thead>
              <tbody>
                {analytics.subject_breakdown.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>{item.subject}</td>
                    <td>{item.minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No data recorded yet. Please log some hours.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
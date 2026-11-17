'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { formatCountdown, nextUtcReset, utcDay } from '@/lib/daily';

type Entry = {
  id: string;
  challenge_date: string;
  attempt_number: number;
  player_attempt_number: number | null;
  player_name: string;
  total_distance: number;
  created_at: string;
};

type BoardResponse = {
  configured: boolean;
  day: string;
  nextReset: string;
  attempts: number;
  entries: Entry[];
  message?: string;
};

type Run = {
  guesses: Array<number | null>;
  day: string;
  total: number;
};

const initialBoard: BoardResponse = { configured: false, day: utcDay(), nextReset: nextUtcReset(), attempts: 0, entries: [] };

export default function DailyLeaderboard({ location }: { location: 'final' | 'board' | 'clock' }) {
  if (location === 'clock') return <ResetClock />;
  if (location === 'final') return <FinalSubmission />;
  return <LeaderboardTable />;
}

function ResetClock() {
  const [remaining, setRemaining] = useState('24:00:00');
  useEffect(() => {
    const tick = () => setRemaining(formatCountdown(new Date(nextUtcReset()).getTime() - Date.now()));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);
  return <div className="resetClock"><span>DAILY RESET • 00:00 UTC</span><strong aria-live="off">{remaining}</strong></div>;
}

function FinalSubmission() {
  const [run, setRun] = useState<Run | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState<Entry | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  function browserId(): string {
    const key = 'frostflight-browser-id-v1';
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = window.crypto.randomUUID();
      window.localStorage.setItem(key, id);
    }
    return id;
  }

  useEffect(() => {
    const finished = (event: Event) => {
      const detail = (event as CustomEvent<Run>).detail;
      setRun(detail);
      setConfirmed(null);
      setError('');
    };
    const restart = () => { setRun(null); setConfirmed(null); setError(''); };
    window.addEventListener('ssx:finished', finished);
    window.addEventListener('ssx:restart', restart);
    fetch('/api/leaderboard', { cache: 'no-store' }).then(response => response.json()).then((data: BoardResponse) => setConnected(data.configured)).catch(() => setConnected(false));
    return () => { window.removeEventListener('ssx:finished', finished); window.removeEventListener('ssx:restart', restart); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!run || saving || confirmed) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, guesses: run.guesses, day: run.day, deviceId: browserId() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save score.');
      setConfirmed(data.entry as Entry);
      window.dispatchEvent(new Event('ssx:leaderboard-updated'));
    } catch (caught) { setError((caught as Error).message); }
    finally { setSaving(false); }
  }

  if (!run) return null;
  return <div className="submitPanel">
    {confirmed ? <div className="saveConfirmed" role="status">
      <strong>YOU'RE ON THE BOARD!</strong>
      <span>Your attempt #{confirmed.player_attempt_number ?? '?'} today • Global entry #{confirmed.attempt_number} • {confirmed.player_name} • {confirmed.total_distance}m</span>
      <span>Check the global leaderboard below the game.</span>
    </div> : <>
      <label className="submitLabel" htmlFor="player-name">ADD YOUR NAME TO TODAY'S LEADERBOARD</label>
      <form className="submitForm" onSubmit={submit}>
        <input id="player-name" className="nameField" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={24} placeholder="Your name / nickname" required autoComplete="nickname" />
        <button type="submit" disabled={saving || connected === false} className="btn">{saving ? 'SAVING...' : 'SAVE SCORE →'}</button>
      </form>
      {connected === false && <p className="saveNote">Global leaderboard isn't connected yet. Follow the Supabase setup instructions in README.md.</p>}
      {error && <p className="saveError" role="alert">{error}</p>}
    </>}
  </div>;
}

function LeaderboardTable() {
  const [board, setBoard] = useState<BoardResponse>(initialBoard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dayRef = useRef(utcDay());

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard', { cache: 'no-store' });
      const data = (await response.json()) as BoardResponse;
      if (!response.ok) throw new Error(data.message || 'Leaderboard temporarily unavailable.');
      setBoard(data);
      setError('');
    } catch (caught) { setError((caught as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
    const updated = () => void refresh();
    window.addEventListener('ssx:leaderboard-updated', updated);
    const interval = window.setInterval(() => {
      const today = utcDay();
      if (today !== dayRef.current) {
        dayRef.current = today;
        void refresh();
      }
    }, 1000);
    const periodic = window.setInterval(() => void refresh(), 30000);
    return () => {
      window.removeEventListener('ssx:leaderboard-updated', updated);
      window.clearInterval(interval);
      window.clearInterval(periodic);
    };
  }, [refresh]);

  return <section className="leaderboardSection" aria-label="Daily global leaderboard">
    <header className="boardHeader">
      <div><div className="boardKicker">SSX EXETER • DAILY CHALLENGE</div><h2>GLOBAL LEADERBOARD</h2><div className="boardDate">{board.day} (UTC) · Top 50 attempts</div></div>
      <div className="boardStats"><strong>{board.attempts}</strong><span>ATTEMPTS TODAY</span><button type="button" onClick={() => void refresh()} aria-label="Refresh leaderboard">↻ REFRESH</button></div>
    </header>
    {loading ? <p className="boardMessage">Loading leaderboard...</p> : error ? <p className="boardMessage" role="alert">{error}</p> : !board.configured ? <p className="boardMessage">The global leaderboard is not connected yet. Add the server-side Supabase environment variables and run the SQL setup to activate saved scores and attempt numbers.</p> : board.entries.length === 0 ? <p className="boardMessage">No attempts yet today. Be the first to complete all seven jumps!</p> : <div className="boardScroll"><table className="boardTable"><thead><tr><th>RANK</th><th>NAME</th><th>PLAYER ATTEMPT</th><th>GLOBAL ENTRY</th><th>TOTAL DISTANCE</th></tr></thead><tbody>
      {board.entries.map((entry, index) => <tr key={entry.id}><td>{String(index + 1).padStart(2, '0')}</td><td>{entry.player_name}</td><td>{entry.player_attempt_number === null ? '—' : `#${entry.player_attempt_number}`}</td><td>#{entry.attempt_number}</td><td className="boardDistance">{entry.total_distance.toLocaleString('en-GB')}m</td></tr>)}
    </tbody></table></div>}
    <p className="boardFootnote">The board resets at 00:00 UTC. Global entry numbers count every submission; your personal attempt number counts submissions from this browser today. Clearing browser storage or using another browser/device starts a separate count.</p>
  </section>;
}

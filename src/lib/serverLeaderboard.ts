export type LeaderboardEntry = {
  id: string;
  challenge_date: string;
  attempt_number: number;
  player_name: string;
  total_distance: number;
  created_at: string;
};

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

async function requestSupabase(path: string, init: RequestInit = {}) {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) throw new Error('Global leaderboard has not been configured. Add Supabase credentials to your server environment.');
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    const details = await response.text();
    console.error('Supabase leaderboard request failed:', response.status, details.slice(0, 500));
    throw new Error('Unable to load the global leaderboard. Verify the Supabase SQL migration and server credentials.');
  }
  return response;
}

export async function getLeaderboard(day: string) {
  const params = new URLSearchParams({
    select: 'id,challenge_date,attempt_number,player_name,total_distance,created_at',
    challenge_date: `eq.${day}`,
    order: 'total_distance.desc,created_at.asc',
    limit: '50',
  });
  const [top, count] = await Promise.all([
    requestSupabase(`daily_attempts?${params}`),
    requestSupabase(`daily_attempts?select=id&challenge_date=eq.${encodeURIComponent(day)}`, {
      method: 'HEAD',
      headers: { Prefer: 'count=exact' },
    }),
  ]);
  const range = count.headers.get('content-range');
  return {
    entries: (await top.json()) as LeaderboardEntry[],
    attempts: Number(range?.split('/')[1] ?? 0),
  };
}

export async function saveAttempt(day: string, name: string, guesses: Array<number | null>, total: number) {
  const response = await requestSupabase('rpc/submit_daily_attempt', {
    method: 'POST',
    body: JSON.stringify({
      p_day: day,
      p_name: name,
      p_guesses: guesses,
      p_total: total,
    }),
  });
  const result = (await response.json()) as Array<LeaderboardEntry> | LeaderboardEntry;
  return Array.isArray(result) ? result[0] : result;
}

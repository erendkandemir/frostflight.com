import { NextResponse } from 'next/server';
import { nextUtcReset, utcDay } from '@/lib/daily';
import { getLeaderboard, isDatabaseConfigured } from '@/lib/serverLeaderboard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();
  const day = utcDay(now);
  const nextReset = nextUtcReset(now);
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false, day, nextReset, attempts: 0, entries: [], message: 'Global leaderboard not connected. Set up Supabase to save scores across devices.' });
  }
  try {
    const data = await getLeaderboard(day);
    return NextResponse.json({ configured: true, day, nextReset, ...data });
  } catch (error) {
    return NextResponse.json({ configured: true, day, nextReset, attempts: 0, entries: [], message: (error as Error).message }, { status: 503 });
  }
}

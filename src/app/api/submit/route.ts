import { NextResponse } from 'next/server';
import { utcDay } from '@/lib/daily';
import { evaluateGuess, numericQuestions } from '@/lib/numericScoring';
import { isDatabaseConfigured, saveAttempt } from '@/lib/serverLeaderboard';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Global scores are not enabled yet. Set Supabase credentials on your server.' }, { status: 503 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });
  const data = body as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim().replace(/\s+/g, ' ') : '';
  const guesses = data.guesses;
  const deviceId = typeof data.deviceId === 'string' ? data.deviceId : '';
  const day = utcDay();
  if (name.length < 2 || name.length > 24 || /[<>\r\n]/.test(name)) {
    return NextResponse.json({ error: 'Enter a name between 2 and 24 characters.' }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deviceId)) {
    return NextResponse.json({ error: 'Your browser identifier is missing. Refresh the page and try again.' }, { status: 400 });
  }
  if (data.day !== day) {
    return NextResponse.json({ error: 'The daily leaderboard has reset. Play a fresh round to submit to today\'s board.' }, { status: 409 });
  }
  if (!Array.isArray(guesses) || guesses.length !== numericQuestions.length || guesses.some(guess => guess !== null && (typeof guess !== 'number' || !Number.isFinite(guess)))) {
    return NextResponse.json({ error: 'A complete set of seven numeric answers is required.' }, { status: 400 });
  }
  // Recalculate distance on the server. Never trust the score sent by a browser.
  const distances = guesses.map((guess, index) => evaluateGuess(index, guess === null ? '' : String(guess)).distance);
  const total = distances.reduce((sum, value) => sum + value, 0);
  try {
    const saved = await saveAttempt(day, name, guesses, total, deviceId);
    return NextResponse.json({ entry: saved, distances, total });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }
}

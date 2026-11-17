# SSX Exeter Ski Jump V9 — Daily Leaderboard

The existing seven-question numerical-guess game now includes:

- A live countdown to midnight **UTC**, when the daily leaderboard resets.
- A global leaderboard listing the top 50 submitted scores for the current UTC day.
- Player-name submission after all seven jumps.
- An atomic, sequential **daily attempt number** (Attempt #1, #2, ...), shown after submission and on the leaderboard.
- Server-side score recalculation so browsers cannot submit an arbitrary distance.
- The game still plays without Supabase, but score saving is explicitly disabled until it is connected.

## Start locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Turn on GLOBAL score saving (required once)

1. Create a free Supabase project at https://supabase.com/dashboard.
2. Open its **SQL Editor**, paste the whole `supabase/schema.sql`, and run it.
3. Copy `.env.local.example` to `.env.local` in this project's root.
4. Replace `SUPABASE_URL` with your Supabase project URL and `SUPABASE_SECRET_KEY` with your project's **secret secret key**. Find both in your Supabase dashboard's API settings.
5. **Keep the secret key on the server only**. Do not use `NEXT_PUBLIC_` or commit `.env.local` to Git.
6. Restart the server using `npm run dev`.
7. Complete seven questions, type a name, choose **SAVE SCORE**, and watch the daily leaderboard update. You can see the same scores from another browser/device connecting to the same server and Supabase database.

## Deploy with Vercel

Push the project to GitHub, import it at https://vercel.com/new, and add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` as Vercel environment variables before deploying. Use the same Supabase project for every deployment that should share a leaderboard.

## Daily reset details

The reset is **every day at 00:00 UTC**, not 24 hours after each player starts. The board automatically filters to today's UTC date; old attempts remain stored in Supabase for future archives. The seven question texts and correct answers do **not** rotate automatically; you can edit those in `src/lib/numericScoring.ts`.

A player may play again and create a new attempt number each time. Attempt numbers refer to the sequence of successfully saved runs on the current UTC day, **not** each question guessed. Each attempt displays its unique `#` number. The board ranks the top 50 individual runs, so multiple entries by one name are allowed.

## Notes on launch security

- Only the Next.js API routes use the secret key, never the browser.
- Server recalculates the seven distances based on the saved guesses.
- The client includes the answers to animate instant results, so this version is meant for a friendly social game, **not a cheat-proof competition**.
- There is no login, bot protection or server-validated 25-second timer yet. Before opening it to a large audience or awarding prizes, add rate limiting/CAPTCHA, authenticated sessions, and server-issued round timing.
- Because the game shows a custom address-based trivia question, check that everyone featured is happy with the public question before deploying beyond the intended group.

## New key migration
The server REST client uses `SUPABASE_SECRET_KEY` only in the `apikey` header. It intentionally does NOT send a new `sb_secret_...` value as a Bearer authorization token. The browser-facing publishable key is included for future browser-side features; this leaderboard currently talks to Supabase exclusively through the Next.js API routes.

## V9.1 — Separate browser attempt numbers

The former attempt number was a global daily submission counter. V9.1 keeps that
number (now labelled **Global entry**) and adds **Player attempt** (per browser,
per UTC day). A new browser starts at player attempt #1 even if other users have
already submitted scores. The browser ID is stored locally; it isn't a login or
an identity check, and clearing site data, private browsing, or using another
browser/device can produce a new player number.

**Existing Supabase projects:** run `supabase/attempt-numbers-migration.sql` once
using the Supabase SQL Editor, then deploy this updated code. Existing rows
cannot be matched to browsers retroactively and show `—` in the player-attempt
column. Do not rerun the original `schema.sql` as a migration.

**Deployment:** keep existing `.env.local` and Vercel secrets; no new environment
variables are required. Deploy from your `frostflight-next` project folder.

## Mobile layout (V9.2)

The mobile layout (700px and below) shows the complete 16:9 ski-jump animation
instead of cropping it to fill a tall container. The answer panel, intro card,
result card, daily timer, and leaderboard now stack below the full-width canvas.
The leaderboard table scrolls horizontally when necessary.

No Supabase migration is needed for this layout update. Keep your existing
`.env.local` in your own project; it is deliberately not distributed.

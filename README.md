# Frost Flight V9.4 — mobile centre-lock camera

Updated relative to V9.3. The skier stays centred in the 420 × 600 mobile game viewport in every animation phase. The question now sits beneath the portrait canvas rather than hiding the skier, and the Uncle Austen arrow is rendered in fixed screen space so it never grows when zooming.

## Apply to your existing `frostflight-next` project

Replace ONLY these files, keeping your existing `.env.local` and any local leaderboard changes:

- `src/app/globals.css`
- `src/lib/gameEngine.ts`

Then run `npm run dev` and test on an iPhone. Push with `git add . && git commit -m "Centre mobile skier and separate question panel" && git push`.

No database changes are needed.

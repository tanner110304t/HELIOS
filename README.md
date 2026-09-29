# Helios — Demo Shell

A working demo of Helios for dealer and property-operator meetings.
**The dealer builds the physical gym. Helios turns it into a digital gym.**

Everything here runs on Vercel with static demo data. No database, no Redis, no API keys.

## How to run

Requires Node.js 20.9+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Checks:

```bash
npm test           # workout engine, data consistency, issue flow
npm run lint
npm run build
```

## Routes

| Route | What it is |
|---|---|
| `/` | Meeting overview: pitch, how it works, **QR code** to the resident app |
| `/demo` | Redirects to `/` |
| `/demo/resident` | Resident app in a phone frame + QR (presenter view) |
| `/demo/operator` | Property operator dashboard (Demo Data) |
| `/demo/dealer` | Dealer view: install list → digital gym |
| `/g/solstice-lofts` | **Resident app** — what the QR opens |
| `/g/solstice-lofts/workout` | Generated workout (`?goal=&level=&time=`) |
| `/g/solstice-lofts/equipment` | Equipment directory |
| `/g/solstice-lofts/equipment/[slug]` | Machine page |
| `/g/solstice-lofts/report/[slug]` | Report-a-problem flow |

The dark **Demo Mode** bar (and a floating control on laptop-width resident pages) is for presenting only. Phones never see it.

## Demo data

All fictional, all typed, all in `src/data/`:

- `demoFacility.ts` — Solstice Lofts (fictional, 284 units)
- `demoEquipment.ts` — 15 items, generic names (no brands). Leg Extension is marked unavailable on purpose.
- `demoExercises.ts` — small exercise library, each tied to the equipment it needs
- `demoAnalytics.ts` — last-30-day Helios engagement (totals are derived, so numbers always agree)
- `demoIssues.ts` — pre-seeded reports (one resolved)
- `repository.ts` — the **only** way pages read data. Swap its internals for a real backend later.

## Workout engine

`src/lib/workout/generateWorkout.ts` — deterministic, no AI.

1. Keep only equipment in the room that is **available**.
2. Keep exercises whose required equipment is all available and whose difficulty suits the level.
3. Fill the goal's movement slots (`templates.ts`) in order until the session length is reached. Prefer the level's difficulty, then an unused machine.
4. Add a cardio warm-up (and a finisher for General Fitness).
5. Swap options = other eligible exercises for the same slot.

Same inputs → same workout. A different room → a different workout.

## Issue reports

Reports are saved in the browser (`localStorage`) — see `src/lib/issues/client.ts`.
A report filed **on the laptop** (including inside the phone frame on `/demo/resident`) shows up on the operator dashboard immediately. A report filed on someone else's phone stays on that phone. "Reset demo reports" on the dashboard clears them.

## Deploy to Vercel

1. Push this folder to GitHub (e.g. `tanner110304t/HELIOS`).
2. Go to vercel.com → **Add New… → Project** → import the repo.
3. Framework preset: **Next.js** (auto). No environment variables needed. Click **Deploy**.
4. Open the deployed URL. The QR code automatically points at `<your-url>/g/solstice-lofts`.

Optional: set `NEXT_PUBLIC_SITE_URL` (e.g. `https://helios-demo.vercel.app`) to force the QR to a specific domain.
Note: on `localhost` the QR can't be opened by a phone — use the deployed URL for meetings.

## What is intentionally fake

- **Analytics** — every number is fictional and labeled Demo Data
- **Property** — Solstice Lofts does not exist
- **Equipment data** — generic, hand-written; setup copy is original placeholder text
- **Issue routing** — nothing is emailed or sent anywhere; reports live in the browser
- **Authentication** — none
- **Backend persistence** — none (no database, no Redis)

## What comes next

Replace the static facility in `src/data/` with a real dealer equipment list: map each line of a real install/quote list to Helios equipment types, and let the existing engine build workouts from it. Persistent storage (PostgreSQL/Supabase) comes in when a real pilot property needs saved reports and operator accounts.

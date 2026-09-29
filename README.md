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
3. Pick candidates for the goal's movement slots (`templates.ts`) — narrowed to the resident's **focus areas** if they chose any (chest, back, shoulders, arms, legs & glutes, core) — preferring the level's difficulty, then an unused machine. Longer sessions go round the slots again with new exercises.
4. Add a cardio warm-up (3 min for 20-minute sessions, 5 up to 45, 8 for 60–90) and a finisher for General Fitness.
5. **Fit to time** (`timeModel.ts`): keep as many exercises and sets as fit the chosen length. Rest is never cut. Minimum 2 sets.
6. Swap options = other eligible exercises for the same slot.

Time assumptions (estimates, not measurements): 40 sec per set (70 sec for one-side-at-a-time), rest only *between* sets, 60 sec to move and set up per exercise. The workout screen shows "about N min", which is always within the chosen length (20–90 min). If the room can't fill most of the time for the chosen focus and level, the plan says so instead of padding.

Same inputs → same workout. A different room → a different workout.

## Equipment service loop

All changes made during a demo live in one small versioned record in the browser (`src/lib/demo/`):

- **Reports** move **Reported → Acknowledged → Resolved**, with timestamps and an optional short update from the property team that residents see on the machine page.
- **Service status** is separate. The operator explicitly takes a machine **out of service** or **returns it to service** (from an issue card or the inventory table). Resolving a report does *not* put a machine back, and returning one that still has unresolved reports asks for a second click.
- Resident equipment pages, the welcome screen and **new workouts** all use the same live status. A workout already in progress isn't rewritten; the affected exercise is flagged with in-service alternatives.
- **Copy service brief** puts a plain-text summary (facility, machine, asset tag, location, issue, time, reference, status) on the clipboard, for whatever channel the property already uses with its service provider. Nothing is sent.

Every page open **in this browser** (tabs, and the phone frame on `/demo/resident`) updates immediately. Another device (e.g. a dealer's phone) keeps its own separate record; the resident receipt says so.

**Reset demo** (in the dark presenter bar, always visible) clears everything saved in this browser so each meeting starts the same way.

## Deploy to Vercel

1. Push this folder to GitHub (e.g. `tanner110304t/HELIOS`).
2. Go to vercel.com → **Add New… → Project** → import the repo.
3. Framework preset: **Next.js** (auto). No environment variables needed. Click **Deploy**.
4. Open the deployed URL. The QR code automatically points at `<your-url>/g/solstice-lofts`.

Optional: set `NEXT_PUBLIC_SITE_URL` (e.g. `https://helios-demo.vercel.app`) to force the QR to a specific domain.
Note: on `localhost` the QR can't be opened by a phone — use the deployed URL for meetings.

## What is intentionally fake

- **Analytics** — every number is fictional, labeled Demo Data, over a fixed sample period (Aug 31 – Sep 27, 2026)
- **Property** — Solstice Lofts does not exist
- **Equipment data** — generic, hand-written; setup copy is original placeholder text
- **Issue routing and service status** — nothing is emailed or sent anywhere; reports and status changes live in this browser only
- **Authentication** — none
- **Backend persistence** — none (no database, no Redis)

## What comes next

Replace the static facility in `src/data/` with a real dealer equipment list: map each line of a real install/quote list to Helios equipment types, and let the existing engine build workouts from it. Persistent storage (PostgreSQL/Supabase) comes in when a real pilot property needs saved reports and operator accounts.

# Helios — 5-minute demo runbook

For a meeting with a commercial fitness dealer or a property operator. Everything runs in one browser on your laptop; the **Guide** button in the dark bar has the same six steps as a checklist.

## Before the meeting (1 minute)

1. Open the deployed site (not `localhost` — phones can't reach that) on your laptop.
2. Click **Reset demo** in the dark bar. This clears reports, service changes, feedback and resident workouts saved in this browser, so every meeting starts the same way.
3. Keep two tabs ready: **Resident** (`/demo/resident`) and **Operator** (`/demo/operator`).

> Phones that scan the QR code keep their own separate data. That's fine for letting a dealer try the app, but use the **phone frame on your laptop** for the connected resident → operator story.

## The walkthrough

**0:00 — Overview (`/`).** *"Dealers build the physical gym. Helios turns the equipment you install into something residents can actually use — and gives the property team a clear view of what helps and what needs attention."* Point at **What changes in the room**. Offer the QR: *"Scan this — it's what a resident sees when they walk in."*

**0:40 — Resident starts (Resident tab, phone frame).** Tap **Help me get started**. *"No app, no login. This plan only uses what's in this room and in service — Leg Extension is out, so it's left out."* Point at *about 30 min*.

**1:20 — Resident gets help.** Tap **Log weights** on an exercise, enter a weight. Tap an equipment chip to open the machine page, then come back — *"it keeps your place."* Tap **"[machine] is busy"** → pick an alternative. *"It never suggests another exercise on the same machine."*

**2:00 — Resident reports & gives feedback.** Back on the machine page, tap **Report a Problem** → Unusual noise → Send. *"They didn't have to say which machine or where — Helios attached it."* (Optionally finish the plan and answer **Did this plan help?**)

**2:40 — Operator acts (Operator tab).** Point at **This demo session** — it just updated. Scroll to **Equipment issues**: type an update ("Technician visit booked for Thursday"), click **Acknowledge**, then **Take out of service**. Click **Copy service brief**: *"This goes into whatever channel you already use with your service provider. Helios doesn't dispatch anyone."*

**3:20 — Resident sees the result (Resident tab).** Open that machine in the phone frame: **Out of service**, **Acknowledged**, and the update. Back on Operator: **Mark resolved**, then **Return to service** — *"resolving a report and putting a machine back are separate decisions."*

**4:00 — Dealer & pilot close (Dealer tab).** Walk the install-list → digital-gym mapping, **Who does what in a pilot**, and tick through **Plan a one-property pilot** together. **Copy checklist** or **Print** for follow-up. Ask: *"Which of your installations would be a good first property?"*

## What to say about the numbers

- Everything in the sample period is **fictional** and labelled Demo Data. Counts sit beside every percentage.
- Helios measures **Helios activity**, not gym visits, occupancy, retention or ROI.
- "Said the plan helped" is among people who answered, with the response count shown.

## If something looks off

| Symptom | Fix |
|---|---|
| Old reports or a half-finished workout from last time | Click **Reset demo** |
| A dealer's phone report doesn't appear on your dashboard | Expected — phones keep separate data. Re-file it in the phone frame |
| QR opens nothing on a phone | You're on `localhost`; use the deployed URL |
| "Your report wasn't saved" | The browser is blocking storage (private mode). Use a normal window |

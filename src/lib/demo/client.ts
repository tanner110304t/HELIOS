"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getSeedIssues } from "@/data/demoIssues";
import type { Equipment, EquipmentStatus, IssueCategory, IssueReport } from "@/types/domain";
import {
  EMPTY_RESIDENT,
  RESIDENT_VERSION,
  archive,
  newActivePlan,
  parseResident,
  type ActivePlan,
  type ResidentState,
} from "./resident";
import type { Workout } from "@/lib/workout/generateWorkout";
import {
  EMPTY_STATE,
  STATE_VERSION,
  effectiveEquipment,
  effectiveIssues,
  parseState,
  sessionSummary,
  withEvent,
  withoutEvent,
  withIssueStatus,
  withReport,
  withService,
  type DemoEvent,
  type DemoEventType,
  type DemoState,
} from "./state";

/**
 * Browser storage for the demo — one small versioned record per facility.
 *
 * Every page on this laptop (tabs, and the phone frame on /demo/resident)
 * reads the same record and updates immediately:
 *   - `storage` events reach OTHER documents,
 *   - a custom event reaches THIS document (storage events never do).
 * A different device has its own separate record. This is the seam a real
 * backend replaces.
 */

const PREFIX = "helios-demo:";
const CHANGE_EVENT = "helios-demo:change";
const keyFor = (facilityId: string) => `${PREFIX}v${STATE_VERSION}:${facilityId}`;
const residentKeyFor = (facilityId: string) => `${PREFIX}resident-v${RESIDENT_VERSION}:${facilityId}`;

function notify() {
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Apply a change to a stored record and save it. Returns false if the browser refused to save. */
function write<T>(key: string, parse: (raw: string | null) => T, change: (s: T) => T): boolean {
  try {
    const next = change(parse(readRaw(key)));
    window.localStorage.setItem(key, JSON.stringify(next));
    notify();
    return true;
  } catch {
    return false;
  }
}

function update(facilityId: string, change: (s: DemoState) => DemoState): boolean {
  return write(keyFor(facilityId), parseState, change);
}

export function updateResident(facilityId: string, change: (s: ResidentState) => ResidentState): boolean {
  return write(residentKeyFor(facilityId), parseResident, change);
}

// ── subscription with stable snapshots (useSyncExternalStore) ──────────────

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith(PREFIX)) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const cache = new Map<string, { raw: string | null; value: unknown }>();
function cached<T>(key: string, parse: (raw: string | null) => T): T {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T; // same object → no re-render
  const value = parse(raw);
  cache.set(key, { raw, value });
  return value;
}
const snapshot = (facilityId: string) => cached(keyFor(facilityId), parseState);

/** The resident's own plan and history on this device (empty during server render). */
export function useResident(facilityId: string) {
  const state = useSyncExternalStore(
    subscribe,
    () => cached(residentKeyFor(facilityId), parseResident),
    () => EMPTY_RESIDENT,
  );
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return { state, hydrated };
}

function newId(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${rand.slice(0, 12).toLowerCase()}`;
}

/**
 * Save a freshly generated workout as the active plan. Anything logged in the
 * previous plan is kept in history first. Returns the plan, or null if the
 * browser refused to save (the workout still works, it just won't persist).
 */
export function startPlan(facilityId: string, workout: Workout): ActivePlan | null {
  const now = new Date().toISOString();
  const plan = newActivePlan(workout, facilityId, newId("plan"), now);
  const ok = updateResident(facilityId, (s) => ({ ...archive(s, now), active: plan }));
  return ok ? plan : null;
}

/** Change the active plan (and keep its logged sets mirrored into history). */
export function changePlan(facilityId: string, change: (p: ActivePlan) => ActivePlan): boolean {
  return updateResident(facilityId, (s) => {
    if (!s.active) return s;
    const next = { ...s, active: change(s.active) };
    return archive(next, new Date().toISOString());
  });
}

export function endPlan(facilityId: string): boolean {
  return updateResident(facilityId, (s) => ({ ...archive(s, new Date().toISOString()), active: null }));
}

export function clearHistory(facilityId: string): boolean {
  return updateResident(facilityId, (s) => ({ ...s, history: [] }));
}

/** Seeded report times are relative to when this page loaded in the browser. */
const clientNow = typeof window === "undefined" ? 0 : Date.now();

/**
 * Everything a page needs about a facility, with demo changes applied.
 * `hydrated` is false during the server render and the first client render,
 * when only seed data is used — show times only once it's true.
 */
export function useFacilityState(facilityId: string, seedEquipment: Equipment[]) {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot(facilityId),
    () => EMPTY_STATE,
  );
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return useMemo(() => {
    const seeds = getSeedIssues(hydrated ? clientNow : 0).filter((i) => i.facilityId === facilityId);
    return {
      hydrated,
      now: clientNow,
      equipment: effectiveEquipment(seedEquipment, state),
      issues: effectiveIssues(seeds, state),
      session: sessionSummary(state),
    };
  }, [facilityId, seedEquipment, state, hydrated]);
}

// ── actions ─────────────────────────────────────────────────────────────────


/** Build the report record. Equipment + facility context come from the page, never from the resident. */
export function buildIssueReport(input: {
  facilityId: string;
  equipmentId: string;
  category: IssueCategory;
  description?: string;
}): IssueReport {
  return {
    id: newId("rpt"),
    facilityId: input.facilityId,
    equipmentId: input.equipmentId,
    category: input.category,
    description: input.description?.trim().slice(0, 280) || undefined,
    status: "open",
    reportedAt: new Date().toISOString(),
    source: "live",
  };
}

/** Save a report on this device. `saved: false` means the browser refused — never claim success then. */
export function submitIssueReport(input: Parameters<typeof buildIssueReport>[0]) {
  const report = buildIssueReport(input);
  const saved = update(input.facilityId, (s) => withReport(s, report));
  return { report, saved };
}

export function setIssueStatus(
  facilityId: string,
  issue: IssueReport,
  status: "acknowledged" | "resolved",
  note?: string,
) {
  return update(facilityId, (s) => withIssueStatus(s, issue, status, new Date().toISOString(), note));
}

/** Record a resident event for the operator's "This demo session" panel. Best effort. */
export function recordEvent(facilityId: string, event: Omit<DemoEvent, "id" | "at">) {
  const full: DemoEvent = { ...event, id: newId("evt"), at: new Date().toISOString() };
  return update(facilityId, (s) => withEvent(s, full));
}

export function removeEvent(facilityId: string, type: DemoEventType, planId: string) {
  return update(facilityId, (s) => withoutEvent(s, type, planId));
}

export function setServiceStatus(facilityId: string, equipmentId: string, status: EquipmentStatus, reason?: string) {
  return update(facilityId, (s) => withService(s, equipmentId, status, new Date().toISOString(), reason));
}

/** Remove every piece of Helios demo data saved in this browser. */
export function resetDemo(): boolean {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    cache.clear();
    notify();
    return true;
  } catch {
    return false;
  }
}

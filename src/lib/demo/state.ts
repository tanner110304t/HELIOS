import { issueCategories, issueCategoryLabels } from "@/data/demoIssues";
import type { Equipment, EquipmentStatus, Facility, IssueCategory, IssueReport } from "@/types/domain";

/**
 * Demo state that changes during a meeting, plus the pure rules for applying
 * it to the seeded facility. No browser APIs here (see ./client.ts), so all of
 * this is unit-tested.
 *
 * Two separate concepts, on purpose:
 *   - an ISSUE moves Reported → Acknowledged → Resolved
 *   - a MACHINE is in service or out of service
 * Reporting a noise doesn't take a machine out of service, and resolving a
 * report doesn't put one back. The property team does each explicitly.
 */

export const STATE_VERSION = 1;

export type IssueChange = {
  status: "acknowledged" | "resolved";
  acknowledgedAt?: string;
  resolvedAt?: string;
  update?: string;
};

export type ServiceOverride = {
  status: EquipmentStatus;
  reason?: string;
  changedAt: string;
};

/**
 * The few resident events the operator "This demo session" panel counts.
 * Local only; no identity, no health data, just categories.
 */
export type DemoEventType = "plan_started" | "plan_completed" | "exercise_swapped" | "busy_alternative" | "feedback_submitted";

export type DemoEvent = {
  id: string;
  type: DemoEventType;
  at: string;
  planId?: string;
  /** feedback_submitted only */
  answer?: "yes" | "somewhat" | "no";
  reasons?: string[];
};

export type DemoState = {
  version: typeof STATE_VERSION;
  events: DemoEvent[];
  /** Reports filed in this browser during the demo. */
  reports: IssueReport[];
  /** Operator actions on any report (seeded or live), by report id. */
  issueChanges: Record<string, IssueChange>;
  /** Operator service changes, by equipment id. */
  service: Record<string, ServiceOverride>;
};

export const EMPTY_STATE: DemoState = Object.freeze({
  version: STATE_VERSION,
  events: [],
  reports: [],
  issueChanges: {},
  service: {},
}) as DemoState;

export const MAX_UPDATE_LENGTH = 140;
const MAX_REPORTS = 50;

// ── validation ──────────────────────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isStr = (v: unknown): v is string => typeof v === "string";
const optStr = (v: unknown) => (isStr(v) ? v : undefined);

function parseReport(v: unknown): IssueReport | null {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.facilityId) || !isStr(v.equipmentId) || !isStr(v.reportedAt)) {
    return null;
  }
  if (!issueCategories.includes(v.category as IssueCategory)) return null;
  return {
    id: v.id,
    facilityId: v.facilityId,
    equipmentId: v.equipmentId,
    category: v.category as IssueCategory,
    description: optStr(v.description),
    status: "open",
    reportedAt: v.reportedAt,
    source: "live",
  };
}

/**
 * Turn whatever is in storage into a valid state. Anything unreadable,
 * from an older version, or the wrong shape is dropped rather than trusted.
 */
export function parseState(raw: string | null): DemoState {
  if (!raw) return EMPTY_STATE;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_STATE;
  }
  if (!isObj(data) || data.version !== STATE_VERSION) return EMPTY_STATE;

  const reports = (Array.isArray(data.reports) ? data.reports : [])
    .map(parseReport)
    .filter((r): r is IssueReport => r !== null)
    .slice(0, MAX_REPORTS);

  const issueChanges: Record<string, IssueChange> = {};
  if (isObj(data.issueChanges)) {
    for (const [id, c] of Object.entries(data.issueChanges)) {
      if (!isObj(c) || (c.status !== "acknowledged" && c.status !== "resolved")) continue;
      issueChanges[id] = {
        status: c.status,
        acknowledgedAt: optStr(c.acknowledgedAt),
        resolvedAt: optStr(c.resolvedAt),
        update: optStr(c.update)?.slice(0, MAX_UPDATE_LENGTH),
      };
    }
  }

  const service: Record<string, ServiceOverride> = {};
  if (isObj(data.service)) {
    for (const [id, o] of Object.entries(data.service)) {
      if (!isObj(o) || (o.status !== "available" && o.status !== "unavailable") || !isStr(o.changedAt)) continue;
      service[id] = { status: o.status, reason: optStr(o.reason), changedAt: o.changedAt };
    }
  }

  const types: DemoEventType[] = ["plan_started", "plan_completed", "exercise_swapped", "busy_alternative", "feedback_submitted"];
  const events: DemoEvent[] = (Array.isArray(data.events) ? data.events : [])
    .filter((e): e is Record<string, unknown> => isObj(e) && isStr(e.id) && isStr(e.at) && types.includes(e.type as DemoEventType))
    .map((e): DemoEvent => ({
      id: e.id as string,
      type: e.type as DemoEventType,
      at: e.at as string,
      planId: optStr(e.planId),
      answer: e.answer === "yes" || e.answer === "somewhat" || e.answer === "no" ? (e.answer as DemoEvent["answer"]) : undefined,
      reasons: Array.isArray(e.reasons) ? e.reasons.filter(isStr) : undefined,
    }))
    .slice(-MAX_EVENTS);

  return { version: STATE_VERSION, events, reports, issueChanges, service };
}

const MAX_EVENTS = 500;

/**
 * Add an event. Completion and feedback count once per plan: a repeat
 * replaces the earlier one (re-completing, changing an answer).
 */
export function withEvent(state: DemoState, event: DemoEvent): DemoState {
  const oncePerPlan = event.type === "plan_completed" || event.type === "feedback_submitted" || event.type === "plan_started";
  const rest = oncePerPlan && event.planId
    ? state.events.filter((e) => !(e.type === event.type && e.planId === event.planId))
    : state.events;
  return { ...state, events: [...rest, event].slice(-MAX_EVENTS) };
}

/** Undo a completion (resident un-checked something). */
export function withoutEvent(state: DemoState, type: DemoEventType, planId: string): DemoState {
  return { ...state, events: state.events.filter((e) => !(e.type === type && e.planId === planId)) };
}

export type SessionSummary = {
  plansStarted: number;
  plansCompleted: number;
  feedback: { yes: number; somewhat: number; no: number };
  swaps: number;
  busyAlternatives: number;
  reportsFiled: number;
  reportsAcknowledged: number;
  reportsResolved: number;
  serviceChanges: number;
};

/** Counts for the operator's "This demo session" strip — only what happened in this browser. */
export function sessionSummary(state: DemoState): SessionSummary {
  const count = (t: DemoEventType) => state.events.filter((e) => e.type === t).length;
  const fb = state.events.filter((e) => e.type === "feedback_submitted");
  const changes = Object.values(state.issueChanges);
  return {
    plansStarted: count("plan_started"),
    plansCompleted: count("plan_completed"),
    feedback: {
      yes: fb.filter((e) => e.answer === "yes").length,
      somewhat: fb.filter((e) => e.answer === "somewhat").length,
      no: fb.filter((e) => e.answer === "no").length,
    },
    swaps: count("exercise_swapped"),
    busyAlternatives: count("busy_alternative"),
    reportsFiled: state.reports.length,
    reportsAcknowledged: changes.filter((c) => c.acknowledgedAt).length,
    reportsResolved: changes.filter((c) => c.status === "resolved").length,
    serviceChanges: Object.keys(state.service).length,
  };
}

// ── deriving what everyone sees ─────────────────────────────────────────────

/** Seeded equipment with operator service changes applied. */
export function effectiveEquipment(seed: Equipment[], state: DemoState): Equipment[] {
  return seed.map((e) => {
    const o = state.service[e.id];
    if (!o) return e;
    return {
      ...e,
      status: o.status,
      statusReason: o.status === "unavailable" ? (o.reason ?? e.statusReason) : undefined,
    };
  });
}

/** Seeded + live reports with operator changes applied, newest first. */
export function effectiveIssues(seeds: IssueReport[], state: DemoState): IssueReport[] {
  const byId = new Map<string, IssueReport>();
  for (const r of [...state.reports, ...seeds]) if (!byId.has(r.id)) byId.set(r.id, r);
  return [...byId.values()]
    .map((r) => {
      const c = state.issueChanges[r.id];
      if (!c) return r;
      return {
        ...r,
        status: c.status,
        acknowledgedAt: c.acknowledgedAt ?? r.acknowledgedAt,
        resolvedAt: c.resolvedAt ?? r.resolvedAt,
        update: c.update ?? r.update,
      };
    })
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
}

export const isUnresolved = (i: IssueReport) => i.status !== "resolved";

export function unresolvedFor(issues: IssueReport[], equipmentId: string): IssueReport[] {
  return issues.filter((i) => i.equipmentId === equipmentId && isUnresolved(i));
}

/** The report a resident should see on a machine page: newest unresolved, else newest resolved. */
export function currentIssueFor(issues: IssueReport[], equipmentId: string): IssueReport | undefined {
  const mine = issues.filter((i) => i.equipmentId === equipmentId);
  return mine.find(isUnresolved) ?? mine[0];
}

/**
 * Before returning a machine to service: other reports still open on it?
 * The UI asks for a second, deliberate click if so.
 */
export function returnToServiceWarning(issues: IssueReport[], equipmentId: string): string | null {
  const open = unresolvedFor(issues, equipmentId);
  if (open.length === 0) return null;
  return `${open.length} unresolved report${open.length === 1 ? "" : "s"} on this machine.`;
}

// ── state changes (pure: return a new state) ────────────────────────────────

export function withReport(state: DemoState, report: IssueReport): DemoState {
  return { ...state, reports: [report, ...state.reports].slice(0, MAX_REPORTS) };
}

export function withIssueStatus(
  state: DemoState,
  issue: IssueReport,
  status: "acknowledged" | "resolved",
  at: string,
  update?: string,
): DemoState {
  const note = update?.trim().slice(0, MAX_UPDATE_LENGTH) || undefined;
  const prev = state.issueChanges[issue.id];
  const change: IssueChange = {
    status,
    acknowledgedAt: issue.acknowledgedAt ?? prev?.acknowledgedAt ?? at,
    resolvedAt: status === "resolved" ? at : undefined,
    update: note ?? prev?.update ?? issue.update,
  };
  return { ...state, issueChanges: { ...state.issueChanges, [issue.id]: change } };
}

export function withService(
  state: DemoState,
  equipmentId: string,
  status: EquipmentStatus,
  at: string,
  reason?: string,
): DemoState {
  return {
    ...state,
    service: { ...state.service, [equipmentId]: { status, reason: reason?.trim() || undefined, changedAt: at } },
  };
}

// ── small helpers shared by resident and operator views ─────────────────────

/** Short human reference, e.g. HX-1042. */
export function reportReference(id: string) {
  return `HX-${id.replace(/^rpt_(seed_)?/, "").slice(0, 4).toUpperCase()}`;
}

export const issueStatusLabels: Record<IssueReport["status"], string> = {
  open: "Reported",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

function fmt(iso: string | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Plain-text summary a property manager can paste into whatever channel they
 * already use with their service provider. Helios doesn't send it anywhere.
 */
export function serviceBrief(facility: Facility, equipment: Equipment, issue: IssueReport): string {
  const lines = [
    `Service brief — ${facility.name}`,
    `Equipment: ${equipment.name}${equipment.quantity > 1 ? ` (group of ${equipment.quantity})` : ""} · asset ${equipment.assetTag}`,
    `Location: ${equipment.location}`,
    `Issue: ${issueCategoryLabels[issue.category]}${issue.description ? ` — "${issue.description}"` : ""}`,
    `Reported: ${fmt(issue.reportedAt)} · ref ${reportReference(issue.id)}`,
    `Status: ${issueStatusLabels[issue.status]} · machine ${equipment.status === "available" ? "in service" : "out of service"}`,
  ];
  if (issue.update) lines.push(`Latest update: ${issue.update}`);
  return lines.join("\n");
}

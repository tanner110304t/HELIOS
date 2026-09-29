import type { SVGProps } from "react";

/** Minimal line icon set (original, 24px grid, 1.6 stroke). */
type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const IconArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconArrowLeft = (p: P) => (
  <svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconSwap = (p: P) => (
  <svg {...base(p)}><path d="M7 4L4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7" /></svg>
);
export const IconAlert = (p: P) => (
  <svg {...base(p)}><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></svg>
);
export const IconWrench = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 5.5a4 4 0 0 0 4.9 4.9L11 18.8a2 2 0 1 1-2.8-2.8l8.4-8.4a4 4 0 0 0-2.1-2.1z" />
  </svg>
);
export const IconPause = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M10 9v6M14 9v6" /></svg>
);
export const IconCircle = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></svg>
);
export const IconPin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.2" /></svg>
);
export const IconTag = (p: P) => (
  <svg {...base(p)}><path d="M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5z" /><circle cx="8" cy="8.5" r="1.3" /></svg>
);
export const IconBuilding = (p: P) => (
  <svg {...base(p)}><path d="M5 20V5h9v15M14 9h5v11M3 20h18M8 8h3M8 11h3M8 14h3" /></svg>
);
export const IconPhone = (p: P) => (
  <svg {...base(p)}><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></svg>
);
export const IconChart = (p: P) => (
  <svg {...base(p)}><path d="M4 20h16M7 16v-4M12 16V8M17 16v-7" /></svg>
);
export const IconList = (p: P) => (
  <svg {...base(p)}><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></svg>
);
export const IconRefresh = (p: P) => (
  <svg {...base(p)}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" /></svg>
);
export const IconExternal = (p: P) => (
  <svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
);

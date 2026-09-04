/**
 * Icon — typed port of CL.icon() (clearline.js). Inline stroke SVG on a 24 viewBox, one 1.6
 * weight, round caps/joins, currentColor. ERD §2: never emoji, never unicode glyph icons.
 *
 * The path geometry is ported VERBATIM from the frozen prototype. It's static, self-authored
 * markup (no user input), rendered via dangerouslySetInnerHTML to preserve exact fidelity.
 */

const PATHS = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  pin: '<path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  locate: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
  work: '<rect x="4" y="8" width="16" height="12" rx="1"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12l5 5L20 6"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  chevR: '<path d="M9 6l6 6-6 6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  walk: '<circle cx="12" cy="4.2" r="1.7"/><path d="M12 8l-3 4 2 2v6M12 8l3 3 3 1M11 14l-2 6"/>',
  leaf: '<path d="M4 20c0-8 6-14 16-14 0 10-6 14-14 14"/><path d="M9 15c2-3 5-5 8-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.1-2.6 3.8"/><path d="M12 17.4v.01"/>',
  shield: '<path d="M12 3l7 3v5c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6l7-3Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11.2v5"/><path d="M12 8v.01"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6.2 6.2 0 0 0 10 10Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
  bus: '<rect x="4" y="4.5" width="16" height="11.5" rx="1.6"/><path d="M4 11.5h16"/><circle cx="8" cy="19" r="1.3"/><circle cx="16" cy="19" r="1.3"/><path d="M8 16v1.4M16 16v1.4"/>',
  metro:
    '<rect x="6" y="3.5" width="12" height="12.5" rx="2"/><path d="M6 11h12"/><circle cx="9.4" cy="13.4" r=".9"/><circle cx="14.6" cy="13.4" r=".9"/><path d="M8.5 16l-2 3.5M15.5 16l2 3.5"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M7.6 16.4l8.8-8.8"/>',
  gate: '<path d="M4 21V6l8-3 8 3v15"/><path d="M3 21h18"/><path d="M10 21v-5h4v5"/><path d="M8 9.5h.01M16 9.5h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M4 7l8 6 8-6"/>',
} as const;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export interface IconProps {
  name: IconName;
  /** Icon size in px. 16/20/24 is the design §6 grid; 22 is the ported tab-bar size. Default 20. */
  size?: number;
  /** Accessible name. When omitted the icon is decorative (aria-hidden). */
  label?: string;
  className?: string;
}

export function Icon({ name, size = 20, label, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}

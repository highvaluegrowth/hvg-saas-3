/**
 * HVG Mobile Design System — Central Theme
 *
 * Primary palette: Dark Slate / Cyan / Emerald
 * Amber (#F59E0B) is strictly forbidden.
 */

export const colors = {
  // ── Backgrounds ──────────────────────────────────────────────
  bg: {
    primary: '#0C1A2E',    // deepest navy — root background
    secondary: '#0f172a',  // slightly lighter — card surfaces
    elevated: '#1e293b',   // elevated surfaces — sheet, modal
    overlay: 'rgba(12, 26, 46, 0.8)', // glassmorphic overlay
  },

  // ── Brand / Primary ──────────────────────────────────────────
  primary: {
    DEFAULT: '#06b6d4',  // cyan-500 — main accent
    dark:    '#0891b2',  // cyan-600 — pressed / border
    light:   '#67e8f9',  // cyan-300 — muted text / icon
    glow:    'rgba(6, 182, 212, 0.25)',
  },

  // ── Success / Emerald ────────────────────────────────────────
  success: {
    DEFAULT: '#10b981',  // emerald-500
    dark:    '#059669',  // emerald-600
    glow:    'rgba(16, 185, 129, 0.25)',
  },

  // ── Danger / Warning ─────────────────────────────────────────
  danger: '#ef4444',   // red-500
  warning: '#f97316',  // orange-500 (NOT amber)

  // ── Neutrals ─────────────────────────────────────────────────
  text: {
    primary:   '#f8fafc',               // slate-50
    secondary: 'rgba(248,250,252,0.6)', // 60% opacity
    muted:     'rgba(248,250,252,0.35)',
  },
  border: {
    DEFAULT: 'rgba(255,255,255,0.08)',
    strong:  '#1e293b',
  },

  // ── Tab Bar ──────────────────────────────────────────────────
  tab: {
    active:   '#06b6d4',
    inactive: '#475569',
    barBg:    'rgba(12, 26, 46, 0.8)',
  },
} as const;

export type Colors = typeof colors;

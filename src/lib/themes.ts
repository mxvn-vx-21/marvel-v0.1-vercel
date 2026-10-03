import type { CSSProperties } from "react";

/**
 * Configuration-driven themes. A theme is pure data → CSS variables.
 * Add a theme = add an object here. Nothing else in the app hardcodes colours.
 * Future: `premium: true` themes gated by user.plan, user-defined overrides in profile.config.
 */
export interface Theme {
  id: string;
  name: string;
  premium: boolean;
  background: string; // any CSS `background` value (colour / gradient)
  accent: string;
  text: string;
  secondaryText: string;
  card: string;
  border: string;
  radius: string;
  typography: { heading: string; body: string };
  effects: { glow: string; cardShadow: string };
  animations: { enter: "none" | "fade-up" };
}

const SYSTEM_BODY = `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const HEADING = `"Arial Black", "Helvetica Neue", Impact, ui-sans-serif, system-ui, sans-serif`;

export const THEMES: Record<string, Theme> = {
  "default-dark": {
    id: "default-dark",
    name: "Default Dark",
    premium: false,
    background: "#0a0a0f",
    accent: "#e11d2e",
    text: "#f4f4f5",
    secondaryText: "#a1a1aa",
    card: "#14141c",
    border: "#2a2a36",
    radius: "14px",
    typography: { heading: HEADING, body: SYSTEM_BODY },
    effects: { glow: "0 0 60px rgba(225,29,46,.25)", cardShadow: "6px 6px 0 rgba(225,29,46,.9)" },
    animations: { enter: "fade-up" },
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    premium: false,
    background: "linear-gradient(180deg,#050816 0%,#0b1230 60%,#0f1b4d 100%)",
    accent: "#38bdf8",
    text: "#e6edff",
    secondaryText: "#8da2d6",
    card: "rgba(15,23,60,.75)",
    border: "#26356e",
    radius: "18px",
    typography: { heading: HEADING, body: SYSTEM_BODY },
    effects: { glow: "0 0 70px rgba(56,189,248,.25)", cardShadow: "6px 6px 0 rgba(56,189,248,.85)" },
    animations: { enter: "fade-up" },
  },
  cosmic: {
    id: "cosmic",
    name: "Cosmic",
    premium: false,
    background:
      "radial-gradient(900px 500px at 15% 0%,rgba(168,85,247,.35),transparent 60%),radial-gradient(800px 500px at 90% 20%,rgba(236,72,153,.28),transparent 60%),#0a0614",
    accent: "#ffd400",
    text: "#faf5ff",
    secondaryText: "#b9a6d8",
    card: "rgba(30,16,56,.7)",
    border: "#4c2f86",
    radius: "20px",
    typography: { heading: HEADING, body: SYSTEM_BODY },
    effects: { glow: "0 0 80px rgba(168,85,247,.35)", cardShadow: "6px 6px 0 rgba(255,212,0,.9)" },
    animations: { enter: "fade-up" },
  },
};

export const DEFAULT_THEME_ID = "default-dark";
export const THEME_LIST = Object.values(THEMES);
export const isThemeId = (id: string): boolean => id in THEMES;
export const resolveTheme = (id: string | null | undefined): Theme => THEMES[id ?? ""] ?? THEMES[DEFAULT_THEME_ID];

export function themeToCssVars(t: Theme): CSSProperties {
  return {
    "--p-bg": t.background,
    "--p-accent": t.accent,
    "--p-text": t.text,
    "--p-text-2": t.secondaryText,
    "--p-card": t.card,
    "--p-border": t.border,
    "--p-radius": t.radius,
    "--p-font-heading": t.typography.heading,
    "--p-font-body": t.typography.body,
    "--p-glow": t.effects.glow,
    "--p-card-shadow": t.effects.cardShadow,
  } as CSSProperties;
}

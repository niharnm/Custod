import type { StatusLevel } from "@/types/custod";

/** Canonical Custod palette — keep in sync with globals.css and native ports. */
export const CUSTOD_COLORS = {
  brown: "#332c27",
  brownLight: "#5c4f47",
  rose: "#e8b0af",
  roseLight: "#f3d4d3",
  cream: "#f9f6f1",
  taupe: "#d8bca7",
  amber: "#eab56f",
  amberLight: "#f3cb98",
  amberDark: "#d49a45",
  muted: "#8a7b72",
  secondary: "#f3ebe3",
  surface: "#ffffff",
  surfaceMuted: "#f9f6f1",
  statusGreen: "#6b9e72",
  statusYellow: "#eab56f",
  statusRed: "#d48483",
  statusGreenGlow: "rgb(107 158 114 / 50%)",
  statusYellowGlow: "rgb(234 181 111 / 55%)",
  statusRedGlow: "rgb(212 132 131 / 55%)",
} as const;

export const CUSTOD_RADIUS = {
  sm: "0.6rem",
  md: "0.8rem",
  lg: "1rem",
  xl: "1.4rem",
  card: "2rem",
} as const;

export const CUSTOD_SHADOW = {
  card: "0 2px 12px rgb(51 44 39 / 5%)",
  glass: "0 4px 24px rgb(51 44 39 / 6%)",
  button: "inset 0 1px 0 rgb(255 255 255 / 40%), 0 2px 8px rgb(234 181 111 / 35%)",
} as const;

export const STATUS_CONFIG: Record<
  StatusLevel,
  { color: string; glow: string; label: string }
> = {
  green: {
    color: CUSTOD_COLORS.statusGreen,
    glow: CUSTOD_COLORS.statusGreenGlow,
    label: "Healthy",
  },
  yellow: {
    color: CUSTOD_COLORS.statusYellow,
    glow: CUSTOD_COLORS.statusYellowGlow,
    label: "Caution",
  },
  red: {
    color: CUSTOD_COLORS.statusRed,
    glow: CUSTOD_COLORS.statusRedGlow,
    label: "Burnout risk",
  },
};

export function getStatusColor(status: StatusLevel): string {
  return STATUS_CONFIG[status].color;
}

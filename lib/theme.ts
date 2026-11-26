// Centralized OCOR color palette & semantic theme tokens.
// Every hex value below was sampled directly from the OCOR Color Palette PNG
// and OCOR Logo JPG via Python/PIL (55 palette swatches + 3 brand logo colors).

export const OCOR_PALETTE = {
  core: {
    primary: "#1976d2",
    secondaryAccent: "#f5a623",
    surfaceLight: "#f2f9fd",
    surfaceDark: "#0b3c5d",
    surfaceContainer: "#ffffff",
  },
  outline: {
    base: "#8293a3",
    variant: "#d4e4f6",
  },
  success: {
    base: "#3dbe8b",
    10: "#002114",
    30: "#005237",
    50: "#00885e",
    70: "#40c08d",
    90: "#7ef9c2",
    95: "#beffdc",
  },
  error: {
    base: "#e5484d",
    10: "#410006",
    30: "#92011a",
    50: "#db3e44",
    70: "#ff8986",
    90: "#ffdad8",
    95: "#ffedeb",
  },
  neutral: {
    base: "#5b6b7a",
    10: "#0d1d2a",
    20: "#22323f",
    30: "#394856",
    40: "#50606f",
    50: "#697988",
    60: "#8293a3",
    70: "#9dadbe",
    80: "#bbc8d9",
    90: "#d4e4f6",
    95: "#e7f2ff",
  },
  primaryDark: {
    base: "#1976d2",
    10: "#001e2d",
    20: "#00344b",
    30: "#00466a",
    40: "#00658c",
    50: "#0080ae",
    60: "#57aed8",
    70: "#51b5ea",
    80: "#80cfff",
    90: "#c5e7ff",
    95: "#e4f3ff",
    light: "#4fb3e8",
  },
  secondary: {
    base: "#f5a623",
    10: "#291800",
    20: "#452b00",
    30: "#633f00",
    40: "#835500",
    50: "#a46b00",
    60: "#d19b33",
    70: "#e89b14",
    80: "#ffb955",
    90: "#ffddb4",
    95: "#ffeedd",
  },
  brandLogo: {
    navy: "#06294e",
    orange: "#f97514",
    green: "#509d38",
  },
} as const;

export type OcorPalette = typeof OCOR_PALETTE;

export interface SemanticTokens {
  bg: string;
  surface: string;
  surfaceContainer: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  muted: string;
  outline: string;
  outlineStrong: string;
  primary: string;
  primaryContrast: string;
  secondary: string;
  secondarySoft: string;
  success: string;
  successSoft: string;
  error: string;
  errorSoft: string;
  shadowBase: string;
}

export const LIGHT_SEMANTIC_TOKENS: SemanticTokens = {
  bg: OCOR_PALETTE.core.surfaceLight,
  surface: OCOR_PALETTE.core.surfaceLight,
  surfaceContainer: OCOR_PALETTE.core.surfaceContainer,
  surfaceElevated: OCOR_PALETTE.primaryDark[95],
  text: OCOR_PALETTE.primaryDark[10],
  textSecondary: OCOR_PALETTE.primaryDark[20],
  muted: OCOR_PALETTE.neutral[50],
  outline: OCOR_PALETTE.outline.variant, // soft border (border-line / Material --color-outline-variant)
  outlineStrong: OCOR_PALETTE.outline.base, // strong border (border-line-strong / Material --color-outline)
  primary: OCOR_PALETTE.core.primary,
  primaryContrast: OCOR_PALETTE.core.surfaceContainer,
  secondary: OCOR_PALETTE.core.secondaryAccent,
  secondarySoft: OCOR_PALETTE.secondary[95],
  success: OCOR_PALETTE.success[50],
  successSoft: OCOR_PALETTE.success[95],
  error: OCOR_PALETTE.error.base,
  errorSoft: OCOR_PALETTE.error[95],
  shadowBase: OCOR_PALETTE.primaryDark[10],
};

export const DARK_SEMANTIC_TOKENS: SemanticTokens = {
  bg: OCOR_PALETTE.core.surfaceDark,
  surface: OCOR_PALETTE.primaryDark[10],
  surfaceContainer: OCOR_PALETTE.primaryDark[20],
  surfaceElevated: OCOR_PALETTE.primaryDark[30],
  text: OCOR_PALETTE.neutral[95],
  textSecondary: OCOR_PALETTE.neutral[90],
  muted: OCOR_PALETTE.neutral[70],
  outline: OCOR_PALETTE.neutral[30],
  outlineStrong: OCOR_PALETTE.neutral[50],
  primary: OCOR_PALETTE.primaryDark.light,
  primaryContrast: OCOR_PALETTE.primaryDark[10],
  secondary: OCOR_PALETTE.secondary[80],
  secondarySoft: OCOR_PALETTE.secondary[20],
  success: OCOR_PALETTE.success[70],
  successSoft: OCOR_PALETTE.success[10],
  error: OCOR_PALETTE.error[70],
  errorSoft: OCOR_PALETTE.error[10],
  shadowBase: OCOR_PALETTE.neutral[10],
};

export const THEME_CSS_VARS: Record<keyof SemanticTokens, string> = {
  bg: "var(--ocor-bg)",
  surface: "var(--ocor-surface)",
  surfaceContainer: "var(--ocor-surface-container)",
  surfaceElevated: "var(--ocor-surface-elevated)",
  text: "var(--ocor-text)",
  textSecondary: "var(--ocor-text-2)",
  muted: "var(--ocor-muted)",
  outline: "var(--ocor-outline)", // maps to border-line & Material --color-outline-variant (#d4e4f6 in light)
  outlineStrong: "var(--ocor-outline-strong)", // maps to border-line-strong & Material --color-outline (#8293a3 in light)
  primary: "var(--ocor-primary)",
  primaryContrast: "var(--ocor-primary-contrast)",
  secondary: "var(--ocor-secondary)",
  secondarySoft: "var(--ocor-secondary-soft)",
  success: "var(--ocor-success)",
  successSoft: "var(--ocor-success-soft)",
  error: "var(--ocor-error)",
  errorSoft: "var(--ocor-error-soft)",
  shadowBase: "var(--ocor-shadow-base)",
};

export type MapStatusBucket = "RED" | "YELLOW" | "GREEN";

export interface MapStatusToken {
  bucket: MapStatusBucket;
  label: string;
  hex: string;
  softHex: string;
  textHex: string;
  cssVar: string;
  softCssVar: string;
}

export const MAP_STATUS_TOKENS: Record<MapStatusBucket, MapStatusToken> = {
  RED: {
    bucket: "RED",
    label: "Work not started",
    hex: OCOR_PALETTE.error.base,
    softHex: OCOR_PALETTE.error[95],
    textHex: OCOR_PALETTE.error[30],
    cssVar: "var(--color-error)",
    softCssVar: "var(--color-error-95)",
  },
  YELLOW: {
    bucket: "YELLOW",
    label: "In progress",
    hex: OCOR_PALETTE.core.secondaryAccent,
    softHex: OCOR_PALETTE.secondary[95],
    textHex: OCOR_PALETTE.secondary[40],
    cssVar: "var(--color-accent)",
    softCssVar: "var(--color-secondary-95)",
  },
  GREEN: {
    bucket: "GREEN",
    label: "Resolved",
    hex: OCOR_PALETTE.success.base,
    softHex: OCOR_PALETTE.success[95],
    textHex: OCOR_PALETTE.success[30],
    cssVar: "var(--color-success)",
    softCssVar: "var(--color-success-95)",
  },
};

const RED_STATUSES = new Set([
  "submitted",
  "under_review",
  "verified",
  "reported",
  "dispatched",
]);

const YELLOW_STATUSES = new Set(["assigned", "in_progress", "acknowledged"]);

export function getMapStatusBucket(status: string): MapStatusBucket {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "resolved" || normalized === "closed") {
    return "GREEN";
  }
  if (YELLOW_STATUSES.has(normalized)) {
    return "YELLOW";
  }
  if (RED_STATUSES.has(normalized)) {
    return "RED";
  }
  return "RED";
}

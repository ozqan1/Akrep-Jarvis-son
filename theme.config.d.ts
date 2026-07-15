export type ThemeSwatch = {
  readonly light: string;
  readonly dark: string;
};

export type ThemeColorName =
  | "primary"
  | "background"
  | "surface"
  | "foreground"
  | "muted"
  | "border"
  | "success"
  | "warning"
  | "error"
  | "solar"
  | "danger"
  | "space"
  | "glow";

export const themeColors: Readonly<Record<ThemeColorName, ThemeSwatch>>;

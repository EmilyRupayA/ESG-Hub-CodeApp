import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

const STORAGE_KEY = "vite-ui-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme;
  root.classList.add(resolved);
}

export function useTheme(): ThemeProviderState {
  const ctx = useContext(ThemeProviderContext);

  // Respaldo por si el provider usa su propio contexto
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return (localStorage.getItem(STORAGE_KEY) as Theme) || "system"; } catch { return "system"; }
  });
  useEffect(() => { if (!ctx) applyTheme(theme); }, [ctx, theme]);

  if (ctx) return ctx;
  return {
    theme,
    setTheme: (t: Theme) => {
      try { localStorage.setItem(STORAGE_KEY, t); } catch { /* sin storage */ }
      setThemeState(t);
    },
  };
}
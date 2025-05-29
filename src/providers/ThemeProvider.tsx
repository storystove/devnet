
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Initial context state. Consumers will get this if not wrapped in provider,
// or before the provider's actual state is fully initialized on client.
// It's good for defaultTheme to be the same as the one used in useState initial.
const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system", // This should match the defaultTheme prop of ThemeProvider for consistency
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "devnet-theme", // Consistent storage key
  ...props
}: ThemeProviderProps) {
  // Initialize state with defaultTheme. localStorage is only checked on the client.
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // This effect runs once on the client after initial mount.
  // It's responsible for reading the persisted theme from localStorage.
  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (storedTheme && storedTheme !== theme) { // Only update if different from initial (which is defaultTheme)
      setTheme(storedTheme);
    }
    // If no stored theme, the initial state (defaultTheme) which was set by useState remains.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array: run only once on mount. storageKey & defaultTheme are stable as props for this effect.

  // This effect runs whenever the theme state changes (initially or by user action).
  // It applies the theme to the DOM and persists the choice to localStorage.
  // It only runs on the client.
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      // Function to apply the current system theme
      const applySystemTheme = () => {
        const currentSystemTheme = systemThemeMediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark"); // Ensure clean state before adding
        root.classList.add(currentSystemTheme);
      };

      applySystemTheme(); // Apply current system theme immediately
      localStorage.setItem(storageKey, "system"); // Persist the user's *choice* ("system")

      // Listen for changes in system theme
      systemThemeMediaQuery.addEventListener("change", applySystemTheme);
      return () => systemThemeMediaQuery.removeEventListener("change", applySystemTheme);
    } else {
      // Apply 'light' or 'dark' theme directly
      root.classList.add(theme);
      localStorage.setItem(storageKey, theme); // Persist the explicit theme choice
    }
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme); // Update state, which triggers the effect above to apply and persist
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

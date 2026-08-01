import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { getTheme, ThemeMode } from "./theme";

type Theme = ReturnType<typeof getTheme>;

const ThemeContext = createContext<Theme>(getTheme("light"));

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === "dark" ? "dark" : "light";
  const theme = getTheme(mode);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

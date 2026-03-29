import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const THEME_PRESETS = [
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, neutral contrast with understated accents.",
    palette: "Slate / Cyan",
    font: "Inter",
    background: "Soft graphite",
  },
  {
    id: "sunset-beach",
    name: "Sunset Beach",
    description: "Warm gradients with sunlit highlights.",
    palette: "Coral / Amber",
    font: "Trebuchet",
    background: "Sunset gradient",
  },
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    description: "Midnight blues with crisp teal energy.",
    palette: "Navy / Aqua",
    font: "Poppins",
    background: "Deep sea",
  },
  {
    id: "marine-life",
    name: "Marine Life",
    description: "Vibrant coastal hues with aquatic greens.",
    palette: "Teal / Lime",
    font: "Verdana",
    background: "Lagoon",
  },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("deep-ocean");

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, presets: THEME_PRESETS }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

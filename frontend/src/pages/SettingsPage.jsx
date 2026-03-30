import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const THEME_LABEL_OVERRIDES = {
  minimalist: {
    name: "Ocean Light",
    description: "Soft coastal light with crisp navy contrast.",
    palette: "Sky / Navy",
    background: "Ocean mist gradient",
  },
  "sunset-beach": {
    name: "Obsidian",
    description: "Pure black depth with cool steel highlights.",
    palette: "Charcoal / Steel",
    background: "Obsidian black",
  },
};

const THEME_STYLE_OVERRIDES = {
  minimalist: {
    "--bg": "linear-gradient(135deg, #f8fbff, #e6f2ff)",
    "--text": "#0b1b2b",
    "--muted": "#526378",
    "--accent": "#3b82f6",
    "--accent-contrast": "#0b1b2b",
    "--panel": "rgba(255, 255, 255, 0.78)",
    "--panel-strong": "rgba(226, 236, 249, 0.85)",
    "--border": "rgba(15, 23, 42, 0.08)",
    "--nav-bg": "rgba(255, 255, 255, 0.7)",
    "--nav-active-bg": "rgba(59, 130, 246, 0.15)",
  },
  "sunset-beach": {
    "--bg": "linear-gradient(135deg, #020202, #0b0f14)",
    "--text": "#f8fafc",
    "--muted": "#9aa3b2",
    "--accent": "#64748b",
    "--accent-contrast": "#020202",
    "--panel": "rgba(10, 10, 10, 0.75)",
    "--panel-strong": "rgba(17, 17, 17, 0.85)",
    "--border": "rgba(255, 255, 255, 0.08)",
    "--nav-bg": "rgba(6, 6, 6, 0.7)",
    "--nav-active-bg": "rgba(100, 116, 139, 0.2)",
  },
};

const OVERRIDE_VARS = Array.from(
  new Set(
    Object.values(THEME_STYLE_OVERRIDES).flatMap((vars) => Object.keys(vars))
  )
);

function SettingsPage() {
  const { theme, setTheme, presets } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem("app_sound_enabled");
    return stored ? stored === "true" : true;
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    const stored = parseFloat(localStorage.getItem("app_sound_volume"));
    return Number.isFinite(stored) ? stored : 0.3;
  });

  const displayPresets = useMemo(
    () =>
      presets.map((preset) => {
        const override = THEME_LABEL_OVERRIDES[preset.id];
        return override ? { ...preset, ...override } : preset;
      }),
    [presets]
  );

  useEffect(() => {
    const overrides = THEME_STYLE_OVERRIDES[theme];
    const root = document.body;
    OVERRIDE_VARS.forEach((variable) => root.style.removeProperty(variable));

    if (overrides) {
      Object.entries(overrides).forEach(([variable, value]) => {
        root.style.setProperty(variable, value);
      });
    }
  }, [theme]);

  useEffect(() => {
    const modeSwitch = document.querySelector(".mode-switch");
    if (!modeSwitch) return undefined;

    const previous = {
      display: modeSwitch.style.display,
      opacity: modeSwitch.style.opacity,
    };

    modeSwitch.style.display = "none";
    modeSwitch.style.opacity = "0";

    return () => {
      modeSwitch.style.display = previous.display;
      modeSwitch.style.opacity = previous.opacity;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("app_sound_enabled", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("app_sound_volume", String(soundVolume));
  }, [soundVolume]);

  return (
    <div style={{ padding: "12px 16px 16px", height: "calc(100vh - 24px)" }}>
      <h1 className="page-title" style={{ padding: 0 }}>Settings</h1>

      <div className="line-chart-container" style={{ marginTop: "12px" }}>
        <h3 className="chart-title">Theme Presets</h3>
        <div className="settings-grid">
          {displayPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`theme-card ${theme === preset.id ? "active" : ""}`}
              onClick={() => setTheme(preset.id)}
            >
              <div className="theme-card-header">
                <span className="theme-card-title">{preset.name}</span>
                <span className="theme-card-pill">{preset.palette}</span>
              </div>
              <p className="theme-card-description">{preset.description}</p>
              <div className="theme-card-meta">
                <span>Font: {preset.font}</span>
                <span>Background: {preset.background}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="line-chart-container" style={{ marginTop: "16px" }}>
        <h3 className="chart-title">Audio Controls</h3>
        <div className="settings-grid">
          <div className="theme-card" style={{ cursor: "default" }}>
            <div className="theme-card-header" style={{ alignItems: "center" }}>
              <span className="theme-card-title">Enable Ambient Sound</span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(event) => setSoundEnabled(event.target.checked)}
                aria-label="Enable ambient sound"
              />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <span className="theme-card-title" style={{ fontSize: "13px" }}>
                Volume
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(event) => setSoundVolume(Number(event.target.value))}
                aria-label="Ambient sound volume"
              />
              <div className="theme-card-meta">
                <span>Current: {Math.round(soundVolume * 100)}%</span>
                <span>Range: 0 - 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

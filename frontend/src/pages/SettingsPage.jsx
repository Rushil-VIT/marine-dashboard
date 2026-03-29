import React from "react";
import { useTheme } from "../context/ThemeContext";

function SettingsPage() {
  const { theme, setTheme, presets } = useTheme();

  return (
    <div style={{ padding: "12px 16px 16px", height: "calc(100vh - 24px)" }}>
      <h1 className="page-title" style={{ padding: 0 }}>Settings</h1>

      <div className="line-chart-container" style={{ marginTop: "12px" }}>
        <h3 className="chart-title">Theme Presets</h3>
        <div className="settings-grid">
          {presets.map((preset) => (
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
    </div>
  );
}

export default SettingsPage;

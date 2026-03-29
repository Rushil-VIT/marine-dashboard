import React, { useMemo } from "react";
import { generateRecommendations } from "../utils/recommendationsEngine";

const SEVERITY_COLORS = {
  low: "#4caf50",
  medium: "#ffa500",
  high: "#ff4d4d",
};

function RecommendationPanel({
  isOpen,
  onClose,
  selectedSpill,
  allSpills,
  title = "Recommendations",
}) {
  const recommendations = useMemo(
    () => generateRecommendations({ selectedSpill, allSpills }),
    [selectedSpill, allSpills]
  );

  const panelStyle = {
    position: "absolute",
    top: "72px",
    right: "16px",
    width: "360px",
    maxHeight: "calc(100% - 96px)",
    background: "rgba(15, 23, 42, 0.92)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "14px",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.45)",
    padding: "16px",
    overflowY: "auto",
    transform: isOpen ? "translateX(0)" : "translateX(120%)",
    opacity: isOpen ? 1 : 0,
    transition: "transform 0.25s ease, opacity 0.25s ease",
    pointerEvents: isOpen ? "auto" : "none",
  };

  const wrapperStyle = {
    position: "absolute",
    inset: 0,
    zIndex: 1200,
    pointerEvents: "none",
  };

  return (
    <div style={wrapperStyle}>
      <div style={panelStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recommendations"
            style={{
              border: "none",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#e2e8f0",
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            x
          </button>
        </div>

        <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
          {recommendations.length === 0 ? (
            <p style={{ fontSize: "12px", opacity: 0.7, margin: 0 }}>
              No recommendations available for the current selection.
            </p>
          ) : (
            recommendations.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "12px",
                  background: "rgba(15, 23, 42, 0.6)",
                  display: "grid",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "999px",
                      background: SEVERITY_COLORS[item.severityLevel] || "#94a3b8",
                      boxShadow: "0 0 10px rgba(0, 0, 0, 0.35)",
                    }}
                  />
                  <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{item.title}</strong>
                </div>
                <span style={{ fontSize: "12px", color: "#cbd5f5" }}>{item.description}</span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{item.action}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default RecommendationPanel;

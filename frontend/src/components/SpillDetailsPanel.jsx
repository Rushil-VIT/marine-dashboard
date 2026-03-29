import React from "react";

/**
 * SpillDetailsPanel — Shows details for the selected spill marker.
 * When no spill is selected, shows instructions and legend.
 */
function SpillDetailsPanel({ selectedSpill, onClose }) {
  /* ─── No Selection State ─────────────────────────── */
  if (!selectedSpill) {
    return (
      <div className="spill-details-panel">
        <h3>Spill Details</h3>
        <p className="panel-instruction">
          Click a marker on the map to view spill details.
        </p>

        {/* Legend */}
        <div className="panel-legend">
          <h4>Severity Legend</h4>
          <div className="legend-item">
            <span className="legend-dot high"></span>
            Major
          </div>
          <div className="legend-item">
            <span className="legend-dot medium"></span>
            Moderate
          </div>
          <div className="legend-item">
            <span className="legend-dot low"></span>
            Minor
          </div>
        </div>
      </div>
    );
  }

  /* ─── Extract Properties ─────────────────────────── */
  const props = selectedSpill.properties;
  const coords = selectedSpill.geometry?.coordinates || [];
  const lng = coords[0]?.toFixed(4);
  const lat = coords[1]?.toFixed(4);

  /* ─── Severity Color ─────────────────────────────── */
  const severityClass =
    props.severity === "major"
      ? "severity-major"
      : props.severity === "moderate"
      ? "severity-moderate"
      : "severity-minor";

  /* ─── Status Color ───────────────────────────────── */
  const statusClass =
    props.status === "monitoring"
      ? "status-active"
      : props.status === "contained"
      ? "status-contained"
      : "status-cleaned";

  return (
    <div className="spill-details-panel">
      {/* Header */}
      <div className="panel-header">
        <h3>{props.title}</h3>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      {/* Severity Badge */}
      <span className={`severity-badge ${severityClass}`}>
        {props.severity?.toUpperCase()}
      </span>

      {/* Detail Rows */}
      <div className="detail-rows">
        <div className="detail-row">
          <span className="detail-label">Date</span>
          <span className="detail-value">
            {new Date(props.date).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Location</span>
          <span className="detail-value">{props.state}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Coordinates</span>
          <span className="detail-value">{lat}°N, {lng}°E</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Coast</span>
          <span className="detail-value" style={{ textTransform: "capitalize" }}>
            {props.coast}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Volume</span>
          <span className="detail-value">{props.estimated_volume_tonnes} tonnes</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Cause</span>
          <span className="detail-value" style={{ textTransform: "capitalize" }}>
            {props.cause}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Source</span>
          <span className="detail-value" style={{ textTransform: "capitalize" }}>
            {props.source_type}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Status</span>
          <span className={`status-badge ${statusClass}`}>
            {props.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Spill ID */}
      <div className="panel-footer">
        ID: {props.spill_id}
      </div>
    </div>
  );
}

export default SpillDetailsPanel;

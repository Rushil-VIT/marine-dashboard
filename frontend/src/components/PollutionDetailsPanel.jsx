import React from "react";

const severityClassMap = {
  high: "severity-high",
  medium: "severity-medium",
  low: "severity-low",
};

const effectivenessClassMap = {
  low: "effectiveness-low",
  moderate: "effectiveness-medium",
  high: "effectiveness-high",
};

function PollutionDetailsPanel({ selectedPollution, onClose }) {
  const renderPillList = (items) => {
    const list = Array.isArray(items) ? items : [];
    const visible = list.slice(0, 3);

    return (
      <div className="pollution-pill-list">
        {visible.map((item, index) => (
          <span key={`${item}-${index}`} className="pollution-pill">
            {item}
          </span>
        ))}
        {list.length > visible.length && (
          <span className="pollution-pill is-muted">
            +{list.length - visible.length} more
          </span>
        )}
      </div>
    );
  };

  if (!selectedPollution) {
    return (
      <div className="pollution-details-panel">
        <div className="panel-header">
          <h3>Pollution Details</h3>
        </div>
        <p className="panel-instruction">
          Click a marker on the map to review pollution site details.
        </p>

        <div className="pollution-legend">
          <h4>Severity Legend</h4>
          <div className="legend-item">
            <span className="legend-dot high"></span>
            High
          </div>
          <div className="legend-item">
            <span className="legend-dot medium"></span>
            Medium
          </div>
          <div className="legend-item">
            <span className="legend-dot low"></span>
            Low
          </div>
        </div>
      </div>
    );
  }

  const {
    id,
    location,
    type,
    severity,
    coordinates,
    causes,
    impact,
    methods_tried,
    solutions,
    effectiveness,
  } = selectedPollution;

  const [lng, lat] = Array.isArray(coordinates) ? coordinates : [];
  const severityClass = severityClassMap[severity] || "severity-low";
  const displayEffectiveness = effectiveness || "unknown";
  const effectivenessClass =
    effectivenessClassMap[effectiveness] || "effectiveness-medium";

  return (
    <div className="pollution-details-panel">
      <div className="panel-header">
        <h3>{location}</h3>
        <button className="panel-close" type="button" onClick={onClose}>
          x
        </button>
      </div>

      <span className={`severity-badge ${severityClass}`}>
        {severity?.toUpperCase()}
      </span>

      <div className="detail-rows">
        <div className="detail-row">
          <span className="detail-label">Type</span>
          <span className="detail-value">{type}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Coordinates</span>
          <span className="detail-value">
            {lat?.toFixed ? lat.toFixed(4) : "-"} deg N, {lng?.toFixed ? lng.toFixed(4) : "-"} deg E
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Effectiveness</span>
          <span className={`effectiveness-badge ${effectivenessClass}`}>
            {displayEffectiveness}
          </span>
        </div>
      </div>

      <div className="pollution-section">
        <h4>Causes</h4>
        {renderPillList(causes)}
      </div>

      <div className="pollution-section">
        <h4>Impact</h4>
        {renderPillList(impact)}
      </div>

      <div className="pollution-section">
        <h4>Methods Tried</h4>
        {renderPillList(methods_tried)}
      </div>

      <div className="pollution-section">
        <h4>Solutions</h4>
        {renderPillList(solutions)}
      </div>

      <div className="panel-footer">ID: {id}</div>
    </div>
  );
}

export default PollutionDetailsPanel;

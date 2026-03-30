import React from "react";

function PollutionStatsCards({ totalSites, highSeverityCount, dominantType }) {
  return (
    <div className="pollution-stats">
      <div className="stat-card">
        <h3>Total Sites</h3>
        <p className="stat-value">{totalSites}</p>
        <p className="stat-subtitle">Tracked locations</p>
      </div>

      <div className="stat-card">
        <h3>High Severity</h3>
        <p className="stat-value" style={{ color: "#ff4d4d" }}>
          {highSeverityCount}
        </p>
        <p className="stat-subtitle">Priority response</p>
      </div>

      <div className="stat-card">
        <h3>Dominant Type</h3>
        <p className="stat-value" style={{ fontSize: "18px" }}>
          {dominantType || "-"}
        </p>
        <p className="stat-subtitle">Most frequent source</p>
      </div>
    </div>
  );
}

export default PollutionStatsCards;

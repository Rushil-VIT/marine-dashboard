import React from "react";
import EnvironmentalImpact from "../components/EnvironmentalImpact";
import CleanupDashboard from "../components/CleanupDashboard";
import WeatherPanel from "../components/WeatherPanel";
import LayoutGrid from "../components/LayoutGrid";

/* Main analytics page component */
function AnalyticsPage() {
  return (
    <div className="analytics-page" style={{ padding: "12px 16px 16px" }}>
      {/* Page title */}
      <h1 className="page-title" style={{ padding: 0 }}>Analytics Overview</h1>

      {/* Content wrapper required by CSS */}
      <div className="analytics-content" style={{ padding: 0, marginTop: "12px" }}>
        <LayoutGrid minColumnWidth={320} gap="16px">
          {/* Environmental Impact Section */}
          <div className="analytics-section">
            <EnvironmentalImpact />
          </div>

          {/* Cleanup Section */}
          <div className="analytics-section">
            <CleanupDashboard />
          </div>

          {/* Weather Section */}
          <div className="analytics-section">
            <WeatherPanel />
          </div>
        </LayoutGrid>
      </div>
    </div>
  );
}

export default AnalyticsPage;
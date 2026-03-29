import React from "react";
import LayoutGrid from "../components/LayoutGrid";

function RecommendationsPage() {
  return (
    <div style={{ padding: "12px 16px 16px", height: "calc(100vh - 24px)" }}>
      <h1 className="page-title" style={{ padding: 0 }}>Recommendations</h1>

      <LayoutGrid minColumnWidth={360} gap="16px" style={{ marginTop: "12px" }}>
        <div className="line-chart-container">
          <h3 className="chart-title">Response Playbook</h3>
          <p style={{ fontSize: "13px", opacity: 0.8 }}>
            Automated guidance is currently unavailable.
          </p>
        </div>
      </LayoutGrid>
    </div>
  );
}

export default RecommendationsPage;

import React, { useMemo } from "react";
import { useSpillContext } from "../context/SpillContext";
import { generateInsights } from "../utils/insightsEngine";

function InsightsPanel() {
  const { filteredSpills, filteredStats, filteredTrends, loading } = useSpillContext();

  const insights = useMemo(
    () =>
      generateInsights({
        spills: filteredSpills,
        stats: filteredStats,
        trends: filteredTrends,
      }),
    [filteredSpills, filteredStats, filteredTrends]
  );

  return (
    <div className="line-chart-container">
      <h3 className="chart-title">Decision Insights</h3>
      {loading ? (
        <p style={{ fontSize: "13px", opacity: 0.8 }}>Loading insights...</p>
      ) : (
        <ul style={{ marginTop: "10px", paddingLeft: "18px", lineHeight: 1.6 }}>
          {insights.map((insight) => (
            <li key={insight.id} style={{ marginBottom: "8px" }}>
              <strong>{insight.title}:</strong> {insight.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InsightsPanel;

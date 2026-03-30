import React, { useMemo } from "react";
import { useSpillContext } from "../context/SpillContext";
import { generateInsightsByMode } from "../utils/insightsEngine";

function InsightsPanel() {
  const {
    dataMode,
    filteredSpills,
    filteredStats,
    filteredTrends,
    filteredPollutions,
    loading,
  } = useSpillContext();

  const isLoading = dataMode === "spills" ? loading : false;

  const insights = useMemo(
    () =>
      generateInsightsByMode({
        dataMode,
        spills: filteredSpills,
        stats: filteredStats,
        trends: filteredTrends,
        pollutions: filteredPollutions,
      }),
    [dataMode, filteredSpills, filteredStats, filteredTrends, filteredPollutions]
  );

  return (
    <div className="line-chart-container">
      <h3 className="chart-title">Decision Insights</h3>
      {isLoading ? (
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

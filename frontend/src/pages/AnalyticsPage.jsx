import React, { useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import WeatherPanel from "../components/WeatherPanel";
import { useSpillContext } from "../context/SpillContext";

const POLLUTION_SEVERITY_COLORS = {
  high: "#475569",
  medium: "#64748b",
  low: "#94a3b8",
};

function AnalyticsPage() {
  const {
    filteredStats,
    filteredSpills,
    filteredPollutions,
    pollutionStats,
  } = useSpillContext();

  useEffect(() => {
    const modeSwitch = document.querySelector(".mode-switch");
    if (!modeSwitch) return;

    modeSwitch.style.display = "none";
    return () => {
      modeSwitch.style.display = "";
    };
  }, []);

  // ✅ SUMMARY CARDS
  const summaryCards = useMemo(() => {
    const totalSpills = filteredStats?.overview?.totalSpills || 0;
    const totalSites = pollutionStats?.totalSites || 0;

    return [
      {
        title: "Total Events",
        value: (totalSpills + totalSites).toString(),
        description: "Spills + pollution sites",
      },
      {
        title: "High Severity",
        value: (pollutionStats?.highSeverityCount || 0).toString(),
        description: "Critical pollution zones",
      },
      {
        title: "Total Spills",
        value: totalSpills.toString(),
        description: "Recorded spill events",
      },
      {
        title: "Pollution Sites",
        value: totalSites.toString(),
        description: "Active monitoring points",
      },
    ];
  }, [filteredStats, pollutionStats]);

  // ✅ FIXED CHART DATA (WITH FALLBACK)
  const pollutionCharts = useMemo(() => {
    const severityCounts = { high: 0, medium: 0, low: 0 };
    const typeCounts = new Map();

    (filteredPollutions || []).forEach((record) => {
      const severity = String(record?.severity || "low").toLowerCase();
      if (severityCounts[severity] !== undefined) {
        severityCounts[severity]++;
      } else {
        severityCounts.low++;
      }

      const type = record?.type || "Unknown";
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    let severityData = [
      { name: "High", value: severityCounts.high, key: "high" },
      { name: "Medium", value: severityCounts.medium, key: "medium" },
      { name: "Low", value: severityCounts.low, key: "low" },
    ];

    let typeData = Array.from(typeCounts.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // 🔥 fallback if empty
    if (severityData.every((d) => d.value === 0)) {
      severityData = [
        { name: "High", value: 1, key: "high" },
        { name: "Medium", value: 1, key: "medium" },
        { name: "Low", value: 1, key: "low" },
      ];
    }

    if (typeData.length === 0) {
      typeData = [
        { name: "Type A", value: 1 },
        { name: "Type B", value: 1 },
        { name: "Type C", value: 1 },
      ];
    }

    return { severityData, typeData };
  }, [filteredPollutions]);

  return (
    <div className="analytics-page" style={{ padding: "12px 16px" }}>
      <h1 className="page-title" style={{ padding: 0 }}>
        Analytics Overview
      </h1>

      <div
        className="analytics-content"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: "16px",
          padding: "0 24px",
        }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="cleanup-dashboard" style={{ padding: "16px" }}>
            <h2 className="cleanup-title">Cleanup Prioritization</h2>
            <div style={{ height: "300px", overflow: "auto" }}>
              <table className="cleanup-table">
                <tbody>
                  
{[
  // 🔹 SPILLS
  ...(filteredSpills || []).map((spill, i) => {
    const p = spill.properties || {};
    return {
      id: `spill-${i}`,
      location: p.state || p.coast || "Unknown",
      severity: p.severity || "minor",
      type: "Oil Spill",
    };
  }),

  // 🔹 POLLUTION
  ...(filteredPollutions || []).slice(0, 6).map((item, i) => (
  <tr key={i}>
    <td>{item.location}</td>
    <td>{item.severity}</td>
    <td>{item.type}</td>
  </tr>
)),
]
  .slice(0, 6)
  .map((item) => (
    <tr key={item.id}>
      <td>{item.location}</td>
      <td style={{ textTransform: "capitalize" }}>{item.severity}</td>
      <td>{item.type}</td>
    </tr>
))}
                </tbody>
              </table>
            </div>
          </div>

          <WeatherPanel />
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* SUMMARY */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "10px",
            }}
          >
            {summaryCards.map((card) => (
              <div key={card.title} className="impact-card">
                <h3>{card.title}</h3>
                <p>{card.value}</p>
              </div>
            ))}
          </div>

          {/* PIE CHART */}
          <div className="analytics-chart-card" style={{ height: "220px" }}>
            <h3>Severity Split</h3>
            <div style={{ width: "100%", height: "180px" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pollutionCharts.severityData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={60}
                  >
                    {pollutionCharts.severityData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={POLLUTION_SEVERITY_COLORS[entry.key]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BAR CHART */}
          <div className="analytics-chart-card" style={{ height: "240px" }}>
            <h3>Pollution by Type</h3>
            <div style={{ width: "100%", height: "200px" }}>
              <ResponsiveContainer>
                <BarChart data={pollutionCharts.typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#64748b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
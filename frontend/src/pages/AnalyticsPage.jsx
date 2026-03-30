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

const SPILL_SEVERITY_SCORE = { major: 3, moderate: 2, minor: 1 };
const POLLUTION_SEVERITY_SCORE = { high: 3, medium: 2, low: 1 };
const POLLUTION_SEVERITY_COLORS = {
  high: "#475569",
  medium: "#64748b",
  low: "#94a3b8",
};

const getRecencyScore = (dateString) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 0;
  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30) return 3;
  if (days <= 90) return 2;
  if (days <= 180) return 1;
  return 0;
};

const getPriorityLabel = (score) => {
  if (score >= 7) return "Critical";
  if (score >= 5) return "High";
  if (score >= 3) return "Medium";
  return "Low";
};

/* Main analytics page component */
function AnalyticsPage() {
  const {
    filteredStats,
    filteredSpills,
    filteredPollutions,
    pollutionStats,
  } = useSpillContext();

  useEffect(() => {
    const modeSwitch = document.querySelector(".mode-switch");
    if (!modeSwitch) return undefined;

    const previous = {
      display: modeSwitch.style.display,
      opacity: modeSwitch.style.opacity,
    };

    modeSwitch.style.display = "none";
    modeSwitch.style.opacity = "0";

    return () => {
      modeSwitch.style.display = previous.display;
      modeSwitch.style.opacity = previous.opacity;
    };
  }, []);

  const summaryCards = useMemo(() => {
    const totalSpills = filteredStats?.overview?.totalSpills || 0;
    const majorSpillCount =
      filteredStats?.bySeverity?.find((entry) => entry.severity === "major")?.count || 0;
    const totalSites = pollutionStats?.totalSites || 0;
    const highSeveritySites = pollutionStats?.highSeverityCount || 0;
    const dominantType = pollutionStats?.dominantType || "-";
    const totalEvents = totalSpills + totalSites;
    const highPriorityEvents = majorSpillCount + highSeveritySites;

    return [
      {
        title: "Total Events",
        value: totalEvents.toString(),
        description: "Spills and pollution sites",
      },
      {
        title: "High Priority Events",
        value: highPriorityEvents.toString(),
        description: "Major spills + high severity sites",
      },
      {
        title: "Major Spill Incidents",
        value: majorSpillCount.toString(),
        description: "Highest impact spill events",
      },
      {
        title: "Dominant Pollution Source",
        value: dominantType,
        description: "Most frequent pollution type",
      },
    ];
  }, [filteredStats, pollutionStats]);

  const pollutionCharts = useMemo(() => {
    const severityCounts = { high: 0, medium: 0, low: 0 };
    const typeCounts = new Map();

    filteredPollutions.forEach((record) => {
      const severity = String(record?.severity || "low").toLowerCase();
      if (severityCounts[severity] !== undefined) {
        severityCounts[severity] += 1;
      } else {
        severityCounts.low += 1;
      }

      const type = record?.type || "Unknown";
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    const severityData = [
      { name: "High", value: severityCounts.high, key: "high" },
      { name: "Medium", value: severityCounts.medium, key: "medium" },
      { name: "Low", value: severityCounts.low, key: "low" },
    ];

    const typeData = Array.from(typeCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { severityData, typeData };
  }, [filteredPollutions]);

  const cleanupTasks = useMemo(() => {
    const maxVolume = filteredStats?.overview?.maxVolume || 0;

    const spillTasks = filteredSpills.map((spill, index) => {
      const props = spill.properties || {};
      const severityKey = String(props.severity || "minor").toLowerCase();
      const severityScore = SPILL_SEVERITY_SCORE[severityKey] || 1;
      const volume = Number(props.estimated_volume_tonnes || 0);
      const impactScore = maxVolume
        ? Math.max(1, Math.round((volume / maxVolume) * 3))
        : volume > 0
          ? 1
          : 0;
      const recencyScore = getRecencyScore(props.date);
      const priorityScore = severityScore + impactScore + recencyScore;

      return {
        id: `spill-${props.spill_id || props.id || index}`,
        location: props.state || props.coast || "Unknown",
        severity: severityKey,
        priority: getPriorityLabel(priorityScore),
        status: props.status || "monitoring",
        score: priorityScore,
      };
    });

    const pollutionTasks = filteredPollutions.map((record, index) => {
      const severityKey = String(record.severity || "low").toLowerCase();
      const severityScore = POLLUTION_SEVERITY_SCORE[severityKey] || 1;
      const impactCount = Array.isArray(record.impact) ? record.impact.length : 0;
      const impactScore = Math.min(3, impactCount || 1);
      const priorityScore = severityScore + impactScore;

      return {
        id: `pollution-${record.id || index}`,
        location: record.location || "Unknown",
        severity: severityKey,
        priority: getPriorityLabel(priorityScore),
        status: record.effectiveness || "unknown",
        score: priorityScore,
      };
    });

    return [...spillTasks, ...pollutionTasks]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [filteredSpills, filteredPollutions, filteredStats]);

  return (
    <div className="analytics-page" style={{ padding: "12px 16px 16px" }}>
      {/* Page title */}
      <h1 className="page-title" style={{ padding: 0 }}>Analytics Overview</h1>

      <div
        className="analytics-content"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: "16px",
          alignItems: "stretch",
          padding: "0 24px 24px",
          marginTop: "10px",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <div
          className="analytics-left"
          style={{
            gridColumn: "1",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <div
            className="cleanup-dashboard cleanup-prioritization"
            style={{
              height: "clamp(320px, 52vh, 520px)",
              maxWidth: "100%",
              overflow: "hidden",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
            }}
          >
            <h2 className="cleanup-title">Cleanup Prioritization</h2>
            <div className="cleanup-table-container" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <table className="cleanup-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Severity</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cleanupTasks.map((task) => (
                    <tr key={task.id} className="cleanup-row">
                      <td>{task.location}</td>
                      <td style={{ textTransform: "capitalize", color: "var(--muted)" }}>
                        {task.severity}
                      </td>
                      <td style={{ fontWeight: 600 }}>{task.priority}</td>
                      <td style={{ textTransform: "capitalize" }}>{task.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="analytics-weather-card" style={{ maxWidth: "100%", overflow: "hidden" }}>
            <WeatherPanel />
          </div>
        </div>

        <div
          className="analytics-right"
          style={{
            gridColumn: "2",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <div
            className="analytics-summary-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="impact-card analytics-summary-card"
                style={{
                  gridColumn: "span 3",
                  minHeight: "100px",
                  maxWidth: "100%",
                  padding: "10px",
                }}
              >
                <h3 className="impact-card-title">{card.title}</h3>
                <p className="impact-card-value">{card.value}</p>
                <p className="impact-card-description">{card.description}</p>
              </div>
            ))}
          </div>

          <div
            className="line-chart-container analytics-chart-card analytics-severity-chart"
            style={{
              padding: "10px",
              height: "200px",
              width: "100%",
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            <h3 className="chart-title" style={{ marginBottom: "10px" }}>Severity Split</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pollutionCharts.severityData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={60}
                  innerRadius={34}
                  paddingAngle={2}
                >
                  {pollutionCharts.severityData.map((entry) => (
                    <Cell key={entry.key} fill={POLLUTION_SEVERITY_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div
            className="line-chart-container analytics-chart-card analytics-type-chart"
            style={{
              padding: "10px",
              height: "200px",
              width: "100%",
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            <h3 className="chart-title" style={{ marginBottom: "10px" }}>Pollution by Type</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pollutionCharts.typeData} margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#e2e8f0"
                  tick={{ fontSize: 10, fill: "#e2e8f0" }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  stroke="#e2e8f0"
                  tick={{ fontSize: 10, fill: "#e2e8f0" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="value" fill="#64748b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <style>
          {`
            .analytics-content * {
              max-width: 100%;
            }

            .analytics-content .recharts-text,
            .analytics-content .recharts-cartesian-axis-tick-value {
              fill: #e2e8f0 !important;
            }

            @media (max-width: 1024px) {
              .analytics-content {
                grid-template-columns: 1fr;
              }

              .analytics-content .cleanup-prioritization {
                order: 1;
              }

              .analytics-content .analytics-right {
                order: 2;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default AnalyticsPage;
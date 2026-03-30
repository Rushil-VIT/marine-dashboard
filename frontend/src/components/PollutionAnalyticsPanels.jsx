import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useSpillContext } from "../context/SpillContext";

const TYPE_COLORS = ["#38bdf8", "#22d3ee", "#f59e0b", "#ef4444", "#a855f7", "#4ade80"];
const SEVERITY_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#4ade80" };

const buildPollutionAnalyticsData = (records) => {
  const typeCounts = new Map();
  const severityCounts = { high: 0, medium: 0, low: 0 };
  const locationCounts = new Map();

  records.forEach((record) => {
    const type = record.type || "Unknown";
    const severity = String(record.severity || "low").toLowerCase();
    const location = record.location || "Unknown";

    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    if (severityCounts[severity] !== undefined) severityCounts[severity] += 1;
    locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
  });

  const typeData = Array.from(typeCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const severityData = [
    { name: "High", value: severityCounts.high, key: "high" },
    { name: "Medium", value: severityCounts.medium, key: "medium" },
    { name: "Low", value: severityCounts.low, key: "low" },
  ];

  const locationDataRaw = Array.from(locationCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topLocations = locationDataRaw.slice(0, 6);
  const otherTotal = locationDataRaw.slice(6).reduce((sum, entry) => sum + entry.value, 0);
  const locationData = otherTotal > 0
    ? [...topLocations, { name: "Other", value: otherTotal }]
    : topLocations;

  return { typeData, severityData, locationData };
};

function PollutionAnalyticsPanels() {
  const { filteredPollutions } = useSpillContext();

  const { typeData, severityData, locationData } = useMemo(
    () => buildPollutionAnalyticsData(filteredPollutions),
    [filteredPollutions]
  );

  const hasData = filteredPollutions.length > 0;

  return (
    <>
      <div className="analytics-section">
        <div className="line-chart-container">
          <h3 className="chart-title">Pollution Type Distribution</h3>
          {!hasData ? (
            <p style={{ fontSize: "12px", opacity: 0.7 }}>
              No pollution data available for current filters.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={entry.name} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
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
          )}
        </div>
      </div>

      <div className="analytics-section">
        <div className="line-chart-container">
          <h3 className="chart-title">Severity Breakdown</h3>
          {!hasData ? (
            <p style={{ fontSize: "12px", opacity: 0.7 }}>
              No pollution data available for current filters.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={severityData} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                <XAxis dataKey="name" stroke="#e2e8f0" tick={{ fontSize: 11 }} />
                <YAxis stroke="#e2e8f0" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry) => (
                    <Cell key={entry.key} fill={SEVERITY_COLORS[entry.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="analytics-section">
        <div className="line-chart-container">
          <h3 className="chart-title">Location Comparison</h3>
          {!hasData ? (
            <p style={{ fontSize: "12px", opacity: 0.7 }}>
              No pollution data available for current filters.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={locationData} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
                <XAxis
                  dataKey="name"
                  stroke="#e2e8f0"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis stroke="#e2e8f0" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}

export default PollutionAnalyticsPanels;

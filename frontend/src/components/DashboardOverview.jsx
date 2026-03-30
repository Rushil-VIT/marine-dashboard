import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useSpillContext } from "../context/SpillContext";
import PollutionFilters from "./PollutionFilters";

/* Month names for chart labels */
const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/* Severity colors matching map */
const SEVERITY_COLORS = {
  major: "#ff4d4d",
  moderate: "#ffa500",
  minor: "#4caf50",
};

const POLLUTION_SEVERITY_COLORS = {
  high: "#64748b",
  medium: "#94a3b8",
  low: "#475569",
};

const POLLUTION_TYPE_COLORS = [
  "#94a3b8",
  "#7f8fa6",
  "#64748b",
  "#475569",
  "#334155",
];

/* Dashboard overview component — now data-driven */
function DashboardOverview() {
  const {
    dataMode,
    filteredStats,
    filteredTrends,
    loading,
    error,
    dateRange,
    setDateRange,
    severityFilter,
    setSeverityFilter,
    regionFilter,
    setRegionFilter,
    regionOptions,
    filteredPollutions,
    pollutionFilters,
    setPollutionFilters,
    pollutionOptions,
    pollutionStats,
  } = useSpillContext();

  const compactStatsGridStyle = {
    gridTemplateColumns: "repeat(7, minmax(110px, 1fr))",
    gap: "10px",
  };

  const compactPollutionGridStyle = {
    gridTemplateColumns: "repeat(6, minmax(110px, 1fr))",
    gap: "10px",
  };

  const compactCardStyle = { padding: "12px" };

  const pollutionAnalytics = useMemo(() => {
    const severityCounts = { high: 0, medium: 0, low: 0 };
    const typeCounts = new Map();
    let moderateCount = 0;
    let lowCount = 0;
    let indexSum = 0;
    let indexCount = 0;

    filteredPollutions.forEach((record) => {
      const severity = String(record?.severity || "low").toLowerCase();

      if (severity === "high") {
        severityCounts.high += 1;
        indexSum += 3;
        indexCount += 1;
      } else if (severity === "medium" || severity === "moderate") {
        severityCounts.medium += 1;
        moderateCount += 1;
        indexSum += 2;
        indexCount += 1;
      } else {
        severityCounts.low += 1;
        lowCount += 1;
        indexSum += 1;
        indexCount += 1;
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

    const avgIndex = indexCount ? (indexSum / indexCount).toFixed(1) : "0.0";

    return { severityData, typeData, moderateCount, lowCount, avgIndex };
  }, [filteredPollutions]);

  const updateDateRange = (key, value) => {
    setDateRange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleSeverity = (level) => {
    setSeverityFilter((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const handlePollutionFilterChange = (key, value) => {
    setPollutionFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (dataMode === "pollution") {
    return (
      <div className="dashboard-overview" style={{ gap: "12px" }}>
        <div
          className="dashboard-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            paddingBottom: "8px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
          }}
        >
          <div style={{ marginRight: "auto" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>
              Pollution Overview
            </h2>
          </div>
        </div>

        <PollutionFilters
          filters={pollutionFilters}
          options={pollutionOptions}
          onFilterChange={handlePollutionFilterChange}
        />

        <div className="stats-grid" style={compactPollutionGridStyle}>
          <div className="stat-card" style={compactCardStyle}>
            <h3>Total Sites</h3>
            <p className="stat-value">{pollutionStats.totalSites}</p>
            <p className="stat-subtitle">Tracked locations</p>
          </div>

          <div className="stat-card" style={compactCardStyle}>
            <h3>High Severity</h3>
            <p className="stat-value" style={{ color: "#ff4d4d" }}>
              {pollutionStats.highSeverityCount}
            </p>
            <p className="stat-subtitle">Priority response</p>
          </div>

          <div className="stat-card" style={compactCardStyle}>
            <h3>Dominant Type</h3>
            <p className="stat-value" style={{ fontSize: "clamp(14px, 2vw, 18px)" }}>
              {pollutionStats.dominantType || "-"}
            </p>
            <p className="stat-subtitle">Most frequent source</p>
          </div>

          <div className="stat-card" style={compactCardStyle}>
            <h3>Moderate Severity</h3>
            <p className="stat-value" style={{ color: "#f59e0b" }}>
              {pollutionAnalytics.moderateCount}
            </p>
            <p className="stat-subtitle">Watchlist locations</p>
          </div>

          <div className="stat-card" style={compactCardStyle}>
            <h3>Low Severity</h3>
            <p className="stat-value" style={{ color: "#4ade80" }}>
              {pollutionAnalytics.lowCount}
            </p>
            <p className="stat-subtitle">Lower priority sites</p>
          </div>

          <div className="stat-card" style={compactCardStyle}>
            <h3>Avg Pollution Index</h3>
            <p className="stat-value">{pollutionAnalytics.avgIndex}</p>
            <p className="stat-subtitle">Derived severity score</p>
          </div>
        </div>

        <div
          className="dashboard-charts-row"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <div
            className="line-chart-container"
            style={{ padding: "16px", height: "clamp(180px, 28vw, 220px)" }}
          >
            <h3 className="chart-title" style={{ marginBottom: "12px" }}>Severity Split</h3>
            {filteredPollutions.length === 0 ? (
              <p style={{ fontSize: "12px", opacity: 0.7 }}>
                No pollution data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pollutionAnalytics.severityData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={50}
                    innerRadius={28}
                    paddingAngle={2}
                  >
                    {pollutionAnalytics.severityData.map((entry) => (
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
            )}
          </div>

          <div
            className="line-chart-container"
            style={{ padding: "16px", height: "clamp(180px, 28vw, 220px)" }}
          >
            <h3 className="chart-title" style={{ marginBottom: "12px" }}>Pollution by Type</h3>
            {filteredPollutions.length === 0 ? (
              <p style={{ fontSize: "12px", opacity: 0.7 }}>
                No pollution data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pollutionAnalytics.typeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {pollutionAnalytics.typeData.map((entry, index) => (
                      <Cell key={entry.name} fill={POLLUTION_TYPE_COLORS[index % POLLUTION_TYPE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Loading / Error ────────────────────────────── */
  if (loading) {
    return (
      <div className="dashboard-overview">
        <p>Loading dashboard data...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="dashboard-overview">
        <p style={{ color: "#ff4d4d" }}>Error: {error}</p>
      </div>
    );
  }

  /* ─── Extract Stats ──────────────────────────────── */
  const overview = filteredStats?.overview || {};
  const bySeverity = filteredStats?.bySeverity || [];
  const byCoast = filteredStats?.byCoast || [];
  const byStatus = filteredStats?.byStatus || [];

  const totalSpills = overview.totalSpills || 0;
  const totalVolume = overview.totalVolume || 0;
  const avgVolume = Math.round(overview.avgVolume || 0);

  const majorCount = bySeverity.find((s) => s.severity === "major")?.count || 0;
  const monitoringCount = byStatus.find((s) => s.status === "monitoring")?.count || 0;
  const activeCount = byStatus.find((s) => s.status === "active")?.count || 0;
  const containedCount = byStatus.find((s) => s.status === "contained")?.count || 0;

  /* ─── Prepare Trend Data for Chart ───────────────── */
  const trendChartData = filteredTrends.map((t) => ({
    label: `${MONTH_NAMES[t.month] || ""} ${t.year}`,
    spills: t.totalSpills,
    volume: t.totalVolume,
  }));

  /* ─── Severity Bar Data ──────────────────────────── */
  const severityData = bySeverity.map((s) => ({
    name: s.severity?.charAt(0).toUpperCase() + s.severity?.slice(1),
    count: s.count,
    volume: s.totalVolume,
    fill: SEVERITY_COLORS[s.severity] || "#4caf50",
  }));

  return (
    <div className="dashboard-overview" style={{ gap: "12px" }}>

        <div
          className="dashboard-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            paddingBottom: "8px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
          }}
        >
        <div
          className="dashboard-toolbar-inner"
          style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", width: "100%" }}
        >
          <div style={{ marginRight: "auto" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>Analysis Tools</h2>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Timeframe</span>
            <input
              id="dashboard-date-start"
              type="date"
              value={dateRange.start}
              max={dateRange.end || undefined}
              onChange={(event) => updateDateRange("start", event.target.value)}
              aria-label="Dashboard start date"
            />
            <span style={{ color: "#475569" }}>—</span>
            <input
              id="dashboard-date-end"
              type="date"
              value={dateRange.end}
              min={dateRange.start || undefined}
              onChange={(event) => updateDateRange("end", event.target.value)}
              aria-label="Dashboard end date"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginLeft: "12px" }}>Severity</span>
            {["major", "moderate", "minor"].map((level) => (
              <button
                key={level}
                className={`map-toggle-btn ${severityFilter?.[level] ? "active" : ""}`}
                onClick={() => toggleSeverity(level)}
                aria-pressed={severityFilter?.[level] ? "true" : "false"}
                style={{ padding: "4px 10px", fontSize: "12px" }}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginLeft: "12px" }}>State</span>
            <select
              id="dashboard-region-filter"
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              aria-label="Dashboard state filter"
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#ffffff",
                fontSize: "12px",
              }}
            >
              <option value="all">All states</option>
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== STATISTICS SECTION ===== */}
      <div className="stats-grid" style={compactStatsGridStyle}>

        <div className="stat-card" style={compactCardStyle}>
          <h3>Total Spills</h3>
          <p className="stat-value">{totalSpills}</p>
          <p className="stat-subtitle">Recorded incidents</p>
        </div>

        <div className="stat-card" style={compactCardStyle}>
          <h3>Major Severity</h3>
          <p className="stat-value" style={{ color: "#ff4d4d" }}>{majorCount}</p>
          <p className="stat-subtitle">Critical incidents</p>
        </div>

        <div className="stat-card" style={compactCardStyle}>
          <h3>Total Volume</h3>
          <p className="stat-value">{totalVolume.toLocaleString()} t</p>
          <p className="stat-subtitle">Estimated oil spilled</p>
        </div>

        <div className="stat-card" style={compactCardStyle}>
          <h3>Avg Volume</h3>
          <p className="stat-value">{avgVolume} t</p>
          <p className="stat-subtitle">Per incident average</p>
        </div>

        <div className="stat-card" style={compactCardStyle}>
          <h3>Active Monitoring</h3>
          <p className="stat-value" style={{ color: "#ffa500" }}>{monitoringCount}</p>
          <p className="stat-subtitle">Currently being tracked</p>
        </div>

        <div className="stat-card" style={compactCardStyle}>
          <h3>Active Spills</h3>
          <p className="stat-value" style={{ color: "#38bdf8" }}>{activeCount}</p>
          <p className="stat-subtitle">Ongoing incidents</p>
        </div>

        <div className="stat-card" style={compactCardStyle}>
          <h3>Contained Spills</h3>
          <p className="stat-value" style={{ color: "#4ade80" }}>{containedCount}</p>
          <p className="stat-subtitle">Stabilized sites</p>
        </div>

      </div>

      <div className="dashboard-charts-row" style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
        {/* ===== TRENDS CHART ===== */}
        <div
          className="line-chart-container"
          style={{ flex: 7, padding: "16px", height: "clamp(220px, 36vw, 320px)" }}
        >
          <h3 className="chart-title" style={{ marginBottom: "12px" }}>Spill Timeline</h3>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis
                dataKey="label"
                stroke="#ffffff"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#ffffff" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#021b79",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#00f2fe" }}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#00f2fe"
                strokeWidth={3}
                dot={{ r: 5, fill: "#00f2fe" }}
                activeDot={{ r: 7 }}
                name="Volume (tonnes)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ===== SEVERITY BREAKDOWN CHART ===== */}
        <div
          className="line-chart-container"
          style={{ flex: 3, padding: "16px", height: "clamp(200px, 30vw, 260px)" }}
        >
          <h3 className="chart-title" style={{ marginBottom: "12px" }}>Severity Breakdown</h3>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={severityData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis dataKey="name" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#021b79",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#00f2fe" }}
              />
              <Bar dataKey="count" name="Incidents" radius={[6, 6, 0, 0]}>
                {severityData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

export default DashboardOverview;
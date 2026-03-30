import React from "react";
import {
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
import PollutionStatsCards from "./PollutionStatsCards";

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
    pollutionFilters,
    setPollutionFilters,
    pollutionOptions,
    pollutionStats,
  } = useSpillContext();

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
      <div className="dashboard-overview">
        <div
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

        <PollutionStatsCards
          totalSites={pollutionStats.totalSites}
          highSeverityCount={pollutionStats.highSeverityCount}
          dominantType={pollutionStats.dominantType}
        />
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
    <div className="dashboard-overview">

      <div
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", width: "100%" }}>
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
      <div className="stats-grid">

        <div className="stat-card">
          <h3>Total Spills</h3>
          <p className="stat-value">{totalSpills}</p>
          <p className="stat-subtitle">Recorded incidents</p>
        </div>

        <div className="stat-card">
          <h3>Major Severity</h3>
          <p className="stat-value" style={{ color: "#ff4d4d" }}>{majorCount}</p>
          <p className="stat-subtitle">Critical incidents</p>
        </div>

        <div className="stat-card">
          <h3>Total Volume</h3>
          <p className="stat-value">{totalVolume.toLocaleString()} t</p>
          <p className="stat-subtitle">Estimated oil spilled</p>
        </div>

        <div className="stat-card">
          <h3>Avg Volume</h3>
          <p className="stat-value">{avgVolume} t</p>
          <p className="stat-subtitle">Per incident average</p>
        </div>

        <div className="stat-card">
          <h3>Active Monitoring</h3>
          <p className="stat-value" style={{ color: "#ffa500" }}>{monitoringCount}</p>
          <p className="stat-subtitle">Currently being tracked</p>
        </div>

      </div>

      <div style={{ display: "flex", gap: "16px", alignItems: "stretch" }}>
        {/* ===== TRENDS CHART ===== */}
        <div className="line-chart-container" style={{ flex: 7 }}>
          <h3 className="chart-title">Spill Timeline</h3>

          <ResponsiveContainer width="100%" height={300}>
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
        <div className="line-chart-container" style={{ flex: 3 }}>
          <h3 className="chart-title">Severity Breakdown</h3>

          <ResponsiveContainer width="100%" height={250}>
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
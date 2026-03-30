import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { fetchAllSpills, fetchSpillTrends, fetchSpillStats } from "../api/spillService";
import pollutionData from "../data/pollutions.json";

/**
 * SpillContext — Global state for spill data, stats, trends, and selection.
 * Fetches data once on mount. Provides selectedSpill for map ↔ panel sync.
 */
const SpillContext = createContext(null);

const parseDateToUtc = (value) => {
  if (!value || typeof value !== "string") return null;
  const parts = value.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  const [year, month, day] = parts;
  return Date.UTC(year, month - 1, day);
};

const normalize = (value) => (value || "").toString().trim().toLowerCase();

export function SpillProvider({ children }) {
  const [spills, setSpills] = useState([]);
  const [dataMode, setDataMode] = useState("spills");
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [selectedSpill, setSelectedSpill] = useState(null);
  const [selectedPollution, setSelectedPollution] = useState(null);
  const [severityFilter, setSeverityFilter] = useState({
    major: true,
    moderate: true,
    minor: true,
  });
  const [pollutionFilters, setPollutionFilters] = useState({
    type: "all",
    severity: "all",
    location: "all",
  });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [regionFilter, setRegionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [spillsRes, statsRes, trendsRes] = await Promise.all([
          fetchAllSpills(),
          fetchSpillStats(),
          fetchSpillTrends(),
        ]);

        setSpills(spillsRes.data.data || []);
        setStats(statsRes.data.data || null);
        setTrends(trendsRes.data.data || []);
      } catch (err) {
        console.error("SpillContext fetch error:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const dateRangeMs = useMemo(() => {
    const startMs = parseDateToUtc(dateRange.start);
    const endMs = parseDateToUtc(dateRange.end);
    return { startMs, endMs };
  }, [dateRange]);

  const pollutionRecords = useMemo(
    () => (Array.isArray(pollutionData) ? pollutionData : []),
    []
  );

  const filteredSpills = useMemo(() => {
    const { startMs, endMs } = dateRangeMs;

    return spills.filter((spill) => {
      const dateMs = parseDateToUtc(spill.properties?.date);
      if (dateMs === null) return false;
      if (startMs !== null && dateMs < startMs) return false;
      if (endMs !== null && dateMs > endMs) return false;

      const severity = spill.properties?.severity || "minor";
      if (severityFilter?.[severity] === false) return false;

      const region = spill.properties?.state || "Unknown";
      if (regionFilter !== "all" && region !== regionFilter) return false;

      return true;
    });
  }, [spills, dateRangeMs, severityFilter, regionFilter]);

  const regionOptions = useMemo(() => {
    const regions = new Set();
    spills.forEach((spill) => {
      const region = spill.properties?.state || "Unknown";
      regions.add(region);
    });
    return Array.from(regions).sort((a, b) => a.localeCompare(b));
  }, [spills]);

  const pollutionOptions = useMemo(() => {
    const types = new Set();
    const severities = new Set();
    const locations = new Set();

    pollutionRecords.forEach((record) => {
      if (record.type) types.add(record.type);
      if (record.severity) severities.add(record.severity);
      if (record.location) locations.add(record.location);
    });

    return {
      typeOptions: Array.from(types).sort((a, b) => a.localeCompare(b)),
      severityOptions: Array.from(severities).sort((a, b) => a.localeCompare(b)),
      locationOptions: Array.from(locations).sort((a, b) => a.localeCompare(b)),
    };
  }, [pollutionRecords]);

  const filteredPollutions = useMemo(() => {
    return pollutionRecords.filter((record) => {
      const matchesType =
        pollutionFilters.type === "all" ||
        normalize(record.type) === normalize(pollutionFilters.type);
      const matchesSeverity =
        pollutionFilters.severity === "all" ||
        normalize(record.severity) === normalize(pollutionFilters.severity);
      const matchesLocation =
        pollutionFilters.location === "all" ||
        normalize(record.location) === normalize(pollutionFilters.location);

      return matchesType && matchesSeverity && matchesLocation;
    });
  }, [pollutionRecords, pollutionFilters]);

  const pollutionStats = useMemo(() => {
    const typeCounts = new Map();
    let highSeverityCount = 0;

    filteredPollutions.forEach((record) => {
      const severity = normalize(record.severity);
      if (severity === "high") highSeverityCount += 1;

      const type = record.type || "Unknown";
      const current = typeCounts.get(type) || 0;
      typeCounts.set(type, current + 1);
    });

    let dominantType = "-";
    let dominantCount = 0;

    typeCounts.forEach((count, type) => {
      if (count > dominantCount) {
        dominantCount = count;
        dominantType = type;
      }
    });

    return {
      totalSites: filteredPollutions.length,
      highSeverityCount,
      dominantType,
    };
  }, [filteredPollutions]);

  const filteredStats = useMemo(() => {
    const overview = {
      totalSpills: filteredSpills.length,
      totalVolume: 0,
      avgVolume: 0,
      maxVolume: 0,
    };
    const bySeverityMap = new Map();
    const byCoastMap = new Map();
    const byStatusMap = new Map();
    const byCauseMap = new Map();

    filteredSpills.forEach((spill) => {
      const props = spill.properties || {};
      const volume = Number(props.estimated_volume_tonnes || 0);

      overview.totalVolume += volume;
      if (volume > overview.maxVolume) {
        overview.maxVolume = volume;
      }

      const severity = props.severity || "minor";
      const severityEntry = bySeverityMap.get(severity) || {
        severity,
        count: 0,
        totalVolume: 0,
      };
      severityEntry.count += 1;
      severityEntry.totalVolume += volume;
      bySeverityMap.set(severity, severityEntry);

      const coast = props.coast || "unknown";
      const coastEntry = byCoastMap.get(coast) || { coast, count: 0 };
      coastEntry.count += 1;
      byCoastMap.set(coast, coastEntry);

      const status = props.status || "unknown";
      const statusEntry = byStatusMap.get(status) || { status, count: 0 };
      statusEntry.count += 1;
      byStatusMap.set(status, statusEntry);

      const cause = props.cause || "unknown";
      const causeEntry = byCauseMap.get(cause) || { cause, count: 0 };
      causeEntry.count += 1;
      byCauseMap.set(cause, causeEntry);
    });

    overview.avgVolume = overview.totalSpills
      ? overview.totalVolume / overview.totalSpills
      : 0;

    return {
      overview,
      bySeverity: Array.from(bySeverityMap.values()),
      byCoast: Array.from(byCoastMap.values()),
      byStatus: Array.from(byStatusMap.values()),
      byCause: Array.from(byCauseMap.values()),
    };
  }, [filteredSpills]);

  const filteredTrends = useMemo(() => {
    const trendMap = new Map();

    filteredSpills.forEach((spill) => {
      const dateMs = parseDateToUtc(spill.properties?.date);
      if (dateMs === null) return;

      const date = new Date(dateMs);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const key = `${year}-${month}`;
      const volume = Number(spill.properties?.estimated_volume_tonnes || 0);
      const severity = spill.properties?.severity || "minor";

      const entry = trendMap.get(key) || {
        year,
        month,
        totalSpills: 0,
        totalVolume: 0,
        severityBreakdown: { major: 0, moderate: 0, minor: 0 },
      };

      entry.totalSpills += 1;
      entry.totalVolume += volume;
      if (entry.severityBreakdown[severity] !== undefined) {
        entry.severityBreakdown[severity] += 1;
      }

      trendMap.set(key, entry);
    });

    return Array.from(trendMap.values()).sort(
      (a, b) => a.year - b.year || a.month - b.month
    );
  }, [filteredSpills]);

  useEffect(() => {
    const selectedId = selectedSpill?.properties?.spill_id;
    if (!selectedId) return;

    const stillVisible = filteredSpills.some(
      (spill) => spill.properties?.spill_id === selectedId
    );

    if (!stillVisible) {
      setSelectedSpill(null);
    }
  }, [filteredSpills, selectedSpill, setSelectedSpill]);

  useEffect(() => {
    if (!selectedPollution) return;

    const stillVisible = filteredPollutions.some(
      (record) => record.id === selectedPollution.id
    );

    if (!stillVisible) {
      setSelectedPollution(null);
    }
  }, [filteredPollutions, selectedPollution]);

  useEffect(() => {
    if (dataMode === "pollution") {
      setSelectedSpill(null);
    } else {
      setSelectedPollution(null);
    }
  }, [dataMode]);

  const value = {
    spills,
    dataMode,
    setDataMode,
    stats,
    trends,
    selectedSpill,
    setSelectedSpill,
    selectedPollution,
    setSelectedPollution,
    severityFilter,
    setSeverityFilter,
    pollutionFilters,
    setPollutionFilters,
    dateRange,
    setDateRange,
    regionFilter,
    setRegionFilter,
    regionOptions,
    pollutionOptions,
    filteredSpills,
    filteredPollutions,
    filteredStats,
    filteredTrends,
    pollutionStats,
    loading,
    error,
  };

  return (
    <SpillContext.Provider value={value}>
      {children}
    </SpillContext.Provider>
  );
}

/**
 * Custom hook to consume SpillContext.
 * Throws if used outside SpillProvider.
 */
export function useSpillContext() {
  const context = useContext(SpillContext);
  if (!context) {
    throw new Error("useSpillContext must be used within a SpillProvider");
  }
  return context;
}

const SEVERITY_WEIGHTS = {
  major: 3,
  moderate: 2,
  minor: 1,
};

const getSeverityWeight = (severity) => SEVERITY_WEIGHTS[severity] || 1;

const formatPercent = (value) => `${Math.abs(Math.round(value))}%`;

const buildRegionStats = (spills) => {
  const map = new Map();

  spills.forEach((spill) => {
    const props = spill.properties || {};
    const region = props.state || "Unknown";
    const severity = props.severity || "minor";
    const volume = Number(props.estimated_volume_tonnes || 0);

    const entry = map.get(region) || {
      region,
      riskScore: 0,
      count: 0,
      majorCount: 0,
      totalVolume: 0,
    };

    entry.count += 1;
    entry.totalVolume += volume;
    entry.riskScore += getSeverityWeight(severity);
    if (severity === "major") entry.majorCount += 1;

    map.set(region, entry);
  });

  return Array.from(map.values());
};

const computeTrendDelta = (trends) => {
  if (!Array.isArray(trends) || trends.length < 2) return null;

  const sorted = [...trends].sort(
    (a, b) => a.year - b.year || a.month - b.month
  );

  const sliceWindow = (windowSize) => {
    if (sorted.length < windowSize * 2) return null;
    const recent = sorted.slice(-windowSize);
    const prior = sorted.slice(-windowSize * 2, -windowSize);
    const recentCount = recent.reduce((sum, t) => sum + (t.totalSpills || 0), 0);
    const priorCount = prior.reduce((sum, t) => sum + (t.totalSpills || 0), 0);
    return { recentCount, priorCount, windowSize };
  };

  let windowData = sliceWindow(6);
  if (!windowData) windowData = sliceWindow(3);
  if (!windowData) {
    const last = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    return {
      recentCount: last.totalSpills || 0,
      priorCount: previous.totalSpills || 0,
      windowSize: 1,
    };
  }

  return windowData;
};

const computeMajorClusters = (spills) => {
  const majors = spills.filter((spill) => spill.properties?.severity === "major");
  if (majors.length < 3) return null;

  const cellSize = 0.75;
  const clusters = new Map();

  majors.forEach((spill) => {
    const coords = spill.geometry?.coordinates || [];
    if (coords.length !== 2) return;
    const latKey = Math.floor(coords[1] / cellSize);
    const lngKey = Math.floor(coords[0] / cellSize);
    const key = `${latKey}:${lngKey}`;

    const entry = clusters.get(key) || { count: 0, spills: [] };
    entry.count += 1;
    entry.spills.push(spill);
    clusters.set(key, entry);
  });

  let strongest = null;
  clusters.forEach((entry) => {
    if (!strongest || entry.count > strongest.count) {
      strongest = entry;
    }
  });

  if (!strongest || strongest.count < 3) return null;

  const regionCounts = new Map();
  strongest.spills.forEach((spill) => {
    const region = spill.properties?.state || "Unknown";
    regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
  });

  let region = "Unknown";
  let bestCount = 0;
  regionCounts.forEach((count, key) => {
    if (count > bestCount) {
      bestCount = count;
      region = key;
    }
  });

  return { count: strongest.count, region };
};

const computeImpactScores = (stats, spills) => {
  const overview = stats?.overview || {};
  const bySeverity = stats?.bySeverity || [];
  const totalVolume = Number(overview.totalVolume || 0);
  const totalSpills = Number(overview.totalSpills || spills.length || 0);
  const majorCount =
    bySeverity.find((entry) => entry.severity === "major")?.count ||
    spills.filter((spill) => spill.properties?.severity === "major").length;

  const severityRiskScore = spills.reduce(
    (sum, spill) => sum + getSeverityWeight(spill.properties?.severity),
    0
  );

  const majorShare = totalSpills ? majorCount / totalSpills : 0;
  const impactScore = totalVolume * (1 + majorShare);

  return {
    severityRiskScore,
    impactScore,
    totalVolume,
    majorShare,
  };
};

export const generateInsights = ({ spills, stats, trends }) => {
  if (!Array.isArray(spills) || spills.length === 0) {
    return [
      {
        id: "no-data",
        title: "No active insights",
        description: "Adjust filters to include spills and generate insights.",
      },
    ];
  }

  const insights = [];
  const regionStats = buildRegionStats(spills);
  regionStats.sort((a, b) => b.riskScore - a.riskScore);

  if (regionStats.length > 0) {
    const top = regionStats[0];
    const baseline = regionStats[1];
    const averageRisk =
      regionStats.reduce((sum, entry) => sum + entry.riskScore, 0) /
      regionStats.length;

    if (baseline && baseline.riskScore > 0) {
      const pct = ((top.riskScore - baseline.riskScore) / baseline.riskScore) * 100;
      insights.push({
        id: "risk-region",
        title: "High-risk region",
        description: `${top.region} shows ${formatPercent(pct)} higher severity-weighted risk than ${baseline.region}.`,
      });
    } else if (averageRisk > 0) {
      const pct = ((top.riskScore - averageRisk) / averageRisk) * 100;
      insights.push({
        id: "risk-region",
        title: "High-risk region",
        description: `${top.region} exceeds the average severity-weighted risk by ${formatPercent(pct)}.`,
      });
    }
  }

  const trendDelta = computeTrendDelta(trends);
  if (trendDelta) {
    const { recentCount, priorCount, windowSize } = trendDelta;
    const windowLabel = windowSize === 1 ? "last month" : `last ${windowSize} months`;

    if (priorCount === 0 && recentCount > 0) {
      insights.push({
        id: "trend-change",
        title: "Rising frequency",
        description: `Spill frequency rose from zero to ${recentCount} incidents in the ${windowLabel}.`,
      });
    } else if (priorCount > 0) {
      const pct = ((recentCount - priorCount) / priorCount) * 100;
      if (Math.abs(pct) < 5) {
        insights.push({
          id: "trend-change",
          title: "Stable frequency",
          description: `Spill frequency is steady over the ${windowLabel}.`,
        });
      } else if (pct > 0) {
        insights.push({
          id: "trend-change",
          title: "Increasing frequency",
          description: `Spill frequency increased by ${formatPercent(pct)} over the ${windowLabel}.`,
        });
      } else {
        insights.push({
          id: "trend-change",
          title: "Decreasing frequency",
          description: `Spill frequency dropped by ${formatPercent(pct)} over the ${windowLabel}.`,
        });
      }
    }
  }

  const cluster = computeMajorClusters(spills);
  if (cluster) {
    insights.push({
      id: "major-cluster",
      title: "Major spill cluster",
      description: `${cluster.count} major spills are concentrated near ${cluster.region}.`,
    });
  }

  const impact = computeImpactScores(stats, spills);
  const impactScoreRounded = Math.round(impact.impactScore);
  const riskScoreRounded = Math.round(impact.severityRiskScore);
  const majorSharePercent = Math.round(impact.majorShare * 100);

  insights.push({
    id: "impact-score",
    title: "Impact score",
    description: `Impact score ${impactScoreRounded.toLocaleString()} based on ${impact.totalVolume.toLocaleString()} tonnes and ${majorSharePercent}% major severity.`,
  });
  insights.push({
    id: "risk-score",
    title: "Risk score",
    description: `Severity-weighted risk score totals ${riskScoreRounded.toLocaleString()} across filtered incidents.`,
  });

  return insights;
};

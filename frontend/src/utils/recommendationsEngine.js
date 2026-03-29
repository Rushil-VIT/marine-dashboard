const RULES = {
  severityMajor: {
    title: "Major severity response",
    severityLevel: "high",
    description: (spill) => {
      const title = spill?.properties?.title || "Selected spill";
      return `${title} is classified as major severity.`;
    },
    action: "Activate high-priority containment and shoreline protection protocols.",
  },
  largeVolume: {
    title: "Large-scale containment",
    severityLevel: "high",
    description: (spill) => {
      const volume = Number(spill?.properties?.estimated_volume_tonnes || 0);
      return `Estimated spill volume is ${volume.toLocaleString()} tonnes.`;
    },
    action: "Deploy extended containment booms and expand skimming operations.",
  },
  eastCoast: {
    title: "Ecosystem monitoring",
    severityLevel: "medium",
    description: (spill) => {
      const coast = spill?.properties?.coast || "Unknown coast";
      return `${coast} coast exposure requires sensitive habitat monitoring.`;
    },
    action: "Initiate shoreline surveys and biodiversity impact assessments.",
  },
};

const normalizeCoast = (coast) => String(coast || "").trim().toLowerCase();

const buildRecommendation = ({ title, severityLevel, description, action }) => ({
  title,
  severityLevel,
  description,
  action,
});

const generateSpillRecommendations = (spill) => {
  if (!spill) return [];

  const props = spill.properties || {};
  const recommendations = [];

  if (props.severity === "major") {
    recommendations.push(
      buildRecommendation({
        title: RULES.severityMajor.title,
        severityLevel: RULES.severityMajor.severityLevel,
        description: RULES.severityMajor.description(spill),
        action: RULES.severityMajor.action,
      })
    );
  }

  if (Number(props.estimated_volume_tonnes || 0) > 200) {
    recommendations.push(
      buildRecommendation({
        title: RULES.largeVolume.title,
        severityLevel: RULES.largeVolume.severityLevel,
        description: RULES.largeVolume.description(spill),
        action: RULES.largeVolume.action,
      })
    );
  }

  if (normalizeCoast(props.coast) === "east") {
    recommendations.push(
      buildRecommendation({
        title: RULES.eastCoast.title,
        severityLevel: RULES.eastCoast.severityLevel,
        description: RULES.eastCoast.description(spill),
        action: RULES.eastCoast.action,
      })
    );
  }

  return recommendations;
};

const summarizeCoastImpact = (spills) => {
  const coastCounts = new Map();

  spills.forEach((spill) => {
    const coast = spill?.properties?.coast || "Unknown";
    coastCounts.set(coast, (coastCounts.get(coast) || 0) + 1);
  });

  let topCoast = null;
  let topCount = 0;
  coastCounts.forEach((count, coast) => {
    if (count > topCount) {
      topCount = count;
      topCoast = coast;
    }
  });

  if (!topCoast) return null;

  return buildRecommendation({
    title: "Most affected coastline",
    severityLevel: "medium",
    description: `${topCoast} has the highest spill concentration (${topCount} incidents).`,
    action: `Prioritize shoreline monitoring and response assets along the ${topCoast} coast.`,
  });
};

const summarizeSeverityDistribution = (spills) => {
  const counts = { major: 0, moderate: 0, minor: 0 };

  spills.forEach((spill) => {
    const severity = spill?.properties?.severity || "minor";
    if (counts[severity] !== undefined) counts[severity] += 1;
  });

  const description = `Major: ${counts.major}, Moderate: ${counts.moderate}, Minor: ${counts.minor}.`;

  return buildRecommendation({
    title: "Severity distribution",
    severityLevel: counts.major > 0 ? "high" : "medium",
    description,
    action: "Align response capacity with the prevailing severity mix.",
  });
};

const summarizeTrend = (spills) => {
  const monthly = new Map();

  spills.forEach((spill) => {
    const dateString = spill?.properties?.date;
    if (!dateString) return;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    monthly.set(key, (monthly.get(key) || 0) + 1);
  });

  const sorted = Array.from(monthly.entries()).sort(([a], [b]) => a.localeCompare(b));
  if (sorted.length < 2) return null;

  const [prevMonth, prevCount] = sorted[sorted.length - 2];
  const [lastMonth, lastCount] = sorted[sorted.length - 1];
  const delta = lastCount - prevCount;

  let trend = "stable";
  if (delta > 0) trend = "increasing";
  if (delta < 0) trend = "declining";

  return buildRecommendation({
    title: "Incident trend",
    severityLevel: trend === "increasing" ? "medium" : "low",
    description: `Monthly spills are ${trend} (${prevMonth}: ${prevCount}, ${lastMonth}: ${lastCount}).`,
    action: "Adjust monitoring cadence based on the latest trend direction.",
  });
};

const generateGeneralRecommendations = (spills) => {
  if (!Array.isArray(spills) || spills.length === 0) return [];

  const recommendations = [];
  const coastSummary = summarizeCoastImpact(spills);
  if (coastSummary) recommendations.push(coastSummary);

  recommendations.push(summarizeSeverityDistribution(spills));

  const trendSummary = summarizeTrend(spills);
  if (trendSummary) recommendations.push(trendSummary);

  return recommendations;
};

export const generateRecommendations = ({ selectedSpill, allSpills }) => {
  if (selectedSpill) {
    return generateSpillRecommendations(selectedSpill);
  }

  return generateGeneralRecommendations(allSpills);
};

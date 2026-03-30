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

const normalizeValue = (value) => String(value || "").trim().toLowerCase();

const POLLUTION_RULES = [
  {
    id: "highSeverity",
    severityLevel: "high",
    matches: (record) => normalizeValue(record?.severity) === "high",
    title: (record) => {
      const location = record?.location || "selected site";
      return `Urgent intervention: ${location}`;
    },
    description: (record) => {
      const location = record?.location || "this site";
      return `High-severity pollution requires urgent intervention at ${location}.`;
    },
    action: (record) => {
      const location = record?.location || "this site";
      return `Prioritize immediate containment and rapid cleanup crews at ${location}.`;
    },
  },
  {
    id: "oilType",
    severityLevel: "high",
    matches: (record) => normalizeValue(record?.type).includes("oil"),
    title: (record) => {
      const location = record?.location || "the site";
      return `Oil containment priority for ${location}`;
    },
    description: (record) => {
      const type = record?.type || "oil";
      return `Oil pollution detected (${type}).`;
    },
    action: (record) => {
      const location = record?.location || "the site";
      return `Containment and cleanup priority: deploy booms and skimmers at ${location}.`;
    },
  },
  {
    id: "plasticType",
    severityLevel: "medium",
    matches: (record) => normalizeValue(record?.type).includes("plastic"),
    title: (record) => {
      const location = record?.location || "the site";
      return `Plastic waste response for ${location}`;
    },
    description: (record) => {
      const type = record?.type || "plastic";
      return `Plastic pollution detected (${type}).`;
    },
    action: (record) => {
      const location = record?.location || "the site";
      return `Increase waste management and public awareness efforts around ${location}.`;
    },
  },
];

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

const generatePollutionRecommendations = (record) => {
  if (!record) return [];

  return POLLUTION_RULES.filter((rule) => rule.matches(record)).map((rule) =>
    buildRecommendation({
      title: rule.title(record),
      severityLevel: rule.severityLevel,
      description: rule.description(record),
      action: rule.action(record),
    })
  );
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

const summarizePollutionTypes = (pollutions) => {
  const typeCounts = new Map();

  pollutions.forEach((record) => {
    const type = record?.type || "Unknown";
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });

  let topType = null;
  let topCount = 0;
  typeCounts.forEach((count, type) => {
    if (count > topCount) {
      topCount = count;
      topType = type;
    }
  });

  if (!topType) return null;

  return buildRecommendation({
    title: "Dominant pollution source",
    severityLevel: "medium",
    description: `${topType} appears most frequently (${topCount} sites).`,
    action: `Target containment and cleanup plans toward ${topType} sources first.`,
  });
};

const summarizePollutionSeverity = (pollutions) => {
  const counts = { high: 0, medium: 0, low: 0 };

  pollutions.forEach((record) => {
    const severity = normalizeValue(record?.severity);
    if (counts[severity] !== undefined) counts[severity] += 1;
  });

  const action = counts.high > 0
    ? `Dispatch urgent intervention to ${counts.high} high-severity sites first.`
    : `Focus cleanup planning across ${counts.medium + counts.low} medium/low severity sites.`;

  return buildRecommendation({
    title: "Severity mix",
    severityLevel: counts.high > 0 ? "high" : "medium",
    description: `High: ${counts.high}, Medium: ${counts.medium}, Low: ${counts.low}.`,
    action,
  });
};

const summarizePollutionHotspots = (pollutions) => {
  const locationCounts = new Map();

  pollutions.forEach((record) => {
    const location = record?.location || "Unknown";
    locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
  });

  let topLocation = null;
  let topCount = 0;
  locationCounts.forEach((count, location) => {
    if (count > topCount) {
      topCount = count;
      topLocation = location;
    }
  });

  if (!topLocation) return null;

  return buildRecommendation({
    title: "Priority hotspot",
    severityLevel: "medium",
    description: `${topLocation} has ${topCount} tracked pollution sites.`,
    action: `Prioritize inspections and cleanup resources near ${topLocation}.`,
  });
};

const generateGeneralPollutionRecommendations = (pollutions) => {
  if (!Array.isArray(pollutions) || pollutions.length === 0) return [];

  const recommendations = [];
  const hotspot = summarizePollutionHotspots(pollutions);
  if (hotspot) recommendations.push(hotspot);

  const typeSummary = summarizePollutionTypes(pollutions);
  if (typeSummary) recommendations.push(typeSummary);

  recommendations.push(summarizePollutionSeverity(pollutions));

  return recommendations;
};

export const generateRecommendations = ({
  dataMode = "spills",
  selectedSpill,
  allSpills,
  selectedPollution,
  allPollutions,
}) => {
  if (dataMode === "pollution") {
    if (selectedPollution) {
      return generatePollutionRecommendations(selectedPollution);
    }

    return generateGeneralPollutionRecommendations(allPollutions);
  }

  if (selectedSpill) {
    return generateSpillRecommendations(selectedSpill);
  }

  return generateGeneralRecommendations(allSpills);
};

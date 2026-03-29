const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const vectorMagnitude = (x, y) => Math.sqrt(x * x + y * y);

export const normalizeVector = (x, y) => {
  const mag = vectorMagnitude(x, y);
  if (!mag) {
    return { x: 0, y: 0, mag: 0, nx: 0, ny: 0 };
  }
  return { x, y, mag, nx: x / mag, ny: y / mag };
};

export const downsampleFeatures = (features, maxCount = 800) => {
  if (!Array.isArray(features) || features.length <= maxCount) return features || [];
  const stride = Math.ceil(features.length / maxCount);
  return features.filter((_, index) => index % stride === 0);
};

export const getNearestVector = (features, lng, lat, xKey, yKey) => {
  if (!Array.isArray(features) || features.length === 0) {
    return { x: 0, y: 0, mag: 0 };
  }

  let best = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const feature of features) {
    const coords = feature?.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    const dx = coords[0] - lng;
    const dy = coords[1] - lat;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = feature;
    }
  }

  if (!best) return { x: 0, y: 0, mag: 0 };

  const x = Number(best?.properties?.[xKey] || 0);
  const y = Number(best?.properties?.[yKey] || 0);
  return { x, y, mag: vectorMagnitude(x, y) };
};

export const combineVectors = (wind, current, weights = { wind: 0.6, current: 0.4 }) => {
  const wx = (wind?.x || 0) * (weights.wind ?? 0.6);
  const wy = (wind?.y || 0) * (weights.wind ?? 0.6);
  const cx = (current?.x || 0) * (weights.current ?? 0.4);
  const cy = (current?.y || 0) * (weights.current ?? 0.4);
  return normalizeVector(wx + cx, wy + cy);
};

export const vectorToCompass = (x, y) => {
  const mag = vectorMagnitude(x, y);
  if (!mag) return "Calm";

  const angle = (Math.atan2(y, x) * 180) / Math.PI;
  const bearing = (90 - angle + 360) % 360;
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

export const estimateSpreadRadius = (volumeTonnes, intensity) => {
  const volume = Number(volumeTonnes || 0);
  const base = 800;
  const volumeFactor = Math.sqrt(Math.max(volume, 0)) * 40;
  const intensityFactor = Math.max(0, intensity) * 900;
  const radius = base + volumeFactor + intensityFactor;
  return Math.max(600, Math.min(radius, 25000));
};

export const computeDirectionEndpoint = (lat, lng, nx, ny, distanceMeters) => {
  if (!distanceMeters || (!nx && !ny)) return { lat, lng };
  const metersPerDegLat = 111320;
  const metersPerDegLng = metersPerDegLat * Math.cos(toRadians(lat));

  const dLat = (ny * distanceMeters) / metersPerDegLat;
  const dLng = metersPerDegLng ? (nx * distanceMeters) / metersPerDegLng : 0;

  return {
    lat: lat + dLat,
    lng: lng + dLng,
  };
};

const offsetLatLng = (lat, lng, nx, ny, distanceMeters) => {
  if (!distanceMeters || (!nx && !ny)) return { lat, lng };
  const metersPerDegLat = 111320;
  const metersPerDegLng = metersPerDegLat * Math.cos(toRadians(lat));
  const dLat = (ny * distanceMeters) / metersPerDegLat;
  const dLng = metersPerDegLng ? (nx * distanceMeters) / metersPerDegLng : 0;
  return { lat: lat + dLat, lng: lng + dLng };
};

export const buildFlowCurve = (
  lat,
  lng,
  nx,
  ny,
  distanceMeters,
  curveStrength = 0.35,
  steps = 10
) => {
  if (!distanceMeters || (!nx && !ny)) {
    return [[lat, lng]];
  }

  const endpoint = computeDirectionEndpoint(lat, lng, nx, ny, distanceMeters);
  const px = -ny;
  const py = nx;
  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const baseLat = lat + (endpoint.lat - lat) * t;
    const baseLng = lng + (endpoint.lng - lng) * t;
    const offset = Math.sin(Math.PI * t) * distanceMeters * curveStrength;
    const curved = offsetLatLng(baseLat, baseLng, px, py, offset);
    points.push([curved.lat, curved.lng]);
  }

  return points;
};

export const buildSpreadPolygon = (lat, lng, radiusMeters, nx, ny, steps = 20) => {
  if (!radiusMeters) return [];

  const heading = Math.atan2(ny, nx);
  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const angle = (Math.PI * 2 * i) / steps;
    const bias = Math.max(0, Math.cos(angle - heading));
    const scaledRadius = radiusMeters * (0.75 + bias * 0.5);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const point = offsetLatLng(lat, lng, dx, dy, scaledRadius);
    points.push([point.lat, point.lng]);
  }

  return points;
};

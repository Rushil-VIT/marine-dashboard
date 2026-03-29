import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

/**
 * SpillHeatmap — Leaflet heat layer rendered from spill data.
 * Intensity is based on estimated_volume_tonnes and severity weighting.
 * Uses leaflet.heat plugin via useMap() hook.
 */
function SpillHeatmap({ spills }) {
  const map = useMap();

  useEffect(() => {
    if (!spills || spills.length === 0) return;

    const severityWeight = (severity) => {
      if (severity === "major") return 1.0;
      if (severity === "moderate") return 0.7;
      return 0.45;
    };

    const weightedVolumes = spills.map((spill) => {
      const volume = Number(spill.properties?.estimated_volume_tonnes || 0);
      const severity = spill.properties?.severity || "minor";
      return Math.sqrt(volume) * severityWeight(severity);
    });

    const maxWeighted = Math.max(1, ...weightedVolumes);

    const heatPoints = spills.map((spill, index) => {
      const coords = spill.geometry?.coordinates || [0, 0];
      const weighted = weightedVolumes[index] || 0;
      const intensity = Math.min(1, weighted / maxWeighted);
      return [coords[1], coords[0], intensity];
    });

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 40,
      blur: 28,
      maxZoom: 11,
      max: 1.0,
      minOpacity: 0.35,
      gradient: {
        0.0: "#1e3a8a",
        0.2: "#2563eb",
        0.45: "#06b6d4",
        0.7: "#f59e0b",
        0.85: "#f97316",
        1.0: "#ef4444",
      },
    });

    heatLayer.addTo(map);

    // Cleanup on unmount
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [spills, map]);

  return null; // Renders via Leaflet, not React DOM
}

export default SpillHeatmap;

import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

const severityWeight = (severity) => {
  if (severity === "high") return 1.0;
  if (severity === "medium") return 0.65;
  return 0.35;
};

function PollutionHeatmap({ pollutions }) {
  const map = useMap();

  const heatPoints = useMemo(() => {
    if (!Array.isArray(pollutions)) return [];

    return pollutions.reduce((acc, record) => {
      const coords = record.coordinates;
      if (!Array.isArray(coords) || coords.length !== 2) return acc;

      const intensity = severityWeight(record.severity);
      acc.push([coords[1], coords[0], intensity]);
      return acc;
    }, []);
  }, [pollutions]);

  useEffect(() => {
    if (heatPoints.length === 0) return;

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 36,
      blur: 26,
      maxZoom: 11,
      max: 1.0,
      minOpacity: 0.25,
      gradient: {
        0.0: "#22c55e",
        0.45: "#facc15",
        0.7: "#ef4444",
        1.0: "#7c3aed",
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [heatPoints, map]);

  return null;
}

export default PollutionHeatmap;

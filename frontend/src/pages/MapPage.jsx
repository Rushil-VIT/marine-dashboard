import React, { useState, useMemo, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  Polyline,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useSpillContext } from "../context/SpillContext";
import SpillDetailsPanel from "../components/SpillDetailsPanel";
import PollutionDetailsPanel from "../components/PollutionDetailsPanel";
import SpillHeatmap from "../components/SpillHeatmap";
import PollutionHeatmap from "../components/PollutionHeatmap";
import RecommendationPanel from "../components/RecommendationPanel";
import { fetchCurrents, fetchWinds } from "../api/spillService";
import {
  downsampleFeatures,
  getNearestVector,
  combineVectors,
  vectorToCompass,
  estimateSpreadRadius,
  computeDirectionEndpoint,
  buildFlowCurve,
  buildSpreadPolygon,
} from "../utils/spillVectorUtils";

/* =====================================================
   Severity → Color Mapping
===================================================== */

const SEVERITY_COLORS = {
  major: "#ff4d4d",
  moderate: "#ffa500",
  minor: "#4caf50",
};

const POLLUTION_COLORS = {
  high: "#ff4d4d",
  medium: "#f59e0b",
  low: "#4ade80",
};

/* =====================================================
   Custom Zoom Controls (unchanged)
===================================================== */

function CustomZoomControls() {
  const map = useMap();

  return (
    <div className="custom-zoom-controls">
      <button onClick={() => map.zoomIn()}>＋</button>
      <button onClick={() => map.zoomOut()}>－</button>
    </div>
  );
}

/* =====================================================
   Fly To Selected Spill
===================================================== */

function FlyToSpill({ spill }) {
  const map = useMap();

  React.useEffect(() => {
    if (spill?.geometry?.coordinates) {
      const [lng, lat] = spill.geometry.coordinates;
      const targetZoom = Math.max(map.getZoom(), 7);
      map.flyTo([lat, lng], targetZoom, {
        animate: true,
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }
  }, [spill, map]);

  return null;
}

function FlyToPollution({ pollution }) {
  const map = useMap();

  React.useEffect(() => {
    if (!pollution?.coordinates || pollution.coordinates.length !== 2) return;
    const [lng, lat] = pollution.coordinates;
    const targetZoom = Math.max(map.getZoom(), 7);
    map.flyTo([lat, lng], targetZoom, {
      animate: true,
      duration: 1.1,
      easeLinearity: 0.25,
    });
  }, [pollution, map]);

  return null;
}

function MapZoomTracker({ onZoomChange }) {
  useMapEvents({
    zoomend: (event) => onZoomChange(event.target.getZoom()),
  });

  return null;
}

function ClusterMarker({ cluster }) {
  const map = useMap();

  return (
    <CircleMarker
      center={[cluster.center.lat, cluster.center.lng]}
      radius={Math.min(18, 10 + cluster.count)}
      fillColor="rgba(0, 242, 254, 0.35)"
      color="rgba(0, 242, 254, 0.9)"
      weight={2}
      fillOpacity={0.9}
      eventHandlers={{
        click: () => {
          const nextZoom = Math.min(map.getZoom() + 2, 12);
          map.flyTo([cluster.center.lat, cluster.center.lng], nextZoom, {
            animate: true,
            duration: 0.6,
          });
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
        {cluster.count} spills
      </Tooltip>
    </CircleMarker>
  );
}

const buildClusters = (spills, zoom, selectedId) => {
  const step = zoom <= 5 ? 2 : zoom <= 7 ? 1 : zoom <= 9 ? 0.5 : 0.25;
  const clusters = new Map();
  const singles = [];

  spills.forEach((spill) => {
    const id = spill.properties?.spill_id;
    const coords = spill.geometry?.coordinates || [];
    if (coords.length !== 2) return;

    if (selectedId && id === selectedId) {
      singles.push({ id, count: 1, spills: [spill], center: { lat: coords[1], lng: coords[0] } });
      return;
    }

    const latKey = Math.floor(coords[1] / step);
    const lngKey = Math.floor(coords[0] / step);
    const key = `${latKey}:${lngKey}`;

    const entry = clusters.get(key) || {
      id: key,
      count: 0,
      spills: [],
      center: { lat: 0, lng: 0 },
    };

    entry.count += 1;
    entry.spills.push(spill);
    entry.center.lat += coords[1];
    entry.center.lng += coords[0];
    clusters.set(key, entry);
  });

  const clustered = Array.from(clusters.values()).map((entry) => ({
    ...entry,
    center: {
      lat: entry.center.lat / entry.count,
      lng: entry.center.lng / entry.count,
    },
  }));

  return [...clustered, ...singles];
};

/* =====================================================
   Map Page Component
===================================================== */

function MapPage() {
  const {
    dataMode,
    filteredSpills,
    selectedSpill,
    setSelectedSpill,
    selectedPollution,
    setSelectedPollution,
    loading,
    error,
    severityFilter,
    setSeverityFilter,
    dateRange,
    setDateRange,
    regionFilter,
    setRegionFilter,
    regionOptions,
    filteredPollutions,
    pollutionFilters,
    setPollutionFilters,
    pollutionOptions,
  } = useSpillContext();

  const [layers, setLayers] = useState({ spills: true, pollution: false, heatmap: false, flow: true });
  const [windData, setWindData] = useState([]);
  const [currentData, setCurrentData] = useState([]);
  const [mapZoom, setMapZoom] = useState(5);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const severityOptions = ["major", "moderate", "minor"];

  const toggleLayer = (key) => {
    setLayers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleSeverity = (level) => {
    setSeverityFilter((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const updateDateRange = (key, value) => {
    setDateRange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateRegionFilter = (value) => {
    setRegionFilter(value);
  };

  const updatePollutionFilter = (key, value) => {
    setPollutionFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSpillSelect = (spill) => {
    setSelectedPollution(null);
    setSelectedSpill(spill);
  };

  const handlePollutionSelect = (pollution) => {
    setSelectedSpill(null);
    setSelectedPollution(pollution);
  };

  useEffect(() => {
    let mounted = true;

    const loadEnvironment = async () => {
      try {
        const [windsRes, currentsRes] = await Promise.all([
          fetchWinds(),
          fetchCurrents(),
        ]);

        if (!mounted) return;

        setWindData(windsRes.data?.data || []);
        setCurrentData(currentsRes.data?.data || []);
      } catch (loadError) {
        console.error("Failed to load environment data:", loadError);
      }
    };

    loadEnvironment();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setLayers((prev) => ({
      ...prev,
      spills: dataMode === "spills",
      pollution: dataMode === "pollution",
      flow: dataMode === "spills" ? prev.flow : false,
    }));
  }, [dataMode]);

  /* ─── Filter out invalid spills ──────────────────── */
  const validSpills = useMemo(
    () => filteredSpills.filter((s) => s.geometry?.coordinates?.length === 2),
    [filteredSpills]
  );

  const validPollutions = useMemo(
    () =>
      filteredPollutions.filter(
        (record) => Array.isArray(record.coordinates) && record.coordinates.length === 2
      ),
    [filteredPollutions]
  );

  const windSamples = useMemo(
    () => downsampleFeatures(windData),
    [windData]
  );

  const currentSamples = useMemo(
    () => downsampleFeatures(currentData),
    [currentData]
  );

  const spillFlowById = useMemo(() => {
    const map = new Map();

    validSpills.forEach((spill) => {
      const [lng, lat] = spill.geometry.coordinates;
      const windVector = getNearestVector(windSamples, lng, lat, "WSXM", "WSYM");
      const currentVector = getNearestVector(currentSamples, lng, lat, "U", "V");
      const combined = combineVectors(windVector, currentVector);

      const intensity = combined.mag;
      const direction = vectorToCompass(combined.x, combined.y);
      const spreadRadius = estimateSpreadRadius(
        spill.properties?.estimated_volume_tonnes,
        intensity
      );
      const directionDistance = Math.max(2000, Math.min(15000, 4000 + intensity * 1200));
      const endpoint = computeDirectionEndpoint(
        lat,
        lng,
        combined.nx,
        combined.ny,
        directionDistance
      );
      const curve = buildFlowCurve(
        lat,
        lng,
        combined.nx,
        combined.ny,
        directionDistance
      );
      const spreadPolygon = buildSpreadPolygon(
        lat,
        lng,
        spreadRadius,
        combined.nx,
        combined.ny
      );

      map.set(spill.properties?.spill_id, {
        direction,
        spreadRadius,
        line: [
          [lat, lng],
          [endpoint.lat, endpoint.lng],
        ],
        curve,
        spreadPolygon,
        endpoint,
      });
    });

    return map;
  }, [validSpills, windSamples, currentSamples]);

  const selectedSpillId = selectedSpill?.properties?.spill_id;
  const selectedFlow = selectedSpillId ? spillFlowById.get(selectedSpillId) : null;
  const selectedCoords = selectedSpill?.geometry?.coordinates || [];
  const selectedLatLng = selectedCoords.length === 2
    ? [selectedCoords[1], selectedCoords[0]]
    : null;

  const clusteredSpills = useMemo(
    () => buildClusters(validSpills, mapZoom, selectedSpillId),
    [validSpills, mapZoom, selectedSpillId]
  );

  return (
    <div className="map-page">
      {/* Header Overlay */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(20px)",
          padding: "8px 20px",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.4)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className={`map-toggle-btn ${layers.spills ? "active" : ""}`}
            onClick={() => toggleLayer("spills")}
            style={{ borderRadius: "10px", padding: "6px 14px" }}
          >
            📍 Spills
          </button>
          <button
            className={`map-toggle-btn ${layers.pollution ? "active" : ""}`}
            onClick={() => toggleLayer("pollution")}
            style={{ borderRadius: "10px", padding: "6px 14px" }}
          >
            Pollution
          </button>
          <button
            className={`map-toggle-btn ${layers.heatmap ? "active" : ""}`}
            onClick={() => toggleLayer("heatmap")}
            style={{ borderRadius: "10px", padding: "6px 14px" }}
          >
            🔥 Heatmap
          </button>
          {dataMode === "spills" && (
            <button
              className={`map-toggle-btn ${layers.flow ? "active" : ""}`}
              onClick={() => toggleLayer("flow")}
              style={{ borderRadius: "10px", padding: "6px 14px" }}
            >
              🌊 Flow
            </button>
          )}
        </div>

        <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }} />

        {dataMode === "spills" ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {severityOptions.map((level) => (
              <button
                key={level}
                className={`map-toggle-btn ${severityFilter?.[level] ? "active" : ""}`}
                onClick={() => toggleSeverity(level)}
                aria-pressed={severityFilter?.[level] ? "true" : "false"}
                style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "8px" }}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              id="map-pollution-type"
              value={pollutionFilters.type}
              onChange={(event) => updatePollutionFilter("type", event.target.value)}
              style={{ padding: "4px 8px", fontSize: "12px" }}
            >
              <option value="all">All types</option>
              {pollutionOptions.typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              id="map-pollution-severity"
              value={pollutionFilters.severity}
              onChange={(event) => updatePollutionFilter("severity", event.target.value)}
              style={{ padding: "4px 8px", fontSize: "12px" }}
            >
              <option value="all">All levels</option>
              {pollutionOptions.severityOptions.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
            <select
              id="map-pollution-location"
              value={pollutionFilters.location}
              onChange={(event) => updatePollutionFilter("location", event.target.value)}
              style={{ padding: "4px 8px", fontSize: "12px" }}
            >
              <option value="all">All locations</option>
              {pollutionOptions.locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {dataMode === "spills" && (
            <>
              <input
                id="map-date-start"
                type="date"
                value={dateRange.start}
                max={dateRange.end || undefined}
                onChange={(event) => updateDateRange("start", event.target.value)}
                style={{ padding: "4px 8px", fontSize: "12px" }}
              />
              <span style={{ color: "#475569" }}>—</span>
              <input
                id="map-date-end"
                type="date"
                value={dateRange.end}
                min={dateRange.start || undefined}
                onChange={(event) => updateDateRange("end", event.target.value)}
                style={{ padding: "4px 8px", fontSize: "12px" }}
              />
              <select
                id="map-region-filter"
                value={regionFilter}
                onChange={(event) => updateRegionFilter(event.target.value)}
                style={{ padding: "4px 8px", fontSize: "12px", marginLeft: "4px" }}
              >
                <option value="all">All States</option>
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            className="map-toggle-btn"
            type="button"
            onClick={() => setIsRecommendationsOpen(true)}
            style={{ marginLeft: "6px", padding: "4px 10px", fontSize: "12px" }}
          >
            Recommendations
          </button>
        </div>
      </div>

      {/* Map Layout */}
      <div className="map-layout">
        <div className="map-wrapper">
          <MapContainer
            center={[15, 78]}
            zoom={5}
            minZoom={4}
            maxZoom={12}
            zoomControl={false}
            maxBounds={[
              [0, 60],
              [30, 100],
            ]}
            maxBoundsViscosity={1.0}
            className="map-container"
          >
            {/* Tile Layer */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            <MapZoomTracker onZoomChange={setMapZoom} />

            {/* Selected spill spread zone */}
            {layers.flow && layers.spills && selectedFlow?.spreadPolygon?.length > 0 && (
              <Polygon
                positions={selectedFlow.spreadPolygon}
                pathOptions={{
                  color: "rgba(0, 242, 254, 0.6)",
                  fillColor: "rgba(0, 242, 254, 0.25)",
                  fillOpacity: 0.3,
                  weight: 1,
                }}
              />
            )}

            {/* Flow Layer */}
            {layers.flow && layers.spills &&
              validSpills.map((spill) => {
                const flow = spillFlowById.get(spill.properties?.spill_id);
                if (!flow?.curve?.length) return null;

                return (
                  <React.Fragment key={`flow-${spill.properties?.spill_id}`}>
                    <Polyline
                      positions={flow.curve}
                      pathOptions={{
                        color: "rgba(0, 242, 254, 0.7)",
                        weight: 2,
                      }}
                      className="flow-line"
                    />
                    <CircleMarker
                      center={[flow.endpoint.lat, flow.endpoint.lng]}
                      radius={3}
                      fillColor="rgba(0, 242, 254, 0.9)"
                      color="rgba(0, 242, 254, 0.9)"
                      weight={1}
                      fillOpacity={0.9}
                    />
                  </React.Fragment>
                );
              })}

            {/* Spill Markers — shown only in spills mode */}
            {layers.spills &&
              clusteredSpills.map((cluster) => {
                if (cluster.count > 1) {
                  return <ClusterMarker key={cluster.id} cluster={cluster} />;
                }

                const spill = cluster.spills[0];
                const [lng, lat] = spill.geometry.coordinates;
                const severity = spill.properties?.severity || "minor";
                const isSelected =
                  selectedSpill?.properties?.spill_id ===
                  spill.properties?.spill_id;
                const flow = spillFlowById.get(spill.properties?.spill_id);
                const directionLabel = flow?.direction || "Calm";

                return (
                  <React.Fragment key={spill.properties.spill_id}>
                    <CircleMarker
                      center={[lat, lng]}
                      radius={isSelected ? 14 : 8}
                      fillColor={SEVERITY_COLORS[severity] || "#4caf50"}
                      color={isSelected ? "#ffffff" : "rgba(255,255,255,0.5)"}
                      weight={isSelected ? 4 : 1.5}
                      fillOpacity={isSelected ? 0.95 : 0.8}
                      eventHandlers={{
                        click: () => handleSpillSelect(spill),
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -10]} opacity={0.95} sticky>
                        <strong>{spill.properties.title}</strong>
                        <br />
                        {spill.properties.date}
                        <br />
                        Severity: {severity}
                        <br />
                        Direction: {directionLabel}
                      </Tooltip>
                      <Popup>
                        <strong>{spill.properties.title}</strong>
                        <br />
                        {spill.properties.date} — {spill.properties.state}
                        <br />
                        Volume: {spill.properties.estimated_volume_tonnes} tonnes
                      </Popup>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}

            {/* Pollution Markers */}
            {layers.pollution &&
              validPollutions.map((record) => {
                const [lng, lat] = record.coordinates;
                const severity = record.severity || "low";
                const isSelected = selectedPollution?.id === record.id;

                return (
                  <CircleMarker
                    key={record.id}
                    center={[lat, lng]}
                    radius={isSelected ? 14 : 9}
                    fillColor={POLLUTION_COLORS[severity] || "#4ade80"}
                    color={isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.45)"}
                    weight={isSelected ? 3 : 1.5}
                    fillOpacity={isSelected ? 0.95 : 0.75}
                    eventHandlers={{
                      click: () => handlePollutionSelect(record),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={0.95} sticky>
                      <strong>{record.location}</strong>
                      <br />
                      {record.type}
                      <br />
                      Severity: {severity}
                    </Tooltip>
                    <Popup>
                      <strong>{record.location}</strong>
                      <br />
                      {record.type}
                      <br />
                      Severity: {severity}
                    </Popup>
                  </CircleMarker>
                );
              })}

            {/* Heatmap Layer — shown only in heatmap mode */}
            {layers.heatmap && layers.spills && <SpillHeatmap spills={validSpills} />}
            {layers.heatmap && layers.pollution && (
              <PollutionHeatmap pollutions={validPollutions} />
            )}

            {/* Fly to selected spill */}
            {selectedSpill && <FlyToSpill spill={selectedSpill} />}
            {selectedPollution && <FlyToPollution pollution={selectedPollution} />}

            {/* Custom Zoom Buttons */}
            <CustomZoomControls />
          </MapContainer>
        </div>

        <RecommendationPanel
          isOpen={isRecommendationsOpen}
          onClose={() => setIsRecommendationsOpen(false)}
          dataMode={dataMode}
          selectedSpill={selectedSpill}
          allSpills={filteredSpills}
          selectedPollution={selectedPollution}
          allPollutions={filteredPollutions}
        />

        {/* ================= DETAILS PANEL ================= */}
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "12px",
            width: "100%",
            maxWidth: "420px",
            maxHeight: "calc(100% - 24px)",
            overflow: "auto",
          }}
        >
          {selectedPollution ? (
            <PollutionDetailsPanel
              selectedPollution={selectedPollution}
              onClose={() => setSelectedPollution(null)}
            />
          ) : (
            <SpillDetailsPanel
              selectedSpill={selectedSpill}
              onClose={() => setSelectedSpill(null)}
            />
          )}
        </div>

      </div>
    </div>
  );
}

export default MapPage;
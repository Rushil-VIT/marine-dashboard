import React, { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SEVERITY_COLORS = {
  high: "#ff4d4d",
  medium: "#f59e0b",
  low: "#4ade80",
};

function CustomZoomControls() {
  const map = useMap();

  return (
    <div className="custom-zoom-controls">
      <button onClick={() => map.zoomIn()}>+</button>
      <button onClick={() => map.zoomOut()}>-</button>
    </div>
  );
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

function PollutionMap({ pollutions, selectedPollution, onSelect }) {
  const validPollutions = useMemo(
    () =>
      pollutions.filter(
        (record) => Array.isArray(record.coordinates) && record.coordinates.length === 2
      ),
    [pollutions]
  );

  return (
    <div className="pollution-map-shell">
      <MapContainer
        center={[13.1, 80.3]}
        zoom={7}
        minZoom={5}
        maxZoom={12}
        zoomControl={false}
        maxBounds={[
          [6, 70],
          [23, 87],
        ]}
        maxBoundsViscosity={1.0}
        className="map-container"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {validPollutions.map((record) => {
          const [lng, lat] = record.coordinates;
          const severity = record.severity || "low";
          const isSelected = selectedPollution?.id === record.id;

          return (
            <CircleMarker
              key={record.id}
              center={[lat, lng]}
              radius={isSelected ? 14 : 9}
              fillColor={SEVERITY_COLORS[severity] || "#4ade80"}
              color={isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.45)"}
              weight={isSelected ? 3 : 1.5}
              fillOpacity={isSelected ? 0.95 : 0.75}
              eventHandlers={{
                click: () => onSelect(record),
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

        {selectedPollution && <FlyToPollution pollution={selectedPollution} />}
        <CustomZoomControls />
      </MapContainer>
    </div>
  );
}

export default PollutionMap;

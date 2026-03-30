import React, { useRef, useState } from "react";
import { useSpillContext } from "../context/SpillContext";

const detectFileType = (file) => {
  if (!file) return null;
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".csv")) return "csv";

  const mime = (file.type || "").toLowerCase();
  if (mime.includes("json")) return "json";
  if (mime.includes("csv")) return "csv";

  return null;
};

const splitCsvLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

const parsePollutionCsv = (text) => {
  const lines = text.replace(/\uFEFF/g, "").split(/\r?\n/);
  const nonEmpty = lines.filter((line) => line.trim() !== "");
  if (nonEmpty.length < 2) return [];

  const headers = splitCsvLine(nonEmpty[0]).map((header) => header.trim().toLowerCase());

  return nonEmpty.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const record = {};

    headers.forEach((header, index) => {
      record[header] = (values[index] ?? "").trim();
    });

    return record;
  });
};

const parsePollutionJson = (text) => {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.records)) return parsed.records;
  if (Array.isArray(parsed?.data)) return parsed.data;
  if (parsed && typeof parsed === "object") return [parsed];
  return [];
};

function PollutionFilters({ filters, options, onFilterChange }) {
  const { typeOptions, severityOptions, locationOptions } = options;
  const { appendUploadedPollutions } = useSpillContext();
  const fileInputRef = useRef(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploadError("");
    setUploadMessage("");

    const fileType = detectFileType(file);
    if (!fileType) {
      setUploadError("Unsupported file type. Use JSON or CSV.");
      return;
    }

    try {
      const text = await file.text();
      if (!text.trim()) {
        setUploadError("The file is empty.");
        return;
      }

      const records = fileType === "json" ? parsePollutionJson(text) : parsePollutionCsv(text);

      if (!Array.isArray(records) || records.length === 0) {
        setUploadError("No valid records found.");
        return;
      }

      const { added, rejected } = appendUploadedPollutions(records);
      if (added === 0) {
        setUploadError("No valid records could be imported.");
        return;
      }

      const rejectedText = rejected > 0 ? ` (${rejected} invalid ignored)` : "";
      setUploadMessage(`Uploaded ${added} record${added === 1 ? "" : "s"}${rejectedText}.`);
    } catch (err) {
      console.error("Pollution upload error:", err);
      setUploadError("Failed to parse the uploaded file.");
    }
  };

  return (
    <div className="pollution-filters" style={{ position: "relative" }}>
      <div className="filter-field">
        <label htmlFor="pollution-type">Type</label>
        <select
          id="pollution-type"
          value={filters.type}
          onChange={(event) => onFilterChange("type", event.target.value)}
        >
          <option value="all">All types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="pollution-severity">Severity</label>
        <select
          id="pollution-severity"
          value={filters.severity}
          onChange={(event) => onFilterChange("severity", event.target.value)}
        >
          <option value="all">All levels</option>
          {severityOptions.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <label htmlFor="pollution-location">Location</label>
          <button
            className="map-toggle-btn"
            type="button"
            onClick={handleUploadClick}
            style={{ padding: "6px 10px", fontSize: "12px" }}
          >
            Upload
          </button>
        </div>
        <select
          id="pollution-location"
          value={filters.location}
          onChange={(event) => onFilterChange("location", event.target.value)}
        >
          <option value="all">All locations</option>
          {locationOptions.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {(uploadMessage || uploadError) && (
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "8px",
            fontSize: "11px",
            color: uploadError ? "#ff4d4d" : "#94a3b8",
            pointerEvents: "none",
          }}
        >
          {uploadMessage || uploadError}
        </div>
      )}
    </div>
  );
}

export default PollutionFilters;

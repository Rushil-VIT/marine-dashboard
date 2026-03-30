import React from "react";

function PollutionFilters({ filters, options, onFilterChange }) {
  const { typeOptions, severityOptions, locationOptions } = options;

  return (
    <div className="pollution-filters">
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
        <label htmlFor="pollution-location">Location</label>
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
    </div>
  );
}

export default PollutionFilters;

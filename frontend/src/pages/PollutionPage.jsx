import React from "react";
import PollutionFilters from "../components/PollutionFilters";
import PollutionStatsCards from "../components/PollutionStatsCards";
import PollutionMap from "../components/PollutionMap";
import PollutionDetailsPanel from "../components/PollutionDetailsPanel";
import { useSpillContext } from "../context/SpillContext";

function PollutionPage() {
  const {
    pollutionFilters,
    setPollutionFilters,
    pollutionOptions,
    pollutionStats,
    filteredPollutions,
    selectedPollution,
    setSelectedPollution,
  } = useSpillContext();

  const handleFilterChange = (key, value) => {
    setPollutionFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="pollution-page">
      <PollutionFilters
        filters={pollutionFilters}
        options={pollutionOptions}
        onFilterChange={handleFilterChange}
      />

      <PollutionStatsCards
        totalSites={pollutionStats.totalSites}
        highSeverityCount={pollutionStats.highSeverityCount}
        dominantType={pollutionStats.dominantType}
      />

      <div className="pollution-bottom">
        <PollutionMap
          pollutions={filteredPollutions}
          selectedPollution={selectedPollution}
          onSelect={setSelectedPollution}
        />
        <PollutionDetailsPanel
          selectedPollution={selectedPollution}
          onClose={() => setSelectedPollution(null)}
        />
      </div>
    </div>
  );
}

export default PollutionPage;

import React, { useEffect } from "react";
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

  useEffect(() => {
    const modeSwitch = document.querySelector(".mode-switch");
    if (!modeSwitch) return undefined;

    const previous = {
      display: modeSwitch.style.display,
      opacity: modeSwitch.style.opacity,
    };

    modeSwitch.style.display = "none";
    modeSwitch.style.opacity = "0";

    return () => {
      modeSwitch.style.display = previous.display;
      modeSwitch.style.opacity = previous.opacity;
    };
  }, []);

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

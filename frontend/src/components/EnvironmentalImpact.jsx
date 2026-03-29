import React, { useMemo } from "react";
import { useSpillContext } from "../context/SpillContext";

/* Environmental impact metrics component — Data driven */
function EnvironmentalImpact() {
  const { filteredStats, loading } = useSpillContext();

  const impactData = useMemo(() => {
    if (!filteredStats) return [];

    const totalVolume = filteredStats.overview?.totalVolume || 0;
    const eastCoast = filteredStats.byCoast?.find(c => c.coast === "east")?.count || 0;
    const westCoast = filteredStats.byCoast?.find(c => c.coast === "west")?.count || 0;
    const majorCount = filteredStats.bySeverity?.find(s => s.severity === "major")?.count || 0;

    return [
      {
        title: "Major Severity Incidents",
        value: majorCount.toString(),
        description: "Number of high environmental impact spills",
      },
      {
        title: "Total Estimated Volume",
        value: `${totalVolume.toLocaleString()} t`,
        description: "Estimated tonnes of oil spilled overall",
      },
      {
        title: "Coastal Distribution",
        value: `${eastCoast} East / ${westCoast} West`,
        description: "Number of spills on East vs West coast",
      },
    ];
  }, [filteredStats]);

  return (
    <div className="environmental-impact">
      <h2 className="impact-title">
        Environmental Impact {loading && <span style={{fontSize:'0.6em', opacity: 0.7}}>(Loading...)</span>}
      </h2>

      <div className="impact-cards-container">
        {impactData.map((impact, index) => (
          <div key={index} className="impact-card">
            <h3 className="impact-card-title">{impact.title}</h3>
            <p className="impact-card-value">{impact.value}</p>
            <p className="impact-card-description">{impact.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EnvironmentalImpact;
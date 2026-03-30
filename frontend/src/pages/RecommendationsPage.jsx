import React from "react";
import LayoutGrid from "../components/LayoutGrid";
import RecommendationPanel from "../components/RecommendationPanel";
import { useSpillContext } from "../context/SpillContext";

function RecommendationsPage() {
  const {
    dataMode,
    selectedSpill,
    filteredSpills,
    selectedPollution,
    filteredPollutions,
  } = useSpillContext();

  return (
    <div style={{ padding: "12px 16px 16px", height: "calc(100vh - 24px)" }}>
      <h1 className="page-title" style={{ padding: 0 }}>
        {dataMode === "pollution" ? "Pollution Recommendations" : "Recommendations"}
      </h1>

      <LayoutGrid minColumnWidth={360} gap="16px" style={{ marginTop: "12px" }}>
        <RecommendationPanel
          embedded
          isOpen
          onClose={() => {}}
          dataMode={dataMode}
          selectedSpill={selectedSpill}
          allSpills={filteredSpills}
          selectedPollution={selectedPollution}
          allPollutions={filteredPollutions}
          title="Response Playbook"
        />
      </LayoutGrid>
    </div>
  );
}

export default RecommendationsPage;

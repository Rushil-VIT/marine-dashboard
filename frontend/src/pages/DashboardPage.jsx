import { useState } from "react";
import { useSpillContext } from "../context/SpillContext";
import DashboardOverview from "../components/DashboardOverview";
import LayoutGrid from "../components/LayoutGrid";
import RecommendationPanel from "../components/RecommendationPanel";

function DashboardPage() {
  const { selectedSpill, filteredSpills } = useSpillContext();
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);

  return (
    <div style={{ padding: "0 24px 24px 24px", height: "100vh", overflowY: "auto", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 className="page-title" style={{ padding: "16px 0" }}>Dashboard</h1>
        <button
          className="map-toggle-btn"
          type="button"
          onClick={() => setIsRecommendationsOpen(true)}
          style={{ height: "32px" }}
        >
          Recommendations
        </button>
      </div>
      <LayoutGrid minColumnWidth={420} gap="20px">
        <DashboardOverview />
      </LayoutGrid>

      <RecommendationPanel
        isOpen={isRecommendationsOpen}
        onClose={() => setIsRecommendationsOpen(false)}
        selectedSpill={selectedSpill}
        allSpills={filteredSpills}
        title="Recommendations"
      />
    </div>
  );
}

export default DashboardPage;
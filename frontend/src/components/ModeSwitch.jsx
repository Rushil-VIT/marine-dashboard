import React from "react";
import { useSpillContext } from "../context/SpillContext";

function ModeSwitch() {
  const { dataMode, setDataMode } = useSpillContext();

  return (
    <div className="mode-switch" role="group" aria-label="Data mode">
      <button
        type="button"
        className={`mode-switch-btn ${dataMode === "spills" ? "active" : ""}`}
        onClick={() => setDataMode("spills")}
        aria-pressed={dataMode === "spills"}
      >
        Spills
      </button>
      <button
        type="button"
        className={`mode-switch-btn ${dataMode === "pollution" ? "active" : ""}`}
        onClick={() => setDataMode("pollution")}
        aria-pressed={dataMode === "pollution"}
      >
        Pollution
      </button>
    </div>
  );
}

export default ModeSwitch;

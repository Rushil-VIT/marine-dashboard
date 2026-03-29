import React from "react";

function LayoutGrid({ minColumnWidth = 320, gap = "16px", style, children }) {
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`,
    gap,
    alignItems: "stretch",
    width: "100%",
    ...style,
  };

  return <div style={gridStyle}>{children}</div>;
}

export default LayoutGrid;

import React from "react";
import { Link } from "react-router-dom";
import InsightsPanel from "../components/InsightsPanel";

/* Premium Landing Page */
function HomePage() {
  return (
    <section>
      <div className="home-hero">
        {/* Hero Glass Container */}
        <div className="hero-content">
          {/* Main Heading */}
          <h1 className="hero-title">
            Marine Pollution <span>Monitoring System</span>
          </h1>

          {/* Supporting Description */}
          <p className="hero-subtitle">
            Real-time spill detection, environmental analytics,
            and intelligent response coordination for marine safety.
          </p>

          {/* CTA Button */}
          <div className="hero-actions">
            <Link to="/dashboard" className="hero-button">
              Enter Dashboard →
            </Link>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 24px 32px", maxWidth: "960px", margin: "0 auto" }}>
        <InsightsPanel />
      </div>
    </section>
  );
}

export default HomePage;
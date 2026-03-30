import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSpillContext } from "../context/SpillContext";

const QUOTES = [
  "Small actions today define ocean survival tomorrow.",
  "The ocean is the heart of our planet.",
  "Protecting our seas is protecting our future.",
  "Every drop of water counts in the vast marine expanse.",
  "Guardians of the deep preserve the balance of life."
];

/* Premium Landing Page */
function HomePage() {
  const {
    filteredStats,
    pollutionStats,
    filteredSpills,
    filteredPollutions,
  } = useSpillContext();
  const rippleRef = useRef(null);
  
  const [quote, setQuote] = useState("");
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const spillOverview = filteredStats?.overview || { totalSpills: 0 };
  const formatNumber = (value, digits = 1) =>
    Number.isFinite(value)
      ? value.toLocaleString(undefined, { maximumFractionDigits: digits })
      : "0";
  const totalSignals =
    (spillOverview.totalSpills || 0) + (pollutionStats?.totalSites || 0);
  const majorSpillCount = useMemo(
    () =>
      (filteredSpills || []).reduce((count, spill) => {
        const severity = (spill?.properties?.severity || "").toLowerCase();
        return severity === "major" ? count + 1 : count;
      }, 0),
    [filteredSpills]
  );

  const updateItems = useMemo(() => {
    const spillItems = [...(filteredSpills || [])]
      .filter((spill) => spill?.properties)
      .sort((a, b) => {
        const aDate = Date.parse(a.properties?.date || "") || 0;
        const bDate = Date.parse(b.properties?.date || "") || 0;
        return bDate - aDate;
      })
      .slice(0, 3)
      .map((spill, index) => ({
        id: `spill-${spill.properties?.spill_id ?? index}`,
        label: `${(spill.properties?.severity || "spill").toString().toUpperCase()} spill`,
        detail: spill.properties?.state || spill.properties?.coast || "Unknown region",
      }));

    const pollutionItems = [...(filteredPollutions || [])]
      .slice(0, 3)
      .map((record, index) => ({
        id: `pollution-${record.id ?? index}`,
        label: `${record.type || "Pollution"} alert`,
        detail: record.location || "Unknown location",
      }));

    const combined = [...spillItems, ...pollutionItems].slice(0, 5);
    if (combined.length === 0) {
      return [
        {
          id: "empty",
          label: "No live alerts",
          detail: "Monitoring channels online",
        },
      ];
    }

    return combined;
  }, [filteredSpills, filteredPollutions]);

  useEffect(() => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return undefined;

    const logo = document.querySelector(".logo");
    const modeSwitch = document.querySelector(".mode-switch");
    const navLinks = document.querySelector(".nav-links");

    const previous = {
      sidebarPosition: sidebar.style.position,
      sidebarTop: sidebar.style.top,
      sidebarLeft: sidebar.style.left,
      sidebarHeight: sidebar.style.height,
      sidebarBorderRadius: sidebar.style.borderRadius,
      sidebarBackground: sidebar.style.background,
      sidebarBorder: sidebar.style.border,
      sidebarShadow: sidebar.style.boxShadow,
      sidebarPadding: sidebar.style.padding,
      sidebarAnimation: sidebar.style.animation,
      sidebarBackdropFilter: sidebar.style.backdropFilter,
      sidebarZIndex: sidebar.style.zIndex,
      logoOpacity: logo?.style.opacity,
      logoFilter: logo?.style.filter,
      modeSwitchOpacity: modeSwitch?.style.opacity,
      modeSwitchDisplay: modeSwitch?.style.display,
      navOpacity: navLinks?.style.opacity,
      navGap: navLinks?.style.gap,
    };

    // Detach and float sidebar
    sidebar.style.position = "fixed";
    sidebar.style.top = "10%";
    sidebar.style.left = "24px";
    sidebar.style.transform = "translateY(-50%)";
    sidebar.style.height = "auto";
    sidebar.style.borderRadius = "24px";
    sidebar.style.background = "rgba(4, 9, 24, 0.45)";
    sidebar.style.border = "1px solid rgba(148, 163, 184, 0.08)";
    sidebar.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.4)";
    sidebar.style.padding = "24px 16px";
    sidebar.style.animation = "slowFloat 6s ease-in-out infinite";
    sidebar.style.backdropFilter = "blur(16px) saturate(140%)";
    sidebar.style.zIndex = "100";

    if (logo) {
      logo.style.opacity = "0.85";
      logo.style.filter = "grayscale(0.3) brightness(1.2)";
    }
    if (modeSwitch) {
      modeSwitch.style.opacity = "0.75";
      modeSwitch.style.display = "none";
    }
    if (navLinks) {
      navLinks.style.opacity = "0.9";
      navLinks.style.gap = "20px";
    }

    return () => {
      sidebar.style.position = previous.sidebarPosition;
      sidebar.style.top = previous.sidebarTop;
      sidebar.style.left = previous.sidebarLeft;
      sidebar.style.transform = "";
      sidebar.style.height = previous.sidebarHeight;
      sidebar.style.borderRadius = previous.sidebarBorderRadius;
      sidebar.style.background = previous.sidebarBackground;
      sidebar.style.border = previous.sidebarBorder;
      sidebar.style.boxShadow = previous.sidebarShadow;
      sidebar.style.padding = previous.sidebarPadding;
      sidebar.style.animation = previous.sidebarAnimation;
      sidebar.style.backdropFilter = previous.sidebarBackdropFilter;
      sidebar.style.zIndex = previous.sidebarZIndex;
      
      if (logo) {
        logo.style.opacity = previous.logoOpacity;
        logo.style.filter = previous.logoFilter;
      }
      if (modeSwitch) {
        modeSwitch.style.opacity = previous.modeSwitchOpacity;
        modeSwitch.style.display = previous.modeSwitchDisplay;
      }
      if (navLinks) {
        navLinks.style.opacity = previous.navOpacity;
        navLinks.style.gap = previous.navGap;
      }
    };
  }, []);

  useEffect(() => {
    const ripple = rippleRef.current;
    if (!ripple) return undefined;

    let fadeTimeout = null;

    const updateRipple = (event) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      ripple.style.setProperty("--ripple-x", `${x}%`);
      ripple.style.setProperty("--ripple-y", `${y}%`);
      ripple.style.setProperty("--ripple-opacity", "0.4");

      if (fadeTimeout) {
        window.clearTimeout(fadeTimeout);
      }

      fadeTimeout = window.setTimeout(() => {
        ripple.style.setProperty("--ripple-opacity", "0");
      }, 380);
    };

    window.addEventListener("pointermove", updateRipple, { passive: true });

    return () => {
      window.removeEventListener("pointermove", updateRipple);
      if (fadeTimeout) {
        window.clearTimeout(fadeTimeout);
      }
    };
  }, []);

  useEffect(() => {
    const soundEnabled = JSON.parse(
      localStorage.getItem("app_sound_enabled") ?? "true"
    );
    const volume = parseFloat(
      localStorage.getItem("app_sound_volume") ?? "0.3"
    );
    const audio = new Audio(
      "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3"
    );

    audio.loop = true;
    audio.volume = volume || 0.4;

    const handleFirstClick = () => {
      if (soundEnabled) {
        audio.play().catch(() => {});
      }
    };

    document.addEventListener("click", handleFirstClick, { once: true });

    return () => {
      audio.pause();
      audio.currentTime = 0;
      document.removeEventListener("click", handleFirstClick);
    };
  }, []);

  return (
    <section className="home-premium">
      <div className="home-premium-background" aria-hidden="true">
        <div className="home-premium-base" />
        <div className="home-premium-swell" />
        <div className="home-premium-ripple" ref={rippleRef} />
      </div>

      <Link to="/dashboard" className="home-premium-dashboard interactive-element">
        Dashboard
      </Link>

      <div className="home-premium-center">
        <div className="home-premium-hero interactive-element">
          <div className="home-premium-hero-title">MARINE INTELLIGENCE</div>
          <div className="home-premium-hero-desc">
            A high-precision monitoring platform for spill response, pollution
            alerts, and ocean surface dynamics.
          </div>
          <div className="home-premium-hero-extra">
            Live signals online: {formatNumber(totalSignals, 0)}. Adaptive
            filters refine insights in real time.
          </div>
        </div>
      </div>

      <div className="home-premium-side-left">
        <div className="home-premium-recovery interactive-element glass-panel">
          <div className="home-premium-recovery-header">
            <div className="home-premium-recovery-title">Clean Earth Goal</div>
            <div className="home-premium-recovery-goal">Clean Ocean Target: 2035</div>
          </div>
          <div className="home-premium-progress-container">
            <div className="home-premium-progress-bar" style={{ width: "64%" }} />
          </div>
          <div className="home-premium-recovery-meta">
            <span>64% completion</span>
            <span>12% behind schedule</span>
          </div>
        </div>
        
        <div className="home-premium-insights">
          <div className="home-premium-insight-card spill-theme interactive-element glass-panel">
            <div className="home-premium-insight-content">
              <div className="home-premium-insight-title">Spill Insights</div>
              <div className="home-premium-insight-row">
                <span>Total spills</span>
                <strong>{formatNumber(spillOverview.totalSpills, 0)}</strong>
              </div>
              <div className="home-premium-insight-row">
                <span>Major spills</span>
                <strong>{formatNumber(majorSpillCount, 0)}</strong>
              </div>
            </div>
            <div className="home-premium-insight-interpretation">
              Spill activity indicates elevated risk zones in monitored sectors.
            </div>
          </div>
          
          <div className="home-premium-insight-card pollution-theme interactive-element glass-panel">
            <div className="home-premium-insight-content">
              <div className="home-premium-insight-title">Pollution Insights</div>
              <div className="home-premium-insight-row">
                <span>Total sites</span>
                <strong>{formatNumber(pollutionStats?.totalSites || 0, 0)}</strong>
              </div>
              <div className="home-premium-insight-row">
                <span>High severity</span>
                <strong>{formatNumber(pollutionStats?.highSeverityCount || 0, 0)}</strong>
              </div>
            </div>
            <div className="home-premium-insight-interpretation">
              Pollution concentration levels demand rapid intervention responses.
            </div>
          </div>
        </div>
      </div>

      <div className="home-premium-side-right">
        <div className="home-premium-floating-fact">
          &ldquo;{quote}&rdquo;
        </div>

        <div className="home-premium-updates interactive-element glass-panel">
          <div className="home-premium-updates-header">Live Updates</div>
          <div className="home-premium-updates-feed" aria-live="polite">
            {updateItems.map((item) => (
              <div key={item.id} className="home-premium-update interactive-element">
                <div className="home-premium-update-title">{item.label}</div>
                <div className="home-premium-update-meta">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>
        {`
          .home-premium {
            position: relative;
            min-height: 100vh;
            overflow: hidden;
            padding: 0 40px;
            color: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }

          .home-premium-background {
            position: fixed;
            inset: 0;
            z-index: 0;
            overflow: hidden;
          }

          .home-premium-base {
            position: absolute;
            inset: 0;
            background: linear-gradient(140deg, #02040a 0%, #030a16 35%, #051426 65%, #010208 100%);
          }

          .home-premium-swell {
            position: absolute;
            inset: -20%;
            background: radial-gradient(circle at 30% 40%, rgba(28, 80, 120, 0.1), transparent 55%),
              radial-gradient(circle at 70% 70%, rgba(10, 40, 80, 0.2), transparent 60%);
            animation: oceanDrift 60s ease-in-out infinite;
            opacity: 0.7;
            will-change: transform;
          }

          .home-premium-ripple {
            --ripple-x: 50%;
            --ripple-y: 50%;
            --ripple-opacity: 0;
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at var(--ripple-x) var(--ripple-y), rgba(64, 224, 208, 0.15), transparent 50%);
            opacity: var(--ripple-opacity);
            transition: opacity 0.4s cubic-bezier(0.2, 0, 0.3, 1);
            pointer-events: none;
            will-change: opacity;
          }

          .glass-panel {
            background: rgba(10, 22, 40, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(28px) saturate(160%);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          }

          .interactive-element {
            transition: transform 0.4s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.4s ease, opacity 0.4s ease;
            will-change: transform, opacity;
          }

          .interactive-element:active {
            transform: scale(0.98) !important;
            box-shadow: 0 0 30px rgba(64, 224, 208, 0.4) !important;
          }

          .home-premium-dashboard {
            position: fixed;
            top: 32px;
            left: 50%;
            transform: translateX(-50%);
            display: inline-flex;
            align-items: center;
            padding: 12px 28px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-decoration: none;
            color: #f1f5f9;
            font-size: 13px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            font-weight: 600;
            background: rgba(8, 16, 28, 0.6);
            backdrop-filter: blur(16px);
            z-index: 10;
          }

          .home-premium-dashboard:hover {
            transform: translateX(-50%) scale(1.05);
            box-shadow: 0 0 30px rgba(34, 82, 120, 0.6);
            color: #fff;
          }

          .home-premium-center {
            position: relative;
            z-index: 2;
            width: 100%;
            max-width: 580px;
            pointer-events: none;
            margin-bottom: 120px;
          }

          .home-premium-hero {
            pointer-events: auto;
            padding: 40px 50px;
            border-radius: 32px;
            background: rgba(10, 22, 40, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(32px) saturate(180%);
            box-shadow: 0 40px 120px rgba(0, 0, 0, 0.5);
            text-align: center;
            position: relative;
            overflow: hidden;
            transform: translateY(-8%);
          }

          .home-premium-hero-title {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin-bottom: 16px;
            background: linear-gradient(to bottom, #fff, rgba(255,255,255,0.6));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 30px rgba(255,255,255,0.1);
          }

          .home-premium-hero-desc {
            font-size: 17px;
            line-height: 1.6;
            color: rgba(226, 232, 240, 0.8);
          }

          .home-premium-hero-extra {
            margin-top: 24px;
            font-size: 14px;
            color: #40E0D0;
            opacity: 0;
            transform: translateY(15px);
            transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 0, 0.2, 1);
            letter-spacing: 0.03em;
            font-weight: 500;
          }

          .home-premium-hero:hover {
            transform: translateY(-8%) scale(1.12);
            backdrop-filter: blur(40px) saturate(200%);
            box-shadow: 0 50px 150px rgba(0, 0, 0, 0.6);
          }

          .home-premium-hero:hover .home-premium-hero-extra {
            opacity: 1;
            transform: translateY(0);
          }

          .home-premium-side-left {
            position: fixed;
            left: 140px;
            bottom: 80px;
            transform: none;
            width: 38%;
            min-width: 520px;
            max-width: 680px;
            z-index: 5;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .home-premium-recovery {
            border-radius: 20px;
            padding: 16px 20px;
            width: 55%;
            transform: translateY(-150px) translateX(-110px);
            margin-left: auto;
            margin-right: auto;
          }

          .home-premium-recovery-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .home-premium-recovery-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: rgba(255,255,255,0.8);
          }

          .home-premium-recovery-goal {
            font-size: 12px;
            color: #40E0D0;
            font-weight: 600;
          }

          .home-premium-progress-container {
            height: 6px;
            background: rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 12px;
          }

          .home-premium-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #1C5078, #40E0D0);
            box-shadow: 0 0 15px rgba(64, 224, 208, 0.4);
            border-radius: 10px;
          }

          .home-premium-recovery-meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: rgba(148, 163, 184, 0.7);
          }

          .home-premium-insights {
            display: flex;
            gap: 20px;
            width: 100%;
          }

          .home-premium-insight-card {
            flex: 1;
            border-radius: 24px;
            padding: 28px;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
          }

          .home-premium-insight-card.spill-theme {
            background: linear-gradient(180deg, rgba(28, 80, 120, 0.1), rgba(10, 22, 40, 0.4));
          }
          .home-premium-insight-card.pollution-theme {
            background: linear-gradient(180deg, rgba(64, 224, 208, 0.05), rgba(10, 22, 40, 0.4));
          }

          .home-premium-insight-content {
            display: flex;
            flex-direction: column;
            gap: 16px;
            transition: opacity 0.3s ease;
            will-change: opacity;
          }

          .home-premium-insight-interpretation {
            position: absolute;
            inset: 0;
            padding: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-size: 15px;
            line-height: 1.6;
            color: #E2E8F0;
            font-weight: 500;
            opacity: 0;
            transform: scale(0.95);
            transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 0, 0.2, 1);
            background: inherit;
            backdrop-filter: blur(10px);
            will-change: opacity, transform;
          }

          .home-premium-insight-card:hover {
            transform: scale(1.06);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 20px rgba(64, 224, 208, 0.15);
            border-color: rgba(64, 224, 208, 0.3);
          }

          .home-premium-insight-card:hover .home-premium-insight-content {
            opacity: 0;
          }

          .home-premium-insight-card:hover .home-premium-insight-interpretation {
            opacity: 1;
            transform: scale(1);
          }

          .home-premium-insight-title {
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #f1f5f9;
            margin-bottom: 8px;
          }

          .home-premium-insight-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 14px;
            color: rgba(148, 163, 184, 0.9);
          }

          .home-premium-insight-row strong {
            font-size: 24px;
            color: #fff;
            font-weight: 700;
          }

          .home-premium-side-right {
            position: fixed;
            right: 60px;
            bottom: 50%;
            transform: translateY(50%);
            width: 320px;
            z-index: 5;
            display: flex;
            flex-direction: column;
            gap: 40px;
            align-items: flex-end;
          }

          .home-premium-floating-fact {
            font-size: 17px;
            font-style: italic;
            color: rgba(226, 232, 240, 0.8);
            text-align: right;
            line-height: 1.6;
            animation: slowFloat 4s ease-in-out infinite;
            text-shadow: 0 0 20px rgba(64, 224, 208, 0.4);
            margin-right: 10px;
            font-weight: 500;
          }

          .home-premium-updates {
            width: 90%;
            transform: translateY(30%);
            padding: 24px;
            border-radius: 24px;
          }

          .home-premium-updates-header {
            font-size: 13px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 20px;
          }

          .home-premium-updates-feed {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 280px;
            overflow-y: auto;
            scrollbar-width: none;
            padding-right: 4px;
          }

          .home-premium-updates-feed::-webkit-scrollbar {
            display: none;
          }

          .home-premium-update {
            padding: 16px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
          }

          .home-premium-update:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.1);
            transform: translateX(-4px);
          }

          .home-premium-update-title {
            font-size: 13px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 6px;
          }

          .home-premium-update-meta {
            font-size: 12px;
            color: rgba(148, 163, 184, 0.7);
          }

          @keyframes oceanDrift {
            0%, 100% { transform: translate3d(0, 0, 0); }
            50% { transform: translate3d(-3%, 2%, 0); }
          }

          @keyframes slowFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
    </section>
  );
}

export default HomePage;
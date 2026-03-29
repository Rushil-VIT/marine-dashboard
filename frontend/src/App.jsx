
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import {
  FaHome,
  FaTachometerAlt,
  FaMapMarkedAlt,
  FaChartBar,
  FaLightbulb,
  FaCog,
} from "react-icons/fa";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import SettingsPage from "./pages/SettingsPage";
import { SpillProvider } from "./context/SpillContext";
import { ThemeProvider } from "./context/ThemeContext";
import ModeSwitch from "./components/ModeSwitch";

/* Main App Layout with Vertical Sidebar */
function App() {
  return (
    <ThemeProvider>
      <SpillProvider>
        <Router>
          <div className="app-layout">

          {/* Sidebar Navigation */}
          <aside className="sidebar">
            <h2 className="logo">MM</h2>

            <ModeSwitch />

            <nav className="nav-links">
              <NavLink to="/" end aria-label="Home" title="Home">
                <FaHome />
              </NavLink>
              <NavLink to="/dashboard" aria-label="Dashboard" title="Dashboard">
                <FaTachometerAlt />
              </NavLink>
              <NavLink to="/map" aria-label="Map" title="Map">
                <FaMapMarkedAlt />
              </NavLink>
              <NavLink to="/analysis" aria-label="Analysis" title="Analysis">
                <FaChartBar />
              </NavLink>
              <NavLink to="/recommendations" aria-label="Recommendations" title="Recommendations">
                <FaLightbulb />
              </NavLink>
              <NavLink to="/settings" aria-label="Settings" title="Settings">
                <FaCog />
              </NavLink>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/analysis" element={<AnalyticsPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>

          </div>
        </Router>
      </SpillProvider>
    </ThemeProvider>
  );
}

export default App;
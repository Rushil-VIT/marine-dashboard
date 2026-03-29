import React, { useState, useEffect } from "react";
import { fetchWinds, fetchWaves } from "../api/spillService";

/* Weather conditions panel - Data driven */
function WeatherPanel() {
  const [weatherData, setWeatherData] = useState({
    windSpeed: "--",
    waveHeight: "--",
    temperature: "26°C (Est)",
    visibility: "15 km (Est)",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadWeather() {
      try {
        setLoading(true);
        const [windRes, waveRes] = await Promise.all([
          fetchWinds(),
          fetchWaves()
        ]);
        
        if (mounted) {
          const winds = windRes.data?.data || [];
          const waves = waveRes.data?.data || [];
          
          let avgWind = 0;
          if (winds.length > 0) {
            avgWind = winds.reduce((sum, w) => sum + (w.properties?.WSM || 0), 0) / winds.length;
          }
          
          let avgWave = 0;
          if (waves.length > 0) {
            avgWave = waves.reduce((sum, w) => sum + (w.properties?.SWH || 0), 0) / waves.length;
          }

          setWeatherData(prev => ({
            ...prev,
            windSpeed: avgWind > 0 ? `${avgWind.toFixed(1)} m/s` : "--",
            waveHeight: avgWave > 0 ? `${avgWave.toFixed(1)} m` : "--",
          }));
        }
      } catch (err) {
        console.error("Failed to load weather data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadWeather();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="weather-panel">
      <h2 className="weather-title">
        Weather Conditions {loading && <span style={{fontSize:'0.6em', opacity: 0.7}}>(Loading...)</span>}
      </h2>

      <div className="weather-cards-container">
        <div className="weather-card">
          <h3 className="weather-card-title">Avg Wind Speed</h3>
          <p className="weather-card-value">{weatherData.windSpeed}</p>
        </div>

        <div className="weather-card">
          <h3 className="weather-card-title">Avg Wave Height</h3>
          <p className="weather-card-value">{weatherData.waveHeight}</p>
        </div>

        <div className="weather-card">
          <h3 className="weather-card-title">Temperature</h3>
          <p className="weather-card-value">{weatherData.temperature}</p>
        </div>

        <div className="weather-card">
          <h3 className="weather-card-title">Visibility</h3>
          <p className="weather-card-value">{weatherData.visibility}</p>
        </div>
      </div>
    </div>
  );
}

export default WeatherPanel;
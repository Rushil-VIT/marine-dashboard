import axios from "axios";

/**
 * API Service Layer — All backend communication centralized here.
 * Base URL points to Express backend on port 5000.
 */
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
});

/* ─── Spill Endpoints ─────────────────────────────────── */

export const fetchAllSpills = () => API.get("/spills");

export const fetchSpillById = (id) => API.get(`/spills/${id}`);

export const fetchSpillTrends = () => API.get("/spills/trends");

export const fetchSpillStats = () => API.get("/spills/stats");

export const fetchNearbySpills = (lat, lng, maxDistance = 500000) =>
  API.get(`/spills/near?lat=${lat}&lng=${lng}&maxDistance=${maxDistance}`);

/* ─── Environment Endpoints ───────────────────────────── */

export const fetchWinds = () => API.get("/environment/winds");

export const fetchWaves = () => API.get("/environment/waves");

export const fetchCurrents = () => API.get("/environment/currents");

export const fetchEEZ = () => API.get("/environment/eez");

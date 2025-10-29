import axios from "axios";

// Hardcode backend API to avoid env mismatch during setup
const API = axios.create({ baseURL: "https://backend-62567aubr-suraj-kumars-projects-bcd2fc14.vercel.app/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("gn_token");          
export const reportEmergency = (data) => API.post("/report", data);
export const getHistory = () => API.get("/history");
export const getIncidentHistory = () => API.get("/history/incidents");

export const listUnits = () => API.get("/admin/units");
export const upsertUnit = (payload) => API.post("/admin/units", payload);
export const toggleUnit = (payload) => API.post("/admin/units/toggle", payload);

export default API;

import axios from "axios";

// Hardcode backend API to avoid env mismatch during setup
const API = axios.create({ baseURL: "http://localhost:5000/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("gn_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authGoogle = (payload) => API.post("/auth/google", payload);
export const setRole = (payload) => API.post("/auth/role", payload);
export const emailRegister = (payload) => API.post("/auth/email/register", payload);
export const emailLogin = (payload) => API.post("/auth/email/login", payload);

export const reportEmergency = (data) => API.post("/report", data);
export const getHistory = () => API.get("/history");

export const listUnits = () => API.get("/admin/units");
export const upsertUnit = (payload) => API.post("/admin/units", payload);
export const toggleUnit = (payload) => API.post("/admin/units/toggle", payload);

export default API;

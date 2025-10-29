import axios from "axios";

const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_BASE || "http://localhost:5000/api",
  withCredentials: true // Important for session cookies
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("gn_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Session History API calls
export const getSessionHistory = () => API.get("/session/history");
export const updatePreferences = (preferences) => API.put("/session/preferences", { preferences });
export const getRecentActivity = (limit = 10) => API.get(`/session/activity?limit=${limit}`);
export const clearSessionHistory = () => API.delete("/session/clear");
export const getSessionStats = () => API.get("/session/stats");

// Local storage helpers for client-side session data
export const saveToLocalHistory = (data) => {
  try {
    const existingHistory = getLocalHistory();
    const newHistory = {
      ...existingHistory,
      ...data,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem("guardiannet_session_history", JSON.stringify(newHistory));
  } catch (error) {
    console.error("Error saving to local history:", error);
  }
};

export const getLocalHistory = () => {
  try {
    const history = localStorage.getItem("guardiannet_session_history");
    return history ? JSON.parse(history) : {
      pageVisits: [],
      incidentReports: [],
      preferences: {},
      lastUpdated: null
    };
  } catch (error) {
    console.error("Error getting local history:", error);
    return {
      pageVisits: [],
      incidentReports: [],
      preferences: {},
      lastUpdated: null
    };
  }
};

export const addPageVisit = (page, duration = 0) => {
  const history = getLocalHistory();
  const pageVisit = {
    page,
    timestamp: new Date().toISOString(),
    duration
  };
  
  history.pageVisits = history.pageVisits || [];
  history.pageVisits.push(pageVisit);
  
  // Keep only last 50 page visits
  if (history.pageVisits.length > 50) {
    history.pageVisits = history.pageVisits.slice(-50);
  }
  
  saveToLocalHistory(history);
};

export const addIncidentReport = (incidentData) => {
  const history = getLocalHistory();
  const incidentReport = {
    ...incidentData,
    timestamp: new Date().toISOString(),
    id: `local_${Date.now()}`
  };
  
  history.incidentReports = history.incidentReports || [];
  history.incidentReports.push(incidentReport);
  
  // Keep only last 20 incident reports
  if (history.incidentReports.length > 20) {
    history.incidentReports = history.incidentReports.slice(-20);
  }
  
  saveToLocalHistory(history);
};

export const updateLocalPreferences = (preferences) => {
  const history = getLocalHistory();
  history.preferences = { ...history.preferences, ...preferences };
  saveToLocalHistory(history);
};

export const clearLocalHistory = () => {
  localStorage.removeItem("guardiannet_session_history");
};

// Session tracking utilities
export const trackPageVisit = (page) => {
  addPageVisit(page);
  
  // Also track on server if user is logged in
  const token = localStorage.getItem("gn_token");
  if (token) {
    // This will be handled by the session middleware on the server
    // We just need to make sure the user is authenticated
  }
};

export const trackIncidentReport = (incidentData) => {
  addIncidentReport(incidentData);
  
  // Also track on server if user is logged in
  const token = localStorage.getItem("gn_token");
  if (token) {
    // This will be handled by the session middleware on the server
  }
};

// Cookie helpers
export const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export default API;

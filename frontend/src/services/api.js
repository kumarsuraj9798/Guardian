import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export const reportEmergency = (data) => API.post("/report", data);
export const getHistory = () => API.get("/history");

export default API;

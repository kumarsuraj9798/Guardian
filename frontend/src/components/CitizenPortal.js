import React, { useMemo, useState, useEffect } from "react";
import { reportEmergency, getIncidentHistory } from "../services/api";
import io from "socket.io-client";
import LiveMap from "./LiveMap";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

export default function CitizenPortal() {
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState([]); // {type, content}
  const [coords, setCoords] = useState([77.209, 28.6139]); // [lng, lat] default Delhi
  const [activeIncident, setActiveIncident] = useState(null);
  const [assignedUnit, setAssignedUnit] = useState(null);
  const [incidentHistory, setIncidentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLiveTracking, setShowLiveTracking] = useState(false);

  useMemo(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
      });
    }
  }, []);

  // Load incident history on component mount
  useEffect(() => {
    loadIncidentHistory();
  }, []);

  const loadIncidentHistory = async () => {
    try {
      const response = await getIncidentHistory();
      setIncidentHistory(response.data || []);
    } catch (error) {
      console.error("Failed to load incident history:", error);
    }
  };

  const onFile = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setMedia((m) => [...m, { type, content: b64 }]);
  };

  const onReport = async () => {
    const payload = {
      description,
      media,
      location: { type: "Point", coordinates: coords },
    };
    const res = await reportEmergency(payload);
    const inc = res.data.incident;
    setActiveIncident(inc);
    setAssignedUnit(res.data.assignedUnit || null);
    socket.emit("join-incident", inc._id);
    
    // Refresh incident history after reporting
    loadIncidentHistory();
  };

  // Live updates
  useMemo(() => {
    const handler = (update) => {
      if (activeIncident && update.incidentId === activeIncident._id) {
        setActiveIncident((prev) => ({ ...prev, status: update.status, assignedUnitId: update.assignedUnitId }));
      }
    };
    socket.on("incident:update", handler);
    return () => socket.off("incident:update", handler);
  }, [activeIncident]);

  return (
    <div className="citizen-portal" style={{ padding: 24 }}>
      <h2>Report an Incident</h2>
      
      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "2px solid #e0e0e0" }}>
        <button 
          className={`tab-button ${!showHistory && !showLiveTracking ? 'active' : ''}`}
          onClick={() => { setShowHistory(false); setShowLiveTracking(false); }}
        >
          Report Incident
        </button>
        <button 
          className={`tab-button ${showHistory ? 'active' : ''}`}
          onClick={() => { setShowHistory(true); setShowLiveTracking(false); }}
        >
          My Incident History
        </button>
        <button 
          className={`tab-button ${showLiveTracking ? 'active' : ''}`}
          onClick={() => { setShowHistory(false); setShowLiveTracking(true); }}
        >
          Live Tracking
        </button>
      </div>

      {/* Report Incident Tab */}
      {!showHistory && !showLiveTracking && (
        <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
          <textarea
            placeholder="Describe what happened"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: 12, borderRadius: 12, border: "1px solid #90caf9", minHeight: "120px" }}
          />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label style={pillStyle}>Image<input type="file" accept="image/*" onChange={(e) => onFile(e, "image")} style={{ display: "none" }} /></label>
            <label style={pillStyle}>Video<input type="file" accept="video/*" onChange={(e) => onFile(e, "video")} style={{ display: "none" }} /></label>
            <label style={pillStyle}>Audio<input type="file" accept="audio/*" onChange={(e) => onFile(e, "audio")} style={{ display: "none" }} /></label>
          </div>
          <button onClick={onReport} style={ctaStyle}>AI Smart Dispatch</button>
        </div>
      )}

      {/* Incident History Tab */}
      {showHistory && (
        <div className="incident-history">
          <h3>Your Incident History</h3>
          {incidentHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              No incidents reported yet
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {incidentHistory.map((incident, index) => (
                <div key={incident._id || index} className="incident-card">
                  <div className="incident-header">
                    <span className="incident-id">#{incident._id?.slice(-6) || index + 1}</span>
                    <span className={`status-badge ${incident.status}`}>{incident.status || "reported"}</span>
                  </div>
                  <div className="incident-description">{incident.description}</div>
                  <div className="incident-details">
                    <span>Service: {incident.classifiedService || "Detecting..."}</span>
                    <span>Date: {new Date(incident.createdAt).toLocaleDateString()}</span>
                    <span>Time: {new Date(incident.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {incident.assignedUnit && (
                    <div className="assigned-unit">
                      <strong>Assigned Unit:</strong> {incident.assignedUnit.type} - {incident.assignedUnit.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Tracking Tab */}
      {showLiveTracking && (
        <div className="live-tracking">
          <h3>Live Unit Tracking</h3>
          {activeIncident ? (
            <div>
              <div style={{ background: "#e3f2fd", padding: 16, borderRadius: 12, marginBottom: 12 }}>
                <b>Current Incident Status:</b> {activeIncident.status || "reported"} • Service: {activeIncident.classifiedService || "detecting"}
              </div>
              <LiveMap
                center={coords}
                incident={activeIncident}
                unit={assignedUnit}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              No active incidents to track
            </div>
          )}
        </div>
      )}

      {/* Active Incident Status (always visible if there's an active incident) */}
      {activeIncident && !showLiveTracking && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: "#e3f2fd", padding: 16, borderRadius: 12, marginBottom: 12 }}>
            <b>Active Incident Status:</b> {activeIncident.status || "reported"} • Service: {activeIncident.classifiedService || "detecting"}
            <button 
              style={{ float: "right", background: "#2196f3", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}
              onClick={() => setShowLiveTracking(true)}
            >
              View Live Tracking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const pillStyle = {
  background: "linear-gradient(135deg,#64b5f6,#1e88e5)",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 999,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(30,136,229,0.35)",
};

const ctaStyle = {
  background: "linear-gradient(135deg,#bbdefb,#2196f3)",
  color: "#0d47a1",
  padding: "14px 20px",
  border: 0,
  borderRadius: 14,
  fontWeight: 800,
  boxShadow: "0 16px 30px rgba(25,118,210,0.45)",
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

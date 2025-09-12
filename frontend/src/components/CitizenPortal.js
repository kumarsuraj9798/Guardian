import React, { useMemo, useState } from "react";
import { reportEmergency } from "../services/api";
import io from "socket.io-client";
import LiveMap from "./LiveMap";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

export default function CitizenPortal() {
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState([]); // {type, content}
  const [coords, setCoords] = useState([77.209, 28.6139]); // [lng, lat] default Delhi
  const [activeIncident, setActiveIncident] = useState(null);
  const [assignedUnit, setAssignedUnit] = useState(null);

  useMemo(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
      });
    }
  }, []);

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
      <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <textarea
          placeholder="Describe what happened"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: 12, borderRadius: 12, border: "1px solid #90caf9" }}
        />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={pillStyle}>Image<input type="file" accept="image/*" onChange={(e) => onFile(e, "image")} style={{ display: "none" }} /></label>
          <label style={pillStyle}>Video<input type="file" accept="video/*" onChange={(e) => onFile(e, "video")} style={{ display: "none" }} /></label>
          <label style={pillStyle}>Audio<input type="file" accept="audio/*" onChange={(e) => onFile(e, "audio")} style={{ display: "none" }} /></label>
        </div>
        <button onClick={onReport} style={ctaStyle}>AI Smart Dispatch</button>
      </div>

      {activeIncident && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: "#e3f2fd", padding: 16, borderRadius: 12, marginBottom: 12 }}>
            <b>Status:</b> {activeIncident.status || "reported"} • Service: {activeIncident.classifiedService || "detecting"}
          </div>
          <LiveMap
            center={coords}
            incident={activeIncident}
            unit={assignedUnit}
          />
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

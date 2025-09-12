import React, { useEffect, useState } from "react";
import { listUnits, toggleUnit, upsertUnit } from "../services/api";

export default function AdminDashboard() {
  const [units, setUnits] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("ambulance");
  const [coords, setCoords] = useState([77.209, 28.6139]);

  useEffect(() => {
    refresh();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
      });
    }
  }, []);

  async function refresh() {
    const res = await listUnits();
    setUnits(res.data.units || []);
  }

  async function onCreate() {
    await upsertUnit({ name, type, location: { type: "Point", coordinates: coords }, isActive: true });
    setName("");
    await refresh();
  }

  async function onToggle(u) {
    await toggleUnit({ id: u._id, isActive: !u.isActive });
    await refresh();
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Responder Admin</h2>
      <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <input placeholder="Unit name (e.g., CityCare Ambulance)" value={name} onChange={(e) => setName(e.target.value)} style={inp} />
        <select value={type} onChange={(e) => setType(e.target.value)} style={inp}>
          <option value="ambulance">Ambulance</option>
          <option value="hospital">Hospital</option>
        </select>
        <button onClick={onCreate} style={btn}>Register Unit</button>
      </div>

      <h3 style={{ marginTop: 24 }}>My Units</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {units.map((u) => (
          <div key={u._id} style={{ background: "#e3f2fd", padding: 12, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <b>{u.name}</b> • {u.type} • {u.isActive ? "Active" : "Inactive"}
            </div>
            <button onClick={() => onToggle(u)} style={{
              ...btn,
              background: u.isActive ? "linear-gradient(135deg,#b9f6ca,#00c853)" : "linear-gradient(135deg,#ffcdd2,#e53935)",
              color: u.isActive ? "#004d40" : "#b71c1c",
            }}>
              {u.isActive ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp = { padding: 10, borderRadius: 10, border: "1px solid #90caf9" };
const btn = { background: "linear-gradient(135deg,#bbdefb,#2196f3)", color: "#0d47a1", padding: "12px 18px", border: 0, borderRadius: 12, fontWeight: 800, boxShadow: "0 12px 22px rgba(25,118,210,0.35)" };

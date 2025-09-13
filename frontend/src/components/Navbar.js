import React from "react";

export default function Navbar({ go }) {
  return (
    <nav className="navbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "#0d47a1", color: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
      <div className="logo" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => go("landing")}>
        <img src="/logo.png" alt="GuardianNet Logo" height="40" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} />
        <span style={{ fontWeight: 800, fontSize: "20px" }}>GuardianNet</span>
      </div>
      <div className="nav-links" style={{ display: "flex", gap: 12 }}>
        <button onClick={() => go("signin")} style={btn}>Sign In</button>
        <button onClick={() => go("citizen")} style={btn}>Report</button>
        <button onClick={() => go("admin")} style={btn}>Admin</button>
        <button onClick={() => go("history")} style={btn}>History</button>
      </div>
    </nav>
  );
}

const btn = { background: "#1976d2", color: "#fff", border: 0, padding: "8px 12px", borderRadius: 10, fontWeight: 700, boxShadow: "0 6px 14px rgba(0,0,0,0.25)" };

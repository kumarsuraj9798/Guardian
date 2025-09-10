import React from "react";
// import "./AdminDashboard.css";

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <p>View and manage real-time emergency reports.</p>
      <div className="status-cards">
        <div className="card police">🚓 Police Active</div>
        <div className="card ambulance">🚑 Ambulance Active</div>
        <div className="card fire">🚒 Fire Brigade Active</div>
      </div>
    </div>
  );
}

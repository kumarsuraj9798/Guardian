import React, { useState } from "react";
// import "./RoleSelect.css";

export default function RoleSelect({ onSelect }) {
  const [role, setRole] = useState("");

  return (
    <div className="role-container">
      <h3>Select your role</h3>
      <div className="roles">
        <button onClick={() => setRole("citizen")}>Citizen</button>
        <button onClick={() => setRole("admin")}>Police / Ambulance / Fire</button>
      </div>
      {role && (
        <button className="continue-btn" onClick={() => onSelect(role)}>
          Continue as {role}
        </button>
      )}
    </div>
  );
}

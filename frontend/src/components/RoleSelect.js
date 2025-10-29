import React, { useState } from "react";
import { setRole as setRoleApi } from "../services/api";

export default function RoleSelect({ onSelect }) {
  const [role, setRole] = useState("");
  const [adminType, setAdminType] = useState("ambulance");

  const handleContinue = async () => {
    await setRoleApi({ role, adminType: role === "admin" ? adminType : undefined });
    onSelect(role);
  };

  return (
    <div className="role-container">
      <h3>Select your role</h3>
      <div className="roles">
        <button onClick={() => setRole("citizen")}>Citizen</button>
        <button onClick={() => setRole("admin")}>Admin (Hospital/Ambulance)</button>
      </div>
      {role === "admin" && (
        <div className="admin-types">
          <label>
            <input type="radio" name="adminType" value="ambulance" checked={adminType === "ambulance"}
              onChange={(e) => setAdminType(e.target.value)} /> Ambulance
          </label>
          <label>
            <input type="radio" name="adminType" value="hospital" checked={adminType === "hospital"}
              onChange={(e) => setAdminType(e.target.value)} /> Hospital
          </label>
        </div>
      )}
      {role && (
        <button className="continue-btn" onClick={handleContinue}>
          Continue as {role}
        </button>
      )}
    </div>
  );
}

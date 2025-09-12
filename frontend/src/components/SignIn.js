import React, { useEffect, useState } from "react";
import { authGoogle, emailLogin, emailRegister } from "../services/api";

export default function SignIn({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("citizen");
  const [adminType, setAdminType] = useState("ambulance");

  useEffect(() => {
    // Load Google Identity Services
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
          callback: async (resp) => {
            const res = await authGoogle({ idToken: resp.credential });
            localStorage.setItem("gn_token", res.data.token);
            onSignIn?.();
          },
        });
        const btn = document.getElementById("googleSignInDiv");
        if (btn) window.google.accounts.id.renderButton(btn, { theme: "filled_blue", size: "large", shape: "pill" });
      }
    };
    document.body.appendChild(s);
  }, [onSignIn]);

  const doEmailLogin = async () => {
    const res = await emailLogin({ email, password });
    localStorage.setItem("gn_token", res.data.token);
    onSignIn?.();
  };

  const doEmailRegister = async () => {
    const res = await emailRegister({ email, password, role, adminType: role === "admin" ? adminType : undefined });
    localStorage.setItem("gn_token", res.data.token);
    onSignIn?.();
  };

  return (
    <div className="signin-container" style={{ padding: 24 }}>
      <h2>Welcome to GuardianNet</h2>
      <div id="googleSignInDiv" style={{ marginTop: 12 }} />
      <div style={{ marginTop: 24, display: "grid", gap: 10, maxWidth: 420 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inp} />
        <div>
          <label><input type="radio" name="role" value="citizen" checked={role === "citizen"} onChange={(e) => setRole(e.target.value)} /> Citizen</label>
          <label style={{ marginLeft: 12 }}><input type="radio" name="role" value="admin" checked={role === "admin"} onChange={(e) => setRole(e.target.value)} /> Admin</label>
        </div>
        {role === "admin" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["ambulance","hospital","police","firebrigade"]).map((t) => (
              <label key={t}><input type="radio" name="admintype" value={t} checked={adminType === t} onChange={(e) => setAdminType(e.target.value)} /> {t}</label>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={doEmailLogin} style={btn}>Login</button>
          <button onClick={doEmailRegister} style={btnAlt}>Register</button>
        </div>
      </div>
    </div>
  );
}

const inp = { padding: 10, borderRadius: 10, border: "1px solid #90caf9" };
const btn = { background: "#1976d2", color: "#fff", border: 0, padding: "10px 14px", borderRadius: 10, fontWeight: 700 };
const btnAlt = { background: "#e3f2fd", color: "#0d47a1", border: 0, padding: "10px 14px", borderRadius: 10, fontWeight: 700 };

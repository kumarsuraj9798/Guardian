import React from "react";
// import "./SignIn.css";

export default function SignIn() {
  return (
    <div className="signin-container">
      <h2>Welcome to GuardianNet</h2>
      <button className="google-btn">
        <img src="/google-logo.png" alt="Google" /> Sign in with Google
      </button>
    </div>
  );
}

import React from "react";
// import "./LandingPage.css";

export default function LandingPage() {
  return (
    <section className="landing">
      <div className="hero">
        <h1>AI-Powered Emergency Response</h1>
        <p>
          GuardianNet connects citizens with police, ambulance, and fire brigade instantly 
          using AI-powered voice, image, and text analysis.
        </p>
        <button
          onClick={() => (window.location.href = "/signin")}
          className="cta-button"
        >
          Sign in with Google
        </button>
      </div>
      <div className="illustration">
        <img src="/hero-image.png" alt="Emergency Illustration" />
      </div>
    </section>
  );
}

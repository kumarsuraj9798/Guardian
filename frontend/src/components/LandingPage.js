import React from "react";

export default function LandingPage({ onSignInClick }) {
  return (
    <section className="landing-gradient" style={{ color: "#fff", padding: "60px 24px" }}>
      <div className="hero-grid">
        <div style={{ maxWidth: 640 }}>
          <h1 className="title-3d">GuardianNet</h1>
          <h2 className="subtitle">Emergency AI Response System</h2>
          <p className="lede">THE PURPOSE OF HUMAN LIFE IS TO SERVE. AND TO SHOW COMPASSION AND THE WILL TO HELP OTHERS.
-Albert Schweitzer
          </p>  
          <div className="cta-row">
            <button onClick={onSignInClick} className="btn-3d">
              Sign in • Get Help Fast
            </button>
            <img className="icon-float" src="/ambulance.png" alt="Ambulance" />
            <img className="icon-float" src="/police.png" alt="Police" />
            <img className="icon-float" src="/firebrigade.png" alt="Fire" />
          </div>
        </div>

        <div className="scene">
          <div className="card-3d">
            <img
              src="/hero-bg.jpg"
              alt="Emergency collage"
            />
            <div className="badge-row">
              <span className="badge">🚑 Ambulance</span>
              <span className="badge">🚓 Police</span>
              <span className="badge">🚒 Fire</span>
              <span className="badge">🏥 Hospital</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3 style={{ marginBottom: 12 }}>Active Incidents (demo)</h3>
        <div className="chips">
          {["Accident", "Fire", "Medical"].map((t, i) => (
            <div key={i} className="chip-3d">
              <b>{t}</b> • en route
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


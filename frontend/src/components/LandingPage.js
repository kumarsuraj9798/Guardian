import React from "react";

export default function LandingPage({ onSignInClick }) {
  return (
    <section className="landing-gradient" style={{ color: "#fff", padding: "60px 24px" }}>
      <div className="hero-grid">
        <div style={{ maxWidth: 640 }}>
          <h1 className="title-3d">GuardianNet</h1>
          <h2 className="subtitle">Emergency AI Response System</h2>
          <p className="lede">
            Instantly classify incidents from text, image, video, or audio and auto-dispatch the nearest active unit.
          </p>
          <div className="cta-row">
            <button onClick={onSignInClick} className="btn-3d">
              Sign in • Get Help Fast
            </button>
            <img className="icon-float" src="https://cdn-icons-png.flaticon.com/512/2961/2961937.png" alt="Ambulance" />
            <img className="icon-float" src="https://cdn-icons-png.flaticon.com/512/1062/1062710.png" alt="Police" />
            <img className="icon-float" src="https://cdn-icons-png.flaticon.com/512/482/482058.png" alt="Fire" />
          </div>
        </div>

        <div className="scene">
          <div className="card-3d">
            <img
              src="https://images.unsplash.com/photo-1587740896339-96e2fdf2cbc9?q=80&w=1200&auto=format&fit=crop"
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


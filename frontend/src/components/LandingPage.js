import React, { useState, useEffect } from "react";

export default function LandingPage({ onSignInClick }) {
  const [activeIncidents, setActiveIncidents] = useState([
    { type: "Medical Emergency", location: "Downtown", status: "In Progress", time: "2 min ago" },
    { type: "Fire Alert", location: "Industrial Area", status: "Responding", time: "5 min ago" },
    { type: "Traffic Accident", location: "Highway 101", status: "En Route", time: "3 min ago" },
    { type: "Security Threat", location: "City Center", status: "Investigating", time: "1 min ago" }
  ]);

  const [stats, setStats] = useState({
    totalIncidents: 1247,
    responseTime: "3.2 min",
    successRate: "98.5%",
    activeUnits: 47
  });

  const [chartData, setChartData] = useState({
    incidentTypes: [
      { name: "Medical", value: 45, color: "#ff6b6b" },
      { name: "Fire", value: 25, color: "#ffa726" },
      { name: "Accident", value: 20, color: "#42a5f5" },
      { name: "Security", value: 10, color: "#66bb6a" }
    ],
    responseTimes: [
      { hour: "00", time: 2.1 },
      { hour: "04", time: 1.8 },
      { hour: "08", time: 3.2 },
      { hour: "12", time: 2.9 },
      { hour: "16", time: 3.5 },
      { hour: "20", time: 2.7 }
    ]
  });

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-gradient hero-section">
        <div className="hero-grid">
          <div className="hero-content">
            <h1 className="title-3d">GuardianNet</h1>
            <h2 className="subtitle">AI-Powered Emergency Response System</h2>
            <p className="lede">
              "THE PURPOSE OF HUMAN LIFE IS TO SERVE. AND TO SHOW COMPASSION AND THE WILL TO HELP OTHERS."
              <br />- Albert Schweitzer
            </p>
            <div className="cta-row">
              <button onClick={onSignInClick} className="btn-3d">
                Get Started • Save Lives
              </button>
              <div className="emergency-icons">
                <img className="icon-float" src="/ambulance.png" alt="Ambulance" />
                <img className="icon-float" src="/police.png" alt="Police" />
                <img className="icon-float" src="/firebrigade.png" alt="Fire" />
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="card-3d">
              <img src="/hero-bg.jpg" alt="Emergency Response" />
              <div className="badge-row">
                <span className="badge">🚑 Medical</span>
                <span className="badge">🚓 Police</span>
                <span className="badge">🚒 Fire</span>
                <span className="badge">🏥 Hospital</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Description Section */}
      <section className="project-description">
        <div className="container">
          <h2 className="section-title">About GuardianNet</h2>
          <div className="description-grid">
            <div className="description-content">
              <h3>Revolutionary Emergency Response Technology</h3>
              <p>
                GuardianNet is an advanced AI-powered emergency response system that revolutionizes how we handle 
                crisis situations. Our platform combines cutting-edge machine learning, real-time data processing, 
                and intelligent resource allocation to ensure the fastest and most effective emergency responses.
              </p>
              <p>
                Built with modern web technologies and integrated with emergency services, GuardianNet provides 
                citizens with instant access to help while giving emergency admins the tools they need to 
                save lives more efficiently.
              </p>
            </div>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">🤖</div>
                <div className="feature-text">
                  <h4>AI-Powered Analysis</h4>
                  <p>Intelligent incident classification and priority assessment</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div className="feature-text">
                  <h4>Real-Time Response</h4>
                  <p>Instant emergency service dispatch and tracking</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <h4>Data Analytics</h4>
                  <p>Comprehensive reporting and performance metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Functionality Showcase */}
      <section className="functionality-showcase">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="workflow-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Emergency Detection</h3>
                <p>AI analyzes incoming reports, media, and sensor data to identify and classify emergencies</p>
                <div className="step-visual">
                  <div className="detection-animation">
                    <div className="pulse-dot"></div>
                    <div className="scan-lines"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Intelligent Routing</h3>
                <p>System automatically assigns the nearest and most appropriate emergency units</p>
                <div className="step-visual">
                  <div className="routing-map">
                    <div className="location-dot start"></div>
                    <div className="location-dot end"></div>
                    <div className="route-line"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Real-Time Tracking</h3>
                <p>Live monitoring of response units and incident status updates</p>
                <div className="step-visual">
                  <div className="tracking-dashboard">
                    <div className="status-indicator active"></div>
                    <div className="progress-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics and Charts Section */}
      <section className="stats-section">
        <div className="container">
          <h2 className="section-title">System Performance</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.totalIncidents}</div>
              <div className="stat-label">Total Incidents Handled</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.responseTime}</div>
              <div className="stat-label">Average Response Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.successRate}</div>
              <div className="stat-label">Success Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.activeUnits}</div>
              <div className="stat-label">Active Units</div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-container">
              <h3>Incident Types Distribution</h3>
              <div className="pie-chart">
                {chartData.incidentTypes.map((item, index) => (
                  <div 
                    key={index}
                    className="pie-segment"
                    style={{
                      '--percentage': item.value,
                      '--color': item.color,
                      '--offset': chartData.incidentTypes.slice(0, index).reduce((acc, curr) => acc + curr.value, 0)
                    }}
                  >
                    <div className="segment-label">{item.name}</div>
                    <div className="segment-value">{item.value}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-container">
              <h3>Response Time by Hour</h3>
              <div className="bar-chart">
                {chartData.responseTimes.map((item, index) => (
                  <div key={index} className="bar-item">
                    <div 
                      className="bar"
                      style={{ height: `${(item.time / 4) * 100}%` }}
                    ></div>
                    <div className="bar-label">{item.hour}:00</div>
                    <div className="bar-value">{item.time}m</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Incidents Section */}
      <section className="live-incidents">
        <div className="container">
          <h2 className="section-title">Live Emergency Dashboard</h2>
          <div className="incidents-grid">
            {activeIncidents.map((incident, index) => (
              <div key={index} className="incident-card">
                <div className="incident-header">
                  <h4>{incident.type}</h4>
                  <span className={`status-badge ${incident.status.toLowerCase().replace(' ', '-')}`}>
                    {incident.status}
                  </span>
                </div>
                <div className="incident-details">
                  <p><strong>Location:</strong> {incident.location}</p>
                  <p><strong>Time:</strong> {incident.time}</p>
                </div>
                <div className="incident-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.random() * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Experience the Future of Emergency Response?</h2>
          <p>Join thousands of users who trust GuardianNet for their safety</p>
          <button onClick={onSignInClick} className="btn-3d cta-button">
            Start Using GuardianNet Now
          </button>
        </div>
      </section>
    </div>
  );
}


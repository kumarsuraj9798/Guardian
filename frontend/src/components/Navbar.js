import React, { useState } from "react";

export default function Navbar({ go, isAuthenticated, user, onLogout }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    onLogout();
    setShowMobileMenu(false);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <nav className="navbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "#0d47a1", color: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
      <div className="logo" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => go("landing")}>
        <img src="/logo.png" alt="GuardianNet Logo" height="40" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} />
        <span style={{ fontWeight: 800, fontSize: "20px" }}>GuardianNet</span>
      </div>
      
      {/* Desktop Navigation */}
      <div className="nav-links desktop-nav" style={{ display: "flex", gap: 12 }}>
        {!isAuthenticated ? (
          <>
            <button onClick={() => go("signin")} style={btn}>Sign In</button>
            <button onClick={() => go("landing")} style={btn}>About</button>
          </>
        ) : (
          <>
            {user?.role === 'admin' ? (
              // Admin navigation - limited options (responder functionality)
              <>
                <button onClick={() => go("map")} style={btn}>Live Map</button>
                <button onClick={() => go("analytics")} style={btn}>Analytics</button>
                <button onClick={() => go("admin")} style={btn}>Admin Dashboard</button>
                <button onClick={() => go("history")} style={btn}>Work History</button>
              </>
            ) : (
              // Citizen navigation - full options
              <>
                <button onClick={() => go("citizen")} style={btn}>Report Emergency</button>
                <button onClick={() => go("map")} style={btn}>Live Map</button>
                <button onClick={() => go("analytics")} style={btn}>Analytics</button>
                <button onClick={() => go("admin")} style={btn}>Admin Dashboard</button>
                <button onClick={() => go("history")} style={btn}>History</button>
              </>
            )}
            <div className="user-menu" style={{ position: "relative", display: "inline-block" }}>
              <button 
                onClick={toggleMobileMenu}
                style={{...btn, display: "flex", alignItems: "center", gap: "8px"}}
              >
                <span>👤</span>
                <span>{user?.name || user?.email || 'User'}</span>
                <span>▼</span>
              </button>
              {showMobileMenu && (
                <div className="dropdown-menu" style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  background: "white",
                  color: "#333",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: "8px 0",
                  minWidth: "150px",
                  zIndex: 1000
                }}>
                  <button 
                    onClick={() => { go("profile"); setShowMobileMenu(false); }}
                    style={{...dropdownBtn, width: "100%"}}
                  >
                    Profile
                  </button>
                  <button 
                    onClick={() => { go("settings"); setShowMobileMenu(false); }}
                    style={{...dropdownBtn, width: "100%"}}
                  >
                    Settings
                  </button>
                  <hr style={{ margin: "8px 0", border: "none", borderTop: "1px solid #eee" }} />
                  <button 
                    onClick={handleLogout}
                    style={{...dropdownBtn, width: "100%", color: "#d32f2f"}}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={toggleMobileMenu}
        style={{
          display: "none",
          background: "transparent",
          border: "none",
          color: "white",
          fontSize: "24px",
          cursor: "pointer"
        }}
      >
        ☰
      </button>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="mobile-nav" style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#0d47a1",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 1000
        }}>
          {!isAuthenticated ? (
            <>
              <button onClick={() => { go("signin"); setShowMobileMenu(false); }} style={{...btn, width: "100%", marginBottom: "10px"}}>Sign In</button>
              <button onClick={() => { go("landing"); setShowMobileMenu(false); }} style={{...btn, width: "100%"}}>About</button>
            </>
          ) : (
            <>
              {user?.role === 'admin' ? (
                // Admin mobile navigation - limited options (responder functionality)
                <>
                  <button onClick={() => { go("map"); setShowMobileMenu(false); }} style={{...btn, width: "100%", marginBottom: "10px"}}>Live Map</button>
                  <button onClick={() => { go("analytics"); setShowMobileMenu(false); }} style={{...btn, width: "100%", marginBottom: "10px"}}>Analytics</button>
                  <button onClick={() => { go("admin"); setShowMobileMenu(false); }} style={{...btn, width: "100%", marginBottom: "10px"}}>Admin Dashboard</button>
                  <button onClick={() => { go("history"); setShowMobileMenu(false); }} style={{...btn, width: "100%", marginBottom: "10px"}}>Work History</button>
                </>
              ) : (
                // Citizen mobile navigation - full options
                <>
                  <button onClick={() => { go("citizen"); setShowMobileMenu(false); }} style={{...btn, width: "100%", marginBottom: "10px"}}>Report Emergency</button>
                  <button onClick={() => { go("map"); setShowMobileMenu(false); }} style={{...btn, width: "100%", marginBottom: "10px"}}>Live Map</button>
                  <button onClick={() => { go("analytics"); setShowMobileMenu(false); }} style={{...btn, width: "100%", marginBottom: "10px"}}>Analytics</button>
                  <button onClick={() => { go("admin"); setShowMobileMenu(false); }} style={{...btn, width: "100%", marginBottom: "10px"}}>Admin Dashboard</button>
                  <button onClick={() => { go("history"); setShowMobileMenu(false); }} style={{...btn, width: "100%", marginBottom: "10px"}}>History</button>
                </>
              )}
              <hr style={{ margin: "15px 0", border: "none", borderTop: "1px solid rgba(255,255,255,0.2)" }} />
              <div style={{ color: "white", marginBottom: "10px" }}>
                <strong>Welcome, {user?.name || user?.email || 'User'}!</strong>
              </div>
              <button onClick={handleLogout} style={{...btn, width: "100%", background: "#d32f2f"}}>Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

const btn = { 
  background: "#1976d2", 
  color: "#fff", 
  border: 0, 
  padding: "8px 12px", 
  borderRadius: 10, 
  fontWeight: 700, 
  boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
  cursor: "pointer",
  transition: "all 0.3s ease"
};

const dropdownBtn = {
  background: "transparent",
  border: "none",
  padding: "8px 16px",
  textAlign: "left",
  cursor: "pointer",
  transition: "background 0.3s ease"
};

// Mobile responsive styles
const mobileStyles = `
  @media (max-width: 768px) {
    .desktop-nav {
      display: none !important;
    }
    
    .mobile-menu-btn {
      display: block !important;
    }
  }
  
  @media (min-width: 769px) {
    .mobile-nav {
      display: none !important;
    }
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = mobileStyles;
  document.head.appendChild(styleSheet);
}

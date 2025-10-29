import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css"; // Import the stylesheet

export default function Navbar({ go, isAuthenticated, user, onLogout }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  
  const userMenuRef = useRef(null);
  const servicesMenuRef = useRef(null);

  // Effect to close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target)) {
        setShowServicesMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuRef, servicesMenuRef]);

  const handleLogout = () => {
    onLogout();
    setShowMobileMenu(false);
    setShowUserMenu(false);
  };

  const handleLinkClick = (page) => {
    go(page);
    setShowMobileMenu(false);
    setShowUserMenu(false);
    setShowServicesMenu(false);
  };
  
  const handleScrollToAbout = () => {
    go("landing");
    setShowMobileMenu(false);
    setTimeout(() => {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        window.scrollTo({
          top: aboutSection.offsetTop - 80, // Adjust for header height
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const renderNavLinks = () => {
    if (!isAuthenticated) {
      return (
        <>
          <div className="nav-item dropdown" ref={servicesMenuRef}>
            <button className="nav-btn" onClick={() => setShowServicesMenu(!showServicesMenu)}>
              Our Services <span className="dropdown-arrow">▼</span>
            </button>
            {showServicesMenu && (
              <div className="dropdown-menu services-dropdown">
                <button onClick={() => alert("Police Services Page")}>Police</button>
                <button onClick={() => alert("Ambulance Services Page")}>Ambulance</button>
                <button onClick={() => alert("Fire Brigade Services Page")}>Fire Brigade</button>
                <button onClick={() => alert("Hospital Services Page")}>Hospital</button>
              </div>
            )}
          </div>
          <button onClick={handleScrollToAbout} className="nav-btn">About</button>
          <button onClick={() => handleLinkClick("signin")} className="nav-btn">Sign In</button>
        </>
      );
    } else if (user?.role === 'admin') {
      return (
        <>
          <button onClick={() => handleLinkClick("map")} className="nav-btn">Live Map</button>
          <button onClick={() => handleLinkClick("analytics")} className="nav-btn">Analytics</button>
          <button onClick={() => handleLinkClick("admin")} className="nav-btn">Admin Dashboard</button>
          <button onClick={() => handleLinkClick("history")} className="nav-btn">Work History</button>
        </>
      );
    } else { // Citizen
      return (
        <>
          <button onClick={() => handleLinkClick("citizen")} className="nav-btn">Report Emergency</button>
          <button onClick={() => handleLinkClick("map")} className="nav-btn">Live Map</button>
          <button onClick={() => handleLinkClick("history")} className="nav-btn">History</button>
        </>
      );
    }
  };

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => handleLinkClick("landing")}>
        <img src="/logo.png" alt="GuardianNet Logo" height="40" />
        <span>GuardianNet</span>
      </div>
      
      <div className="desktop-nav">
        {renderNavLinks()}
        {isAuthenticated && (
          <div className="user-menu" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="nav-btn user-btn">
              <span className="user-icon">👤</span>
              <span>{user?.name || user?.email || 'User'}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {showUserMenu && (
              <div className="dropdown-menu">
                <button onClick={() => handleLinkClick("profile")}>Profile</button>
                <button onClick={() => handleLinkClick("settings")}>Settings</button>
                <hr />
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            )}
          </div>
        )}
      </div>

      <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
        {showMobileMenu ? '✕' : '☰'}
      </button>

      {showMobileMenu && (
        <div className="mobile-nav">
          {renderNavLinks()}
          {isAuthenticated && (
            <>
              <hr />
              <div className="mobile-user-info">
                Welcome, {user?.name || user?.email || 'User'}!
              </div>
              <button onClick={() => handleLinkClick("profile")}>Profile</button>
              <button onClick={() => handleLinkClick("settings")}>Settings</button>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
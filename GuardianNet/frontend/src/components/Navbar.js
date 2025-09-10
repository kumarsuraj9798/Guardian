import React from "react";
// import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        <img src="/logo.png" alt="GuardianNet Logo" height="40" />
        <span>GuardianNet</span>
      </div>
      <div className="nav-links">
        <a href="#about">About</a>
        <a href="#roles">Roles</a>
        <a href="#contact">Contact</a>
      </div>
    </nav>
  );
}

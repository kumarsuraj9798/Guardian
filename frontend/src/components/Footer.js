import React from "react";
import "./LandingPage.css";

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} GuardianNet - Smart Emergency Response</p>
    </footer>
  );
}

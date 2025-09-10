import React from "react";
// import "./CitizenPortal.css";

export default function CitizenPortal() {
  return (
    <div className="citizen-portal">
      <h2>Citizen Portal</h2>
      <p>Report emergencies via text, voice, image, or video.</p>
      <div className="options">
        <button>Report Text</button>
        <button>Upload Image</button>
        <button>Upload Video</button>
        <button>Record Audio</button>
      </div>
    </div>
  );
}

import React, { useMemo, useState, useEffect } from "react";
import { reportEmergency, getIncidentHistory } from "../services/api";
import io from "socket.io-client";
import LiveMap from "./LiveMap";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

export default function CitizenPortal() {
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState([]); // {type, content, name, size}
  const [coords, setCoords] = useState([77.209, 28.6139]); // [lng, lat] default Delhi
  const [activeIncident, setActiveIncident] = useState(null);
  const [assignedUnit, setAssignedUnit] = useState(null);
  const [incidentHistory, setIncidentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState("");
  const [showMediaOptions, setShowMediaOptions] = useState({
    image: false,
    video: false,
    audio: false,
    voice: false
  });

  useMemo(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
      });
    }
  }, []);

  // Load incident history on component mount
  useEffect(() => {
    loadIncidentHistory();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.media-dropdown')) {
        setShowMediaOptions({
          image: false,
          video: false,
          audio: false,
          voice: false
        });
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadIncidentHistory = async () => {
    try {
      const response = await getIncidentHistory();
      setIncidentHistory(response.data || []);
    } catch (error) {
      console.error("Failed to load incident history:", error);
    }
  };

  const onFile = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setMedia((m) => [...m, { type, content: b64, name: file.name, size: file.size }]);
  };

  const removeMedia = (index) => {
    setMedia((m) => m.filter((_, i) => i !== index));
  };

  const toggleMediaOptions = (type) => {
    setShowMediaOptions(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleFileUpload = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 
                  type === 'video' ? 'video/*' : 
                  type === 'audio' ? 'audio/*' : 'audio/*';
    input.onchange = (e) => onFile(e, type);
    input.click();
    setShowMediaOptions(prev => ({ ...prev, [type]: false }));
  };

  const handleCameraCapture = async (type) => {
    try {
      if (type === 'image') {
        await captureImage();
      } else if (type === 'video') {
        await recordVideo();
      } else if (type === 'audio' || type === 'voice') {
        await recordAudio();
      }
    } catch (error) {
      console.error('Capture failed:', error);
      alert('Camera/microphone access denied or not available');
    }
    setShowMediaOptions(prev => ({ ...prev, [type]: false }));
  };

  const captureImage = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg');
      
      setMedia((m) => [...m, { 
        type: 'image', 
        content: dataURL, 
        name: `camera_${Date.now()}.jpg`, 
        size: dataURL.length 
      }]);
      
      stream.getTracks().forEach(track => track.stop());
    });
  };

  const recordVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        setMedia((m) => [...m, { 
          type: 'video', 
          content: reader.result, 
          name: `video_${Date.now()}.webm`, 
          size: blob.size 
        }]);
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingType('video');
    
    setTimeout(() => {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingType('');
    }, 5000); // Record for 5 seconds
  };

  const recordAudio = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        setMedia((m) => [...m, { 
          type: 'audio', 
          content: reader.result, 
          name: `audio_${Date.now()}.webm`, 
          size: blob.size 
        }]);
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingType('audio');
    
    setTimeout(() => {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingType('');
    }, 5000); // Record for 5 seconds
  };

  const onReport = async () => {
    // Client-side validation
    if (!description.trim() && media.length === 0) {
      alert("Please provide either a description or upload media (image, video, audio, or voice)");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("Submitting incident report...");

    try {
      const payload = {
        description,
        media,
        location: { type: "Point", coordinates: coords },
      };
      
      const res = await reportEmergency(payload);
      const inc = res.data.incident;
      setActiveIncident(inc);
      setAssignedUnit(res.data.assignedUnit || null);
      socket.emit("join-incident", inc._id);
      
      // Clear form
      setDescription("");
      setMedia([]);
      
      // Refresh incident history
      loadIncidentHistory();
      
      // Show success message
      setSubmitMessage("Incident reported successfully! Emergency unit has been dispatched.");
      
      // Auto switch to Live Tracking tab
      setTimeout(() => {
        setShowLiveTracking(true);
        setShowHistory(false);
        setSubmitMessage("");
      }, 2000);
      
    } catch (error) {
      console.error("Report failed:", error);
      setSubmitMessage("Failed to report incident. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live updates
  useMemo(() => {
    const handler = (update) => {
      if (activeIncident && update.incidentId === activeIncident._id) {
        setActiveIncident((prev) => ({ ...prev, status: update.status, assignedUnitId: update.assignedUnitId }));
      }
    };
    socket.on("incident:update", handler);
    return () => socket.off("incident:update", handler);
  }, [activeIncident]);

  return (
    <div className="citizen-portal" style={{ padding: 24, maxWidth: "100%", width: "100%" }}>
      <h2>Report an Incident</h2>
      
      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "2px solid #e0e0e0" }}>
        <button 
          className={`tab-button ${!showHistory && !showLiveTracking ? 'active' : ''}`}
          onClick={() => { setShowHistory(false); setShowLiveTracking(false); }}
        >
          Report Incident
        </button>
        <button 
          className={`tab-button ${showHistory ? 'active' : ''}`}
          onClick={() => { setShowHistory(true); setShowLiveTracking(false); }}
        >
          My Incident History
        </button>
        <button 
          className={`tab-button ${showLiveTracking ? 'active' : ''}`}
          onClick={() => { setShowHistory(false); setShowLiveTracking(true); }}
        >
          Live Tracking
        </button>
      </div>

      {/* Report Incident Tab */}
      {!showHistory && !showLiveTracking && (
        <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
          <textarea
            placeholder="Describe what happened"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: 12, borderRadius: 12, border: "1px solid #90caf9", minHeight: "120px" }}
          />
          {/* Selected Media Display */}
          {media.length > 0 && (
            <div style={{ 
              background: "#f5f5f5", 
              padding: 16, 
              borderRadius: 12, 
              border: "2px dashed #90caf9",
              marginBottom: 12
            }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#1976d2" }}>Selected Media Files:</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {media.map((item, index) => (
                  <div key={index} style={{
                    background: "white",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    maxWidth: "300px"
                  }}>
                    {item.type === "image" && (
                      <img 
                        src={item.content} 
                        alt="Preview" 
                        style={{ 
                          width: 40, 
                          height: 40, 
                          objectFit: "cover", 
                          borderRadius: 4,
                          border: "1px solid #e0e0e0"
                        }} 
                      />
                    )}
                    <span style={{ 
                      background: item.type === "image" ? "#4caf50" : item.type === "video" ? "#ff9800" : "#2196f3",
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {item.type.toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {(item.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      onClick={() => removeMedia(index)}
                      style={{
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {/* Image Options */}
            <div className="media-dropdown" style={{ position: "relative" }}>
              <button 
                onClick={() => toggleMediaOptions('image')}
                style={{
                  background: "linear-gradient(135deg, #4caf50, #45a049)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                📷 Image ▼
              </button>
              
              {showMediaOptions.image && (
                <div className="media-dropdown-content">
                  <label className="media-dropdown-option" onClick={() => handleFileUpload('image')}>
                    📁 Upload from Folder
                  </label>
                  <button className="media-dropdown-option" onClick={() => handleCameraCapture('image')}>
                    📸 Take Photo
                  </button>
                </div>
              )}
            </div>

            {/* Video Options */}
            <div className="media-dropdown" style={{ position: "relative" }}>
              <button 
                onClick={() => toggleMediaOptions('video')}
                style={{
                  background: "linear-gradient(135deg, #ff9800, #f57c00)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  boxShadow: "0 4px 12px rgba(255, 152, 0, 0.3)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                🎥 Video ▼
              </button>
              
              {showMediaOptions.video && (
                <div className="media-dropdown-content">
                  <label className="media-dropdown-option" onClick={() => handleFileUpload('video')}>
                    📁 Upload from Folder
                  </label>
                  <button className="media-dropdown-option" onClick={() => handleCameraCapture('video')}>
                    🎬 Record Video
                  </button>
                </div>
              )}
            </div>

            {/* Audio Options */}
            <div className="media-dropdown" style={{ position: "relative" }}>
              <button 
                onClick={() => toggleMediaOptions('audio')}
                style={{
                  background: "linear-gradient(135deg, #2196f3, #1976d2)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                🎵 Audio ▼
              </button>
              
              {showMediaOptions.audio && (
                <div className="media-dropdown-content">
                  <label className="media-dropdown-option" onClick={() => handleFileUpload('audio')}>
                    📁 Upload from Folder
                  </label>
                  <button className="media-dropdown-option" onClick={() => handleCameraCapture('audio')}>
                    🎤 Record Audio
                  </button>
                </div>
              )}
            </div>

            {/* Voice Options */}
            <div className="media-dropdown" style={{ position: "relative" }}>
              <button 
                onClick={() => toggleMediaOptions('voice')}
                style={{
                  background: "linear-gradient(135deg, #9c27b0, #7b1fa2)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  boxShadow: "0 4px 12px rgba(156, 39, 176, 0.3)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                🎙️ Voice ▼
              </button>
              
              {showMediaOptions.voice && (
                <div className="media-dropdown-content">
                  <label className="media-dropdown-option" onClick={() => handleFileUpload('voice')}>
                    📁 Upload from Folder
                  </label>
                  <button className="media-dropdown-option" onClick={() => handleCameraCapture('voice')}>
                    🎤 Record Voice
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div style={{
              background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "12px",
              textAlign: "center",
              fontWeight: "600",
              animation: "recordingPulse 1s ease-in-out infinite"
            }}>
              🎤 Recording {recordingType}... (5 seconds)
            </div>
          )}

          {/* Submit Message */}
          {submitMessage && (
            <div style={{
              background: submitMessage.includes("successfully") ? "#4caf50" : "#f44336",
              color: "white",
              padding: "12px 20px",
              borderRadius: "12px",
              textAlign: "center",
              fontWeight: "600"
            }}>
              {submitMessage}
            </div>
          )}
          <button 
            onClick={onReport} 
            disabled={isSubmitting}
            style={{
              background: isSubmitting ? "#ccc" : "linear-gradient(135deg, #bbdefb, #2196f3)",
              color: isSubmitting ? "#666" : "#0d47a1",
              padding: "16px 24px",
              border: 0,
              borderRadius: 14,
              fontWeight: 800,
              boxShadow: isSubmitting ? "none" : "0 16px 30px rgba(25,118,210,0.45)",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "18px",
              transition: "all 0.3s ease"
            }}
          >
            {isSubmitting ? "Submitting..." : "🚨 AI Smart Dispatch"}
          </button>
        </div>
      )}

      {/* Incident History Tab */}
      {showHistory && (
        <div className="incident-history">
          <h3>Your Incident History</h3>
          {incidentHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              No incidents reported yet
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {incidentHistory.map((incident, index) => (
                <div key={incident._id || index} className="incident-card">
                  <div className="incident-header">
                    <span className="incident-id">#{incident._id?.slice(-6) || index + 1}</span>
                    <span className={`status-badge ${incident.status}`}>{incident.status || "reported"}</span>
                  </div>
                  <div className="incident-description">{incident.description}</div>
                  <div className="incident-details">
                    <span>Service: {incident.classifiedService || "Detecting..."}</span>
                    <span>Date: {new Date(incident.createdAt).toLocaleDateString()}</span>
                    <span>Time: {new Date(incident.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {incident.assignedUnit && (
                    <div className="assigned-unit">
                      <strong>Assigned Unit:</strong> {incident.assignedUnit.type} - {incident.assignedUnit.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Tracking Tab */}
      {showLiveTracking && (
        <div className="live-tracking">
          <h3>Live Unit Tracking</h3>
          {activeIncident ? (
            <div>
              <div style={{ background: "#e3f2fd", padding: 16, borderRadius: 12, marginBottom: 12 }}>
                <b>Current Incident Status:</b> {activeIncident.status || "reported"} • Service: {activeIncident.classifiedService || "detecting"}
              </div>
              <LiveMap
                center={coords}
                incident={activeIncident}
                unit={assignedUnit}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              No active incidents to track
            </div>
          )}
        </div>
      )}

      {/* Active Incident Status (always visible if there's an active incident) */}
      {activeIncident && !showLiveTracking && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: "#e3f2fd", padding: 16, borderRadius: 12, marginBottom: 12 }}>
            <b>Active Incident Status:</b> {activeIncident.status || "reported"} • Service: {activeIncident.classifiedService || "detecting"}
            <button 
              style={{ float: "right", background: "#2196f3", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}
              onClick={() => setShowLiveTracking(true)}
            >
              View Live Tracking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const pillStyle = {
  background: "linear-gradient(135deg,#64b5f6,#1e88e5)",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 999,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(30,136,229,0.35)",
};

const ctaStyle = {
  background: "linear-gradient(135deg,#bbdefb,#2196f3)",
  color: "#0d47a1",
  padding: "14px 20px",
  border: 0,
  borderRadius: 14,
  fontWeight: 800,
  boxShadow: "0 16px 30px rgba(25,118,210,0.45)",
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

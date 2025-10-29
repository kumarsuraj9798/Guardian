import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { reportEmergency, getIncidentHistory } from "../services/api";
import io from "socket.io-client";
import LiveMap from "./LiveMap";
import { FaCamera, FaPaperPlane, FaHistory, FaMapMarkerAlt, FaTimes, FaImage, FaMicrophone, FaVolumeUp } from "react-icons/fa";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Theme colors
const theme = {
  primary: "#ff4d4f",
  primaryHover: "#ff7875",
  secondary: "#ffccc7",
  text: "#262626",
  lightBg: "#fff2f0",
  border: "#ffa39e",
  success: "#52c41a",
  warning: "#faad14",
  error: "#ff4d4f"
};

// Status colors
const statusColors = {
  reported: { background: "#e6f7ff", color: "#1890ff" },
  processing: { background: "#fff7e6", color: "#fa8c16" },
  dispatched: { background: "#f6ffed", color: "#52c41a" },
  resolved: { background: "#f6ffed", color: "#52c41a" },
  cancelled: { background: "#fff1f0", color: "#ff4d4f" }
};

const getStatusColor = (status) => {
  return statusColors[status?.toLowerCase()] || statusColors.reported;
};

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
  const [error, setError] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerRef, setTimerRef] = useState(null);

  // Fetch incident history when component mounts
  useEffect(() => {
    const fetchIncidentHistory = async () => {
      try {
        // Get the current user ID from localStorage
        const userData = JSON.parse(localStorage.getItem('gn_user') || '{}');
        const userId = userData._id;
        
        if (!userId) {
          console.error('No user ID found');
          setError('Please log in to view your incident history');
          return;
        }
        
        // Fetch all incidents and filter by the current user
        const response = await getIncidentHistory();
        const userIncidents = (response.data || []).filter(
          incident => incident.reportedBy === userId
        );
        
        setIncidentHistory(userIncidents);
      } catch (error) {
        console.error('Error fetching incident history:', error);
        setError('Failed to load incident history');
      }
    };

    fetchIncidentHistory();
  }, []);

  // Get user's current location
  useMemo(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
      });
    }
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

  // Load incident history on component mount
  useEffect(() => {
    loadIncidentHistory();
  }, []);

  // Handle file upload with validation and processing
  const onFile = async (e, type = 'image') => {
    const files = Array.from(e.target.files || []);
    
    // Filter files based on type
    const filteredFiles = files.filter(file => {
      if (type === 'image') return file.type.startsWith('image/');
      if (type === 'audio') return file.type.startsWith('audio/');
      return false;
    });
    
    // Show error if no valid files were selected
    if (filteredFiles.length === 0) {
      setError(`Please select valid ${type} files.`);
      return;
    }
    
    // Check total media count won't exceed limit (3 for images, 1 for audio)
    const currentMediaCount = media.filter(m => m.type === type).length;
    if (type === 'image' && currentMediaCount + filteredFiles.length > 3) {
      setError('Maximum of 3 images allowed. Please remove some images before adding more.');
      return;
    }
    if (type === 'audio' && currentMediaCount + filteredFiles.length > 1) {
      setError('Only one audio recording is allowed at a time.');
      return;
    }
    
    // Process each file
    const newMedia = [];
    
    for (const file of filteredFiles) {
      try {
        const b64 = await fileToBase64(file);
        newMedia.push({ 
          type,
          content: b64, 
          name: file.name, 
          size: file.size,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        setError(`Error processing file: ${file.name}`);
      }
    }
    
    if (newMedia.length > 0) {
      // Remove any existing audio if adding a new one
      const updatedMedia = type === 'audio' 
        ? media.filter(m => m.type !== 'audio')
        : [...media];
      
      setMedia([...updatedMedia, ...newMedia]);
      // Clear any previous errors
      if (error) setError('');
      
      // Auto-analysis feature has been removed
      // You can implement media analysis here if needed in the future
    }
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
    input.multiple = type === 'image'; // Allow multiple only for images
    input.onchange = (e) => onFile(e, type);
    input.click();
    setShowMediaOptions(prev => ({ ...prev, [type]: false }));
  };

  const handleCameraCapture = async (type) => {
    try {
      if (type === 'image') {
        await captureImage();
      }
    } catch (error) {
      console.error('Capture failed:', error);
      setError('Camera access denied or not available');
    }
    setShowMediaOptions(prev => ({ ...prev, [type]: false }));
  };

  // Start voice recording
  const startVoiceRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Create a new MediaRecorder instance
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      // Store audio chunks in state
      const chunks = [];
      setAudioChunks(chunks);
      
      // Handle data available event
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      // Handle recording stop
      recorder.onstop = () => {
        // Create audio blob from chunks
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result;
          
          // Remove any existing audio and add new recording
          setMedia(prevMedia => {
            const updatedMedia = prevMedia.filter(m => m.type !== 'audio');
            return [...updatedMedia, {
              type: 'audio',
              content: base64data,
              name: `recording_${new Date().toISOString().replace(/[:.]/g, '-')}.wav`,
              size: audioBlob.size,
              url: audioUrl,
              timestamp: new Date().toISOString()
            }];
          });
        };
        
        // Clean up
        setAudioChunks([]);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording with timeslice for better performance
      recorder.start(100); // Collect 100ms of data in each chunk
      setIsRecordingVoice(true);
      setRecordingTime(0);
      
      // Update recording time every second
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Store timer ID for cleanup
      setTimerRef(timer);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Could not access microphone. Please check permissions and try again.');
      setIsRecordingVoice(false);
      setRecordingTime(0);
    }
  };
  
  // Cleanup function for voice recording
  useEffect(() => {
    return () => {
      // Cleanup timer on component unmount
      if (timerRef) {
        clearInterval(timerRef);
      }
      
      // Stop any active recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder, timerRef]);

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecordingVoice(false);
      
      // Clear the recording timer
      if (timerRef) {
        clearInterval(timerRef);
        setTimerRef(null);
      }
    }
  };
  
  // Toggle voice recording
  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };
  
  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const captureImage = async () => {
    try {
      // Create a preview container
      const previewContainer = document.createElement('div');
      previewContainer.style.position = 'fixed';
      previewContainer.style.top = '0';
      previewContainer.style.left = '0';
      previewContainer.style.width = '100%';
      previewContainer.style.height = '100%';
      previewContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
      previewContainer.style.display = 'flex';
      previewContainer.style.flexDirection = 'column';
      previewContainer.style.justifyContent = 'center';
      previewContainer.style.alignItems = 'center';
      previewContainer.style.zIndex = '1000';
      
      // Create video element for preview
      const video = document.createElement('video');
      video.style.width = '90%';
      video.style.maxWidth = '500px';
      video.style.borderRadius = '12px';
      video.style.marginBottom = '20px';
      video.autoplay = true;
      
      // Create buttons container
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '16px';
      
      // Create capture button
      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Take Photo';
      captureBtn.style.padding = '12px 24px';
      captureBtn.style.background = theme.primary;
      captureBtn.style.color = 'white';
      captureBtn.style.border = 'none';
      captureBtn.style.borderRadius = '24px';
      captureBtn.style.fontSize = '16px';
      captureBtn.style.cursor = 'pointer';
      captureBtn.style.display = 'flex';
      captureBtn.style.alignItems = 'center';
      captureBtn.style.gap = '8px';
      
      // Create cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.padding = '12px 24px';
      cancelBtn.style.background = '#f0f0f0';
      cancelBtn.style.color = '#333';
      cancelBtn.style.border = 'none';
      cancelBtn.style.borderRadius = '24px';
      cancelBtn.style.fontSize = '16px';
      cancelBtn.style.cursor = 'pointer';
      
      // Append elements
      buttonContainer.appendChild(captureBtn);
      buttonContainer.appendChild(cancelBtn);
      previewContainer.appendChild(video);
      previewContainer.appendChild(buttonContainer);
      document.body.appendChild(previewContainer);
      
      // Start the camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' 
        } 
      });
      
      video.srcObject = stream;
      
      return new Promise((resolve) => {
        // Handle capture button click
        const handleCapture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const dataURL = canvas.toDataURL('image/jpeg');
          
          setMedia(m => [...m, { 
            type: 'image', 
            content: dataURL, 
            name: `photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`,
            size: dataURL.length,
            timestamp: new Date().toISOString()
          }]);
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(previewContainer);
          resolve();
        };
        
        // Handle cancel
        const handleCancel = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(previewContainer);
          resolve();
        };
        
        // Add event listeners
        captureBtn.addEventListener('click', handleCapture);
        cancelBtn.addEventListener('click', handleCancel);
        
        // Handle escape key
        const handleKeyDown = (e) => {
          if (e.key === 'Escape') {
            handleCancel();
          } else if (e.key === ' ' || e.key === 'Enter') {
            handleCapture();
          }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Cleanup function
        return () => {
          captureBtn.removeEventListener('click', handleCapture);
          cancelBtn.removeEventListener('click', handleCancel);
          document.removeEventListener('keydown', handleKeyDown);
        };
      });
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Could not access camera. Please check permissions.');
    }
  };

  // Function to load incident history for the current user
  const loadIncidentHistory = async () => {
    try {
      // Get the current user ID from localStorage
      const userData = JSON.parse(localStorage.getItem('gn_user') || '{}');
      const userId = userData._id;
      
      if (!userId) {
        console.error('No user ID found');
        setError('Please log in to view your incident history');
        return;
      }
      
      // Fetch all incidents and filter by the current user
      const response = await getIncidentHistory();
      const userIncidents = (response.data || []).filter(
        incident => incident.reportedBy === userId
      );
      
      setIncidentHistory(userIncidents);
    } catch (error) {
      console.error('Error loading incident history:', error);
      setError('Failed to load incident history');
    }
  };

  // State for unit tracking
  const [unitLocation, setUnitLocation] = useState(null);
  const [reportTime, setReportTime] = useState(null);
  const [socket, setSocket] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState('00:00');
  const [unitEta, setUnitEta] = useState('Calculating...');
  const wsRef = useRef(null); // Add a ref to store the WebSocket instance

  // Update elapsed time every second
  useEffect(() => {
    let timer;
    if (reportTime) {
      timer = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - new Date(reportTime)) / 1000); // in seconds
        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        setTimeElapsed(`${minutes}:${seconds}`);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [reportTime]);

  // Handle unit location updates
  const handleUnitLocationUpdate = useCallback((data) => {
    if (data.unitLocation) {
      console.log('Updating unit location:', data.unitLocation);
      
      // Ensure coordinates are in the correct format [lng, lat]
      let coordinates = data.unitLocation.coordinates;
      if (Array.isArray(coordinates) && coordinates.length === 2) {
        // Ensure longitude is first, latitude is second
        if (Math.abs(coordinates[0]) > 90) {
          coordinates = [coordinates[1], coordinates[0]]; // Swap if lat/lng are reversed
        }
        
        setUnitLocation({
          ...data.unitLocation,
          coordinates,
          timestamp: data.unitLocation.timestamp || new Date().toISOString()
        });
        
        // Update ETA if we have user coordinates
        if (coords && coords.length === 2) {
          const distance = calculateDistance(
            coords[1], // lat
            coords[0], // lng
            coordinates[1], // unit lat
            coordinates[0]  // unit lng
          );
          
          // Calculate ETA based on distance (simplified)
          const speedKmph = 30; // Average speed in km/h
          const etaHours = distance / speedKmph;
          const etaMinutes = Math.ceil(etaHours * 60);
          
          setUnitEta(etaMinutes <= 1 ? 'Less than a minute' : 
                     `${etaMinutes} minute${etaMinutes > 1 ? 's' : ''}`);
        }
      }
    }
  }, [coords]);

  // Initialize Socket.IO connection
  useEffect(() => {
    let socket;
    let isMounted = true;
    
    async function initializeSocket() {
      // Only initialize if we have an active incident and assigned unit
      if (!activeIncident?._id || !assignedUnit?._id) return;
      
      console.log('Initializing WebSocket connection...');
      
      try {
        // Dynamically import socket.io-client
        const { default: io } = await import('socket.io-client');
        
        // Only proceed if component is still mounted
        if (!isMounted) return;
        
        // Initialize socket connection
        socket = io('http://localhost:5000', {
          withCredentials: true,
          transports: ['websocket'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });
        
        // Set socket reference
        wsRef.current = socket;
        setSocket(socket);
        
        // Connection established
        const onConnect = () => {
          console.log('Socket.IO Connected with ID:', socket.id);
          
          // Join the incident room
          socket.emit('join-incident', { incidentId: activeIncident._id });
          
          // Request initial unit location
          socket.emit('request-unit-location', {
            incidentId: activeIncident._id,
            unitId: assignedUnit._id
          });
        };
        
        // Handle unit location updates
        const onUnitLocationUpdate = (data) => {
          console.log('Received unit location update:', data);
          handleUnitLocationUpdate(data);
        };
        
        // Handle connection errors
        const onConnectError = (error) => {
          console.error('Socket.IO connection error:', error);
        };
        
        // Set up event listeners
        socket.on('connect', onConnect);
        socket.on('unit-location-update', onUnitLocationUpdate);
        socket.on('connect_error', onConnectError);
        
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    }
    
    initializeSocket();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (wsRef.current) {
        console.log('Cleaning up WebSocket connection');
        wsRef.current.off('connect');
        wsRef.current.off('unit-location-update');
        wsRef.current.off('connect_error');
        wsRef.current.disconnect();
        wsRef.current = null;
        setSocket(null);
      }
    };
  }, [activeIncident?._id, assignedUnit?._id, handleUnitLocationUpdate]);
  
  // Helper function to calculate distance between two points in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const onReport = async () => {
    console.log("--- DEBUG MESSAGE: The code is updating! ---");
    if (!description.trim() && media.length === 0) {
      setError('Please provide a description or upload an image/audio');
      return;
    }

    // Check if user is logged in
    const userData = JSON.parse(localStorage.getItem('gn_user') || '{}');
    if (!userData || !userData._id) {
      setError('Please log in to report an incident');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSubmitMessage('Analyzing your report...');
    const reportTimestamp = new Date().toISOString();
    setReportTime(reportTimestamp);

    try {
      // Analyze media and text with Gemini
      let services = [];
      let analysisResult = null;
      
      try {
        analysisResult = await analyzeMediaWithGemini(media, description);
        services = analysisResult.services_needed || [];
        
        // Show analysis summary to user
        if (analysisResult.descriptions && analysisResult.descriptions.length > 0) {
          const summary = analysisResult.descriptions.join(' ');
          setSubmitMessage(`Analysis: ${summary}`);
        } else {
          setSubmitMessage('Analysis complete. Processing your report...');
        }
        
        // Show alert with selected services
        const servicesString = services.length > 0 
          ? `Based on our analysis, we're contacting: ${services.join(', ')}` 
          : 'Based on our analysis, we\'re contacting general emergency services';
        
        alert(servicesString);
        
      } catch (geminiError) {
        console.error('Gemini analysis failed:', geminiError);
        setError('Analysis service unavailable. Proceeding with standard emergency response.');
        services = ['police']; // Default service
      }

      // Get current location if available
      let location = coords; // Default to current coords
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = [pos.coords.longitude, pos.coords.latitude];
          setCoords(location);
        } catch (geoError) {
          console.error('Error getting location:', geoError);
          setError(prev => prev ? `${prev}. Also, could not get precise location.` : 'Could not get precise location.');
        }
      }

      // Prepare media files for submission
      const mediaFiles = media.map(m => ({
        type: m.type,
        content: m.content,
        name: m.name || `media-${Date.now()}.${m.type}`,
        size: m.size
      }));

      // Prepare payload with services and analysis results
      const payload = {
        description,
        media: mediaFiles,
        location: { 
          type: "Point", 
          coordinates: location 
        },
        reportedBy: userData._id,
        timestamp: reportTimestamp,
        status: 'reported',
        services: services.length > 0 ? services : ['general'],
        analysis: analysisResult || {}
      };

      // Submit the report
      const res = await reportEmergency(payload);
      const inc = res.data.incident;
      setActiveIncident(inc);
      
      // If a unit is assigned, track its location
      if (res.data.assignedUnit) {
        setAssignedUnit(res.data.assignedUnit);
      }
      
      // Clear form
      setDescription("");
      setMedia([]);
      
      // Refresh incident history
      await loadIncidentHistory();
      
      // Show success message with timestamp
      const reportTimeFormatted = new Date(reportTimestamp).toLocaleTimeString();
      setSubmitMessage(`Incident reported at ${reportTimeFormatted}! Emergency unit has been dispatched.`);
      
      // Auto switch to Live Tracking tab after 2 seconds
      setTimeout(() => {
        setShowLiveTracking(true);
        setShowHistory(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error reporting incident:", error);
      setError(error.response?.data?.message || "Failed to report incident. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle incident updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handler = (update) => {
      if (activeIncident && update.incidentId === activeIncident._id) {
        setActiveIncident(prev => ({ ...prev, ...update }));
      }
    };

    socket.on("incident:update", handler);
    
    return () => {
      if (socket) {
        socket.off("incident:update", handler);
      }
    };
  }, [socket, activeIncident]);

  // Tab Button Component
  const TabButton = ({ active, onClick, icon, label }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 16px',
        border: 'none',
        background: active ? '#fff' : 'transparent',
        color: active ? theme.primary : '#8c8c8c',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: active ? '600' : '500',
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
        boxShadow: active ? '0 2px 8px rgba(255, 77, 79, 0.1)' : 'none'
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  // Toggle history panel
  const toggleHistory = () => {
    if (!showHistory) {
      loadIncidentHistory();
    }
    setShowHistory(!showHistory);
  };

  return (
    <div style={{ 
      padding: '24px 16px',
      maxWidth: '800px',
      width: '100%',
      margin: '0 auto',
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <h2 style={{
        color: theme.text,
        textAlign: 'center',
        marginBottom: '32px',
        fontSize: '2rem',
        fontWeight: '700',
        background: `linear-gradient(135deg, ${theme.primary}, #ff7a45)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        Emergency Response Portal
      </h2>
      
      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '32px',
        background: '#fff9f9',
        padding: '8px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <TabButton 
          active={!showHistory && !showLiveTracking}
          onClick={() => { setShowHistory(false); setShowLiveTracking(false); }}
          icon={<FaPaperPlane />}
          label="Report Emergency"
        />
        <TabButton 
          active={showHistory}
          onClick={() => { setShowHistory(true); setShowLiveTracking(false); }}
          icon={<FaHistory />}
          label="My Reports"
        />
        <TabButton 
          active={showLiveTracking}
          onClick={() => { setShowHistory(false); setShowLiveTracking(true); }}
          icon={<FaMapMarkerAlt />}
          label="Live Tracking"
        />
      </div>

      {/* Report Incident Tab */}
      {!showHistory && !showLiveTracking && (
        <div style={{ display: "grid", gap: 12, maxWidth: 720, margin: '0 auto' }}>
          <textarea
            placeholder="Describe what happened"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              border: `1px solid ${theme.border}`,
              minHeight: '120px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              '&:focus': {
                outline: 'none',
                borderColor: theme.primary,
                boxShadow: `0 0 0 2px ${theme.primary}33`
              }
            }}
          />

          {/* Media Upload Section */}
          <div style={{ 
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            border: '1px dashed #ffd6e7',
            marginBottom: '16px',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: theme.primary,
              boxShadow: '0 4px 16px rgba(255, 77, 79, 0.1)'
            }
          }}>
            <h4 style={{
              margin: '0 0 16px 0',
              color: theme.text,
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaImage color={theme.primary} />
              Upload Incident Images
            </h4>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 16px',
              border: '2px dashed #ffd6e7',
              borderRadius: '8px',
              backgroundColor: '#fff9f9',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '16px',
              '&:hover': {
                borderColor: theme.primary,
                backgroundColor: '#fff5f5'
              }
            }}
            onClick={() => document.getElementById('file-upload').click()}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fff2f0, #ffccc7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <FaImage size={24} color={theme.primary} />
              </div>
              <h4 style={{
                margin: '0 0 8px 0',
                color: theme.text,
                fontSize: '1rem'
              }}>
                Click to upload or drag & drop
              </h4>
              <p style={{
                margin: '0',
                color: '#8c8c8c',
                fontSize: '0.85rem',
                maxWidth: '300px',
                lineHeight: '1.5'
              }}>
                Upload up to 3 images (JPG, PNG, or WebP). Max 5MB per image.
              </p>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={onFile}
                style={{ display: 'none' }}
              />
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {/* Upload from Device */}
              <label
                htmlFor="file-upload"
                style={{
                  background: '#fff',
                  color: theme.primary,
                  border: `1px solid ${theme.primary}`,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: theme.lightBg,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <FaImage /> Upload Image
              </label>

              {/* Take Photo Button */}
              <button 
                onClick={() => handleCameraCapture('image')}
                style={{
                  background: theme.lightBg,
                  color: theme.text,
                  border: `2px dashed ${theme.border}`,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: theme.primary,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <FaCamera /> Take Photo
              </button>
              
              {/* Voice Recording Button */}
              <button 
                onClick={toggleVoiceRecording}
                style={{
                  background: isRecordingVoice ? '#fff1f0' : theme.lightBg,
                  color: isRecordingVoice ? theme.error : theme.text,
                  border: `2px ${isRecordingVoice ? 'solid' : 'dashed'} ${isRecordingVoice ? theme.error : theme.border}`,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  animation: isRecordingVoice ? 'pulse 1.5s infinite' : 'none',
                  '&:hover': {
                    borderColor: isRecordingVoice ? theme.error : theme.primary,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {isRecordingVoice ? (
                  <>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: theme.error,
                      marginRight: '4px',
                      animation: 'pulse 1.5s infinite'
                    }} />
                    {formatTime(recordingTime)}
                  </>
                ) : (
                  <>
                    <FaMicrophone /> Record Voice
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Selected Media Preview */}
          {media.length > 0 && (
            <div style={{ 
              background: '#f9f9f9', 
              padding: '16px', 
              borderRadius: '12px',
              border: `1px solid #eee`,
              marginBottom: '16px'
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                color: theme.text,
                fontSize: '0.95rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Selected Images ({media.length}/3)
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '12px'
              }}>
                {media.map((item, index) => (
                  <div key={index} style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: `1px solid ${item.type === 'audio' ? '#e6f7ff' : '#f0f0f0'}`,
                    background: item.type === 'audio' ? '#f6fbff' : 'white'
                  }}>
                    {item.type === 'image' ? (
                      <img 
                        src={item.content} 
                        alt={`Uploaded ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <div style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '120px'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: '#e6f7ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '12px'
                        }}>
                          <FaVolumeUp size={20} color='#1890ff' />
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#595959',
                          textAlign: 'center',
                          maxWidth: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          Voice Note
                        </div>
                        <audio
                          src={item.url || item.content}
                          controls
                          style={{
                            width: '100%',
                            marginTop: '8px',
                            height: '30px'
                          }}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        '&:hover': {
                          background: theme.error
                        }
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fff1f0',
              borderLeft: `4px solid ${theme.error}`,
              padding: '12px 16px',
              borderRadius: '4px',
              color: theme.error,
              fontSize: '0.9rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaTimes size={16} />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={onReport}
            disabled={isSubmitting || (media.length === 0 && !description.trim())}
            style={{
              background: isSubmitting 
                ? '#f0f0f0' 
                : `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
              color: isSubmitting ? '#999' : '#fff',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '50px',
              fontWeight: '700',
              fontSize: '1.1rem',
              cursor: isSubmitting || (media.length === 0 && !description.trim()) 
                ? 'not-allowed' 
                : 'pointer',
              boxShadow: isSubmitting || (media.length === 0 && !description.trim())
                ? 'none'
                : '0 10px 25px rgba(255, 77, 79, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              '&:hover:not(:disabled)': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 30px rgba(255, 77, 79, 0.4)'
              },
              '&:active:not(:disabled)': {
                transform: 'translateY(1px)'
              }
            }}
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <FaPaperPlane /> Report Emergency
              </>
            )}
          </button>

          {/* Helper Text */}
          <p style={{
            color: '#8c8c8c',
            fontSize: '0.85rem',
            textAlign: 'center',
            marginTop: '16px',
            lineHeight: '1.5'
          }}>
            Our AI will analyze your report and dispatch the appropriate emergency services immediately.
            {media.length === 0 && !description.trim() && (
              <span style={{ display: 'block', color: theme.primary, marginTop: '4px' }}>
                Please add a description or upload an image to continue.
              </span>
            )}
          </p>
        </div>
      )}

      {/* History Panel Overlay */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: theme.text }}>Your Reported Incidents</h3>
              <button 
                onClick={toggleHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8c8c8c',
                  fontSize: '1.2rem',
                  '&:hover': {
                    color: theme.primary
                  }
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Incident List */}
            <div style={{ overflowY: 'auto', padding: '16px' }}>
              {incidentHistory.length > 0 ? (
                incidentHistory.map((incident) => {
                  const statusInfo = getStatusColor(incident.status);
                  return (
                    <div 
                      key={incident._id || Date.now()}
                      style={{
                        background: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        padding: '16px',
                        marginBottom: '16px',
                        '&:hover': {
                          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <span style={{
                          color: '#8c8c8c',
                          fontSize: '0.85rem'
                        }}>
                          {new Date(incident.createdAt).toLocaleString()}
                        </span>
                        <span style={{
                          background: statusInfo.background,
                          color: statusInfo.color,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {incident.status || 'reported'}
                        </span>
                      </div>
                      
                      <p style={{
                        margin: '0 0 12px',
                        color: theme.text,
                        lineHeight: '1.5'
                      }}>
                        {incident.description || 'No description provided'}
                      </p>

                      {incident.media && incident.media.length > 0 && (
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          marginBottom: '12px',
                          flexWrap: 'wrap'
                        }}>
                          {incident.media.slice(0, 3).map((media, i) => (
                            media.type === 'image' ? (
                              <img 
                                key={i}
                                src={media.content}
                                alt={`Incident media ${i + 1}`}
                                style={{
                                  width: '80px',
                                  height: '60px',
                                  borderRadius: '6px',
                                  objectFit: 'cover',
                                  border: '1px solid #f0f0f0'
                                }}
                              />
                            ) : media.type === 'audio' ? (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '6px 12px',
                                  background: '#f9f9f9',
                                  borderRadius: '15px',
                                  fontSize: '0.8rem',
                                  color: theme.text,
                                  gap: '6px'
                                }}
                              >
                                <FaVolumeUp style={{ color: theme.primary }} />
                                <span>Voice Note</span>
                              </div>
                            ) : null
                          ))}
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px dashed #f0f0f0',
                        color: '#8c8c8c',
                        fontSize: '0.85rem'
                      }}>
                        <span>ID: {incident._id?.substring(0, 8) || 'N/A'}</span>
                        <button
                          onClick={() => {
                            setActiveIncident(incident);
                            setShowHistory(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: theme.primary,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.85rem',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          View Details
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '4px' }}>
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: theme.text
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: theme.lightBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <FaHistory style={{ fontSize: '24px', color: theme.primary }} />
                  </div>
                  <h4 style={{ margin: '0 0 8px' }}>No incidents reported yet</h4>
                  <p style={{ margin: 0, color: '#8c8c8c' }}>Your reported incidents will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Incident Status Bar (visible when not on Live Tracking tab) */}
      {activeIncident && !showLiveTracking && !showHistory && (
        <div style={{
          marginTop: '24px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          border: '1px solid #f0f0f0',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
          }
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: '#fff9f0',
            borderBottom: '1px solid #ffe7ba'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#fff7e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fa8c16',
                flexShrink: 0
              }}>
                <FaMapMarkerAlt size={16} />
              </div>
              <div>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#8c8c8c',
                  marginBottom: '2px'
                }}>
                  Active Emergency
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: getStatusColor(activeIncident.status || 'reported').background,
                    color: getStatusColor(activeIncident.status || 'reported').color,
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {activeIncident.status || 'reported'}
                  </span>
                  <span style={{
                    color: theme.text,
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}>
                    {activeIncident.classifiedService || 'Emergency Service'}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowLiveTracking(true)}
              style={{
                background: theme.primary,
                color: '#fff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: '#ff7875',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)'
                }
              }}
            >
              <FaMapMarkerAlt size={14} /> Track Live
            </button>
          </div>
          
          <div style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#fff'
          }}>
            <div>
              <div style={{
                fontSize: '0.8rem',
                color: '#8c8c8c',
                marginBottom: '4px'
              }}>
                Incident ID
              </div>
              <div style={{
                fontWeight: '600',
                fontFamily: 'monospace',
                color: theme.text,
                fontSize: '0.95rem'
              }}>
                #{activeIncident._id?.slice(-6) || 'N/A'}
              </div>
            </div>
            
            {activeIncident.assignedUnit && (
              <div style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#52c41a',
                  borderRadius: '50%',
                  flexShrink: 0
                }} />
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#8c8c8c',
                    lineHeight: '1.2',
                    whiteSpace: 'nowrap'
                  }}>
                    Assigned Unit
                  </div>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    color: '#237804',
                    whiteSpace: 'nowrap'
                  }}>
                    {activeIncident.assignedUnit.type}
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '0.8rem',
                color: '#8c8c8c',
                marginBottom: '4px'
              }}>
                Reported
              </div>
              <div style={{
                fontWeight: '500',
                color: theme.text,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap'
              }}>
                {new Date(activeIncident.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Tracking Section */}
      {showLiveTracking && activeIncident && (
        <div className="live-tracking">
          <h3>Live Incident Tracking</h3>
          <div className="tracking-container">
            <div className="incident-details">
              <div className="tracking-card">
                <h4>Incident Details</h4>
                <p><strong>ID:</strong> {activeIncident._id.substring(0, 8)}...</p>
                <p><strong>Reported:</strong> {new Date(activeIncident.timestamp || activeIncident.createdAt).toLocaleString()}</p>
                <p><strong>Status:</strong> <span className={`status-${activeIncident.status}`}>{activeIncident.status}</span></p>
                <p><strong>Time Elapsed:</strong> {timeElapsed}</p>
              </div>
              
              {assignedUnit ? (
                <div className="tracking-card unit-tracking">
                  <h4>Emergency Unit</h4>
                  <p><strong>Unit:</strong> {assignedUnit.name} ({assignedUnit.type})</p>
                  <p><strong>Status:</strong> {assignedUnit.status || 'In Transit'}</p>
                  <p><strong>ETA:</strong> {unitEta}</p>
                  {unitLocation && (
                    <p><strong>Last Updated:</strong> {new Date(unitLocation.timestamp).toLocaleTimeString()}</p>
                  )}
                </div>
              ) : (
                <div className="tracking-card">
                  <h4>Emergency Unit</h4>
                  <p>Waiting for unit assignment...</p>
                </div>
              )}
              
              <div className="tracking-card actions">
                <h4>Actions</h4>
                <button className="btn btn-secondary" onClick={() => setShowLiveTracking(false)}>
                  Back to Report
                </button>
                <button className="btn btn-primary" onClick={() => loadIncidentHistory()}>
                  Refresh Status
                </button>
              </div>
            </div>
            
            <div className="map-container">
              <LiveMap 
                incidentLocation={activeIncident?.location ? {
                  type: 'Point',
                  coordinates: activeIncident.location.coordinates || coords || [77.209, 28.6139]
                } : null}
                unitLocation={unitLocation?.coordinates ? {
                  type: 'Point',
                  coordinates: unitLocation.coordinates,
                  timestamp: unitLocation.timestamp
                } : assignedUnit?.location ? {
                  type: 'Point',
                  coordinates: assignedUnit.location.coordinates,
                  timestamp: new Date().toISOString()
                } : null}
                zoom={unitLocation || assignedUnit?.location ? 13 : 10}
              />
              <div className="map-legend">
                <div className="legend-item">
                  <span className="legend-icon incident"></span> Your Location
                </div>
                {unitLocation && (
                  <div className="legend-item">
                    <span className="legend-icon unit"></span> Emergency Unit
                  </div>
                )}
              </div>
            </div>
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
  border: "none",
  fontSize: "14px",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
  },
  "&:focus": {
    outline: "none",
    boxShadow: "0 0 0 2px rgba(100, 181, 246, 0.4)"
  },
  "&.active": {
    background: "linear-gradient(135deg, #4caf50, #2e7d32)",
    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)"
  },
  "&.danger": {
    background: "linear-gradient(135deg, #f44336, #c62828)",
    boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)"
  },
  "&.warning": {
    background: "linear-gradient(135deg, #ff9800, #e65100)",
    boxShadow: "0 4px 12px rgba(255, 152, 0, 0.2)"
  },
  "&.secondary": {
    background: "linear-gradient(135deg, #9e9e9e, #616161)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
  }
};

const trackingStyles = {
  '.live-tracking': {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    'h3': {
      margin: '0 0 20px',
      color: '#333',
      fontSize: '1.5rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      '&:before': {
        content: '""',
        display: 'block',
        width: '8px',
        height: '24px',
        backgroundColor: '#1e88e5',
        borderRadius: '4px'
      }
    },
    '.tracking-container': {
      display: 'flex',
      gap: '24px',
      '@media (max-width: 768px)': {
        flexDirection: 'column',
        gap: '20px'
      }
    },
    '.incident-details': {
      flex: '0 0 300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      '@media (max-width: 768px)': {
        flex: '1',
        width: '100%'
      }
    },
    '.tracking-card': {
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      padding: '18px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      'h4': {
        margin: '0 0 12px',
        color: '#333',
        fontSize: '1.1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        '&:before': {
          content: '""',
          display: 'block',
          width: '6px',
          height: '18px',
          backgroundColor: '#1e88e5',
          borderRadius: '3px'
        }
      },
      'p': {
        margin: '8px 0',
        color: '#555',
        fontSize: '0.95rem',
        lineHeight: '1.5',
        'strong': {
          color: '#333',
          fontWeight: '500',
          display: 'inline-block',
          width: '100px'
        }
      },
      '&.unit-tracking': {
        borderLeft: '4px solid #4caf50',
        'h4:before': {
          backgroundColor: '#4caf50'
        },
        'p strong': {
          color: '#2e7d32'
        }
      },
      '&.actions': {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        '.btn': {
          width: '100%',
          textAlign: 'center',
          padding: '10px',
          borderRadius: '6px',
          border: 'none',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&.btn-primary': {
            backgroundColor: '#1e88e5',
            color: 'white',
            '&:hover': {
              backgroundColor: '#1565c0',
              transform: 'translateY(-1px)'
            }
          },
          '&.btn-secondary': {
            backgroundColor: '#f0f0f0',
            color: '#333',
            '&:hover': {
              backgroundColor: '#e0e0e0',
              transform: 'translateY(-1px)'
            }
          }
        }
      }
    },
    '.map-container': {
      flex: '1',
      position: 'relative',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      minHeight: '400px',
      '.map-legend': {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px 15px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        '.legend-item': {
          display: 'flex',
          alignItems: 'center',
          margin: '5px 0',
          fontSize: '0.9rem',
          color: '#444',
          '.legend-icon': {
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            marginRight: '8px',
            '&.incident': {
              backgroundColor: '#f44336',
              boxShadow: '0 0 0 3px rgba(244, 67, 54, 0.3)'
            },
            '&.unit': {
              backgroundColor: '#4caf50',
              boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.3)'
            }
          }
        }
      }
    },
    '.status-pending': {
      color: '#ff9800',
      fontWeight: '500',
      '&:before': {
        content: '""',
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#ff9800',
        marginRight: '6px'
      }
    },
    '.status-assigned': {
      color: '#2196f3',
      fontWeight: '500',
      '&:before': {
        content: '""',
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#2196f3',
        marginRight: '6px'
      }
    },
    '.status-in-progress': {
      color: '#9c27b0',
      fontWeight: '500',
      '&:before': {
        content: '""',
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#9c27b0',
        marginRight: '6px'
      }
    },
    '.status-resolved': {
      color: '#4caf50',
      fontWeight: '500',
      '&:before': {
        content: '""',
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#4caf50',
        marginRight: '6px'
      }
    },
    '.status-cancelled': {
      color: '#f44336',
      fontWeight: '500',
      '&:before': {
        content: '""',
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#f44336',
        marginRight: '6px'
      }
    }
  }
};

// Add the styles to the component
const styles = {
  ...trackingStyles,
  // ... other existing styles
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Helper function to safely parse Gemini response
const parseGeminiResponse = (responseText) => {
  try {
    // First, try to parse as-is
    return JSON.parse(responseText);
  } catch (e) {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.warn('Failed to parse JSON from markdown code block', e);
      }
    }
    
    // If still no match, try to find JSON-like object in the text
    const jsonLikeMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonLikeMatch) {
      try {
        return JSON.parse(jsonLikeMatch[0]);
      } catch (e) {
        console.warn('Failed to parse JSON-like string', e);
      }
    }
    
    // If all else fails, return a default response
    console.warn('Could not parse Gemini response, using default');
    return {
      is_emergency: true,
      services_needed: ['police'],
      description: 'Emergency analysis service unavailable. Default emergency response activated.'
    };
  }
};

// Function to analyze media using Gemini
const analyzeMediaWithGemini = async (mediaItems, textDescription = '') => {
  try {
    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY');
      throw new Error('Emergency analysis service is currently unavailable');
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.2,  // Lower temperature for more focused responses
        maxOutputTokens: 1000
      }
    });

    // Process each media item
    const mediaAnalysisPromises = mediaItems.map(async (media) => {
      try {
        let prompt, part;
        
        if (media.type === 'image') {
          prompt = `You are an emergency response assistant. Analyze this image and respond with a JSON object containing:
          - is_emergency: boolean (true if this is a real emergency)
          - services_needed: array of strings (from ["ambulance", "fire", "police"])
          - description: string (brief description of what you see)
          
          Example response: 
          {
            "is_emergency": true,
            "services_needed": ["police", "ambulance"],
            "description": "Car accident with injuries visible"
          }`;

          part = {
            inlineData: {
              data: media.content.split(',')[1], // Remove the data URL prefix
              mimeType: media.content.split(';')[0].split(':')[1] || 'image/jpeg'
            }
          };
        } else if (media.type === 'audio') {
          prompt = `You are an emergency response assistant. Analyze this audio and respond with a JSON object containing:
          - is_emergency: boolean (true if this is a real emergency)
          - services_needed: array of strings (from ["ambulance", "fire", "police"])
          - description: string (brief description of what you hear)
          
          Example response: 
          {
            "is_emergency": true,
            "services_needed": ["police"],
            "description": "Person reporting a break-in in progress"
          }`;

          part = {
            inlineData: {
              data: media.content.split(',')[1],
              mimeType: media.content.split(';')[0].split(':')[1] || 'audio/wav'
            }
          };
        } else {
          return null;
        }

        const result = await model.generateContent([prompt, part]);
        const response = await result.response;
        console.log('Gemini raw response:', response.text());
        return parseGeminiResponse(response.text());
        
      } catch (error) {
        console.error(`Error processing ${media?.type || 'media'}:`, error);
        return {
          is_emergency: true,
          services_needed: ['police'],
          description: `Error analyzing ${media?.type || 'media'}: ${error.message}`
        };
      }
    });

    // Process text description if provided
    let textAnalysis = null;
    if (textDescription.trim()) {
      try {
        const prompt = `You are an emergency response assistant. Analyze this report and respond with a JSON object:
        "${textDescription}"
        
        Respond with a JSON object containing:
        - is_emergency: boolean
        - services_needed: array of strings from ["ambulance", "fire", "police"]
        - description: string (brief summary)
        
        Example: 
        {
          "is_emergency": true,
          "services_needed": ["fire"],
          "description": "Report of a kitchen fire"
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log('Gemini text response:', response.text());
        textAnalysis = parseGeminiResponse(response.text());
      } catch (error) {
        console.error('Error analyzing text:', error);
        textAnalysis = {
          is_emergency: true,
          services_needed: ['police'],
          description: 'Could not analyze text description'
        };
      }
    }

    // Combine all analyses
    const analyses = await Promise.all(mediaAnalysisPromises);
    const validAnalyses = analyses.filter(a => a !== null);
    
    if (textAnalysis) {
      validAnalyses.push(textAnalysis);
    }

    // If no valid analyses, return a default response
    if (validAnalyses.length === 0) {
      return {
        is_emergency: true,
        services_needed: ['police'],
        descriptions: ['Emergency analysis service is currently unavailable']
      };
    }

    // Combine results
    const combinedResult = {
      is_emergency: validAnalyses.some(a => a && a.is_emergency === true),
      services_needed: [...new Set(validAnalyses.flatMap(a => (a?.services_needed || []).filter(Boolean)))],
      descriptions: validAnalyses.map(a => a?.description).filter(Boolean)
    };

    // Ensure we always have at least one service
    if (!combinedResult.services_needed || combinedResult.services_needed.length === 0) {
      combinedResult.services_needed = ['police'];
    }
    if (!combinedResult.descriptions || combinedResult.descriptions.length === 0) {
      combinedResult.descriptions = ['Emergency reported. Help is on the way.'];
    }

    console.log('Combined analysis result:', combinedResult);
    return combinedResult;
    
  } catch (error) {
    console.error('Error in analyzeMediaWithGemini:', error);
    // Return a safe default in case of complete failure
    return {
      is_emergency: true,
      services_needed: ['police'],
      descriptions: ['Emergency reported. Help is on the way.']
    };
  }
};
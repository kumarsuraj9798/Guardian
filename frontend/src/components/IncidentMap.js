import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons for different incident types
const createCustomIcon = (type, color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: white;
    ">${getIncidentIcon(type)}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const getIncidentIcon = (type) => {
  const icons = {
    'Medical': '🚑',
    'Fire': '🔥',
    'Accident': '🚗',
    'Security': '👮',
    'Other': '⚠️'
  };
  return icons[type] || icons['Other'];
};

const getIncidentColor = (type, priority) => {
  const colors = {
    'Medical': priority === 'high' ? '#ff4444' : '#ff6b6b',
    'Fire': priority === 'high' ? '#ff8800' : '#ffa726',
    'Accident': priority === 'high' ? '#ff4444' : '#42a5f5',
    'Security': priority === 'high' ? '#ff4444' : '#66bb6a',
    'Other': '#9e9e9e'
  };
  return colors[type] || colors['Other'];
};

// Component to fit map bounds to show all incidents
const MapBounds = ({ incidents }) => {
  const map = useMap();
  
  useEffect(() => {
    if (incidents.length > 0) {
      const bounds = L.latLngBounds(incidents.map(incident => [incident.lat, incident.lng]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [incidents, map]);
  
  return null;
};

// Heatmap layer component
const HeatmapLayer = ({ incidents }) => {
  const map = useMap();
  
  useEffect(() => {
    // Create heatmap data
    const heatmapData = incidents.map(incident => ({
      lat: incident.lat,
      lng: incident.lng,
      intensity: incident.priority === 'high' ? 1.0 : 0.5
    }));
    
    // Add heatmap circles
    heatmapData.forEach(point => {
      const circle = L.circle([point.lat, point.lng], {
        radius: 1000,
        fillColor: '#ff4444',
        color: '#ff4444',
        weight: 1,
        opacity: 0.3,
        fillOpacity: point.intensity * 0.2
      }).addTo(map);
    });
  }, [incidents, map]);
  
  return null;
};

export default function IncidentMap({ 
  incidents = [], 
  selectedIncident = null, 
  onIncidentSelect = null,
  showHeatmap = false,
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 10
}) {
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Update map center when incidents change
  useEffect(() => {
    if (incidents.length > 0) {
      const avgLat = incidents.reduce((sum, incident) => sum + incident.lat, 0) / incidents.length;
      const avgLng = incidents.reduce((sum, incident) => sum + incident.lng, 0) / incidents.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [incidents]);

  const handleMarkerClick = (incident) => {
    if (onIncidentSelect) {
      onIncidentSelect(incident);
    }
  };

  return (
    <div className="incident-map-container">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="incident-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Show all incidents as markers */}
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.lat, incident.lng]}
            icon={createCustomIcon(incident.type, getIncidentColor(incident.type, incident.priority))}
            eventHandlers={{
              click: () => handleMarkerClick(incident)
            }}
          >
            <Popup>
              <div className="incident-popup">
                <h4>{incident.type}</h4>
                <p><strong>Location:</strong> {incident.location}</p>
                <p><strong>Status:</strong> {incident.status}</p>
                <p><strong>Priority:</strong> {incident.priority || 'Medium'}</p>
                <p><strong>Time:</strong> {incident.time}</p>
                {incident.description && (
                  <p><strong>Description:</strong> {incident.description}</p>
                )}
                <div className="popup-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => handleMarkerClick(incident)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Show response units if available */}
        {incidents.map((incident) => 
          incident.responseUnits?.map((unit) => (
            <Marker
              key={`unit-${unit.id}`}
              position={[unit.lat, unit.lng]}
              icon={L.divIcon({
                className: 'response-unit-marker',
                html: `<div style="
                  background-color: #4CAF50;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  color: white;
                ">${unit.type === 'Ambulance' ? '🚑' : unit.type === 'Fire' ? '🚒' : '👮'}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            >
              <Popup>
                <div className="unit-popup">
                  <h4>{unit.type} Unit {unit.id}</h4>
                  <p><strong>Status:</strong> {unit.status}</p>
                  <p><strong>ETA:</strong> {unit.eta}</p>
                </div>
              </Popup>
            </Marker>
          ))
        )}
        
        {/* Heatmap layer */}
        {showHeatmap && <HeatmapLayer incidents={incidents} />}
        
        {/* Auto-fit bounds */}
        <MapBounds incidents={incidents} />
      </MapContainer>
    </div>
  );
}

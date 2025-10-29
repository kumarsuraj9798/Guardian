import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';

// Custom marker elements
function createMarkerElement(icon, color, label = '') {
  const el = document.createElement('div');
  el.className = 'map-marker';
  el.style.width = '32px';
  el.style.height = '32px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = color;
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.color = 'white';
  el.style.fontWeight = 'bold';
  el.style.boxShadow = `0 0 0 3px rgba(255, 255, 255, 0.8), 0 2px 8px rgba(0, 0, 0, 0.3)`;
  
  if (icon) {
    const iconEl = document.createElement('div');
    iconEl.className = `fas fa-${icon}`;
    el.appendChild(iconEl);
  } else if (label) {
    el.textContent = label;
  }
  
  return el;
}

export default function LiveMap({ center = [77.209, 28.6139], incidentLocation, unitLocation, zoom = 11 }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const unitMarker = useRef(null);
  const incidentMarker = useRef(null);
  const routeLayer = useRef(null);
  const markers = useRef({});

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    mapObj.current = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_MAPTILER_KEY', // Replace with your key
      center,
      zoom,
      attributionControl: false
    });

    // Add navigation controls
    mapObj.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    // Add geolocation control
    mapObj.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }), 'top-right'
    );

    return () => {
      if (mapObj.current) {
        mapObj.current.remove();
        mapObj.current = null;
      }
    };
  }, []);

  // Update incident marker
  useEffect(() => {
    if (!mapObj.current || !incidentLocation?.coordinates) return;

    if (!incidentMarker.current) {
      const el = createMarkerElement('exclamation', '#e53935');
      incidentMarker.current = new maplibregl.Marker({
        element: el
      })
        .setLngLat(incidentLocation.coordinates)
        .addTo(mapObj.current);
      
      // Add popup
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML('<h3>Incident Location</h3>');
      incidentMarker.current.setPopup(popup);
    } else {
      incidentMarker.current.setLngLat(incidentLocation.coordinates);
    }
  }, [incidentLocation]);

  // Update unit marker
  useEffect(() => {
    if (!mapObj.current) return;
    
    let coords = unitLocation?.coordinates ? [...unitLocation.coordinates] : null;
    if (!coords || !Array.isArray(coords) || coords.length !== 2) {
      console.log('No valid unit location data');
      return;
    }

    console.log('Updating unit marker with location:', coords);

    // Ensure coordinates are in the correct format [lng, lat]
    if (Math.abs(coords[0]) > 90) {
      coords = [coords[1], coords[0]]; // Swap if lat/lng are reversed
    }

    // Create or update unit marker
    if (!unitMarker.current) {
      console.log('Creating new unit marker at:', coords);
      const el = createMarkerElement('ambulance', '#4caf50');
      unitMarker.current = new maplibregl.Marker({
        element: el
      })
        .setLngLat(coords)
        .addTo(mapObj.current);
      
      // Add popup
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML('<h3>Emergency Unit</h3>');
      unitMarker.current.setPopup(popup);
    } else {
      unitMarker.current.setLngLat(coords);
    }
  }, [unitLocation]);

  // Update route and map view
  useEffect(() => {
    if (!mapObj.current) return;
    
    let unitCoords = unitLocation?.coordinates ? [...unitLocation.coordinates] : null;
    if (unitCoords && Math.abs(unitCoords[0]) > 90) {
      unitCoords = [unitCoords[1], unitCoords[0]]; // Ensure [lng, lat] format
    }

    const incidentCoords = incidentLocation?.coordinates;
    
    // Update or create route line if we have both points
    if (incidentCoords && unitCoords) {
      console.log('Updating route line');
      updateRouteLine(incidentCoords, unitCoords);
    }

    // Fit map to show both markers if we have both locations
    if (incidentCoords && unitCoords) {
      try {
        const bounds = new maplibregl.LngLatBounds()
          .extend(unitCoords)
          .extend(incidentCoords);
        
        mapObj.current.fitBounds(bounds, {
          padding: {top: 100, bottom: 100, left: 100, right: 100},
          maxZoom: 15
        });
      } catch (error) {
        console.error('Error fitting map bounds:', error);
      }
    }
  }, [unitLocation, incidentLocation]);

  // Update route line on map
  const updateRouteLine = (start, end) => {
    if (!mapObj.current) return;

    // Remove existing route layer if it exists
    if (routeLayer.current) {
      if (mapObj.current.getLayer('route')) {
        mapObj.current.removeLayer('route');
        mapObj.current.removeSource('route');
      }
    }

    // Add new route layer
    mapObj.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [start, end]
        }
      }
    });

    mapObj.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#4caf50',
        'line-width': 4,
        'line-dasharray': [2, 2],
        'line-opacity': 0.8
      }
    });

    routeLayer.current = true;
  };

  // Animate marker movement
  const animateMarker = (marker, start, end, duration) => {
    if (!marker || !start || !end) return;
    
    const startTime = performance.now();
    
    function frame(now) {
      try {
        const t = Math.min(1, (now - startTime) / duration);
        const lng = start[0] + (end[0] - start[0]) * t;
        const lat = start[1] + (end[1] - start[1]) * t;
        
        // Ensure we have valid coordinates
        if (isNaN(lng) || isNaN(lat)) {
          console.error('Invalid coordinates during animation:', { lng, lat });
          return;
        }
        
        // Calculate bearing for the unit marker
        if (marker === unitMarker.current) {
          const bearing = calculateBearing(start, [lng, lat]);
          const el = marker.getElement();
          if (el) {
            el.style.transform = `rotate(${bearing}deg)`;
          }
        }
        
        // Update marker position
        marker.setLngLat([lng, lat]);
        
        // Continue animation if not complete
        if (t < 1) {
          requestAnimationFrame(frame);
        }
      } catch (error) {
        console.error('Error in animation frame:', error);
      }
    }
    
    // Start the animation
    requestAnimationFrame(frame);
  };

  // Calculate bearing between two points
  const calculateBearing = (start, end) => {
    const startLng = start[0] * (Math.PI / 180);
    const startLat = start[1] * (Math.PI / 180);
    const endLng = end[0] * (Math.PI / 180);
    const endLat = end[1] * (Math.PI / 180);
    
    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - 
              Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    
    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    return (bearing + 360) % 360;
  };

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }} 
    />
  );
}



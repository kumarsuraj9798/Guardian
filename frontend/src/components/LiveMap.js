import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export default function LiveMap({ center=[77.209,28.6139], incident, unit }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const unitMarker = useRef(null);
  const incidentMarker = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapObj.current) return; // init once
    mapObj.current = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center,
      zoom: 11,
    });
  }, [center]);

  useEffect(() => {
    if (!mapObj.current) return;
    if (incident && !incidentMarker.current) {
      incidentMarker.current = new maplibregl.Marker({ color: "#e53935" })
        .setLngLat(incident.location.coordinates)
        .addTo(mapObj.current);
    } else if (incident && incidentMarker.current) {
      incidentMarker.current.setLngLat(incident.location.coordinates);
    }
  }, [incident]);

  useEffect(() => {
    if (!mapObj.current) return;
    if (unit && !unitMarker.current) {
      unitMarker.current = new maplibregl.Marker({ color: "#00c853" })
        .setLngLat(unit.location.coordinates)
        .addTo(mapObj.current);
    } else if (unit && unitMarker.current) {
      // animate move towards target
      const start = unitMarker.current.getLngLat();
      const end = unit.location.coordinates;
      animateMarker(unitMarker.current, [start.lng, start.lat], end, 600);
    }
  }, [unit]);

  return <div ref={mapRef} style={{ width: "100%", height: 320, borderRadius: 16, overflow: "hidden" }} />;
}

function animateMarker(marker, start, end, duration) {
  const startTime = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    marker.setLngLat([lng, lat]);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}



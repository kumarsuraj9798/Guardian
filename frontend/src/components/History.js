import React, { useEffect, useState } from "react";
import { getHistory } from "../services/api";

export default function History() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    (async () => {
      const res = await getHistory();
      setItems(res.data.history || []);
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>My Incident History</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((h) => (
          <div key={h._id} style={{ background: "#e8f5e9", padding: 12, borderRadius: 10 }}>
            <div><b>Status:</b> {h.status}</div>
            <div><b>Service:</b> {h.incidentId?.classifiedService || "-"}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{new Date(h.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}



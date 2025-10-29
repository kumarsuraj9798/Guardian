import React, { useState, useEffect } from 'react';
import './History.css'; // We will create this CSS file next
import { getHistory } from "../services/api"; // Assumes your API function is named getHistory

// Helper function to get a color based on incident status
const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'resolved':
      return { backgroundColor: '#28a745', color: '#fff' }; // Green
    case 'dispatched':
      return { backgroundColor: '#0d6efd', color: '#fff' }; // Blue
    case 'processing':
      return { backgroundColor: '#ffc107', color: '#000' }; // Yellow
    case 'cancelled':
      return { backgroundColor: '#dc3545', color: '#fff' }; // Red
    default:
      return { backgroundColor: '#6c757d', color: '#fff' }; // Grey for 'reported' or others
  }
};

export default function History() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Citizen');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 1. Get user data from local storage (or your auth context)
        const userData = JSON.parse(localStorage.getItem('gn_user'));
        if (!userData || !userData._id) {
          throw new Error('You must be logged in to view your history.');
        }
        const userId = userData._id;
        setUserName(userData.name || userData.email || 'Citizen');

        // 2. Fetch all incidents from the backend
        const response = await getHistory();
        
        // 3. Filter incidents to show only those reported by the current user
        const userIncidents = (response.data.history || []).filter(
          (item) => item.incidentId?.reportedBy === userId
        );
        
        // Sort incidents by date, newest first
        userIncidents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setIncidents(userIncidents);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to fetch incident history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []); // The empty array ensures this runs only once

  if (loading) {
    return <div className="history-container"><p className="loading-message">Loading your history...</p></div>;
  }

  if (error) {
    return <div className="history-container"><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="history-container">
      <h1 className="history-title">Incident History for {userName}</h1>
      {incidents.length > 0 ? (
        <div className="incidents-list">
          {incidents.map((h) => (
            <div key={h._id} className="incident-card">
              <div className="incident-header">
                <span className="incident-date">
                  {new Date(h.createdAt).toLocaleString()}
                </span>
                <span 
                  className="incident-status" 
                  style={getStatusStyle(h.status)}
                >
                  {h.status}
                </span>
              </div>
              <p className="incident-description">
                <strong>Service Required:</strong> {h.incidentId?.classifiedService || "N/A"}
              </p>
              <p className="incident-details">
                {h.incidentId?.description || 'No description was provided for this incident.'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-incidents-message">You have not reported any incidents yet.</p>
      )}
    </div>
  );
}


import { useState, useEffect, useCallback } from "react";
import { 
  getSessionHistory, 
  getLocalHistory, 
  addPageVisit, 
  addIncidentReport, 
  updateLocalPreferences,
  trackPageVisit,
  trackIncidentReport
} from "../services/sessionService";

export const useSessionHistory = () => {
  const [history, setHistory] = useState({
    pageVisits: [],
    incidentReports: [],
    adminActions: [],
    preferences: {},
    lastActivity: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load session history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get server-side history first
      const token = localStorage.getItem("gn_token");
      if (token) {
        try {
          const response = await getSessionHistory();
          setHistory(response.data);
        } catch (serverError) {
          console.warn("Server history unavailable, using local history:", serverError);
          // Fallback to local history
          const localHistory = getLocalHistory();
          setHistory({
            pageVisits: localHistory.pageVisits || [],
            incidentReports: localHistory.incidentReports || [],
            adminActions: [],
            preferences: localHistory.preferences || {},
            lastActivity: localHistory.lastUpdated
          });
        }
      } else {
        // No token, use local history only
        const localHistory = getLocalHistory();
        setHistory({
          pageVisits: localHistory.pageVisits || [],
          incidentReports: localHistory.incidentReports || [],
          adminActions: [],
          preferences: localHistory.preferences || {},
          lastActivity: localHistory.lastUpdated
        });
      }
    } catch (err) {
      setError(err.message);
      console.error("Error loading session history:", err);
    } finally {
      setLoading(false);
    }
  };

  const trackPage = useCallback((page, duration = 0) => {
    trackPageVisit(page);
    
    // Update local state
    setHistory(prev => ({
      ...prev,
      pageVisits: [
        ...prev.pageVisits,
        {
          page,
          timestamp: new Date().toISOString(),
          duration
        }
      ].slice(-50) // Keep only last 50 visits
    }));
  }, []);

  const trackIncident = useCallback((incidentData) => {
    trackIncidentReport(incidentData);
    
    // Update local state
    setHistory(prev => ({
      ...prev,
      incidentReports: [
        ...prev.incidentReports,
        {
          ...incidentData,
          timestamp: new Date().toISOString(),
          id: `local_${Date.now()}`
        }
      ].slice(-20) // Keep only last 20 reports
    }));
  }, []);

  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      updateLocalPreferences(newPreferences);
      
      // Update local state
      setHistory(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...newPreferences }
      }));

      // Try to update on server if logged in
      const token = localStorage.getItem("gn_token");
      if (token) {
        try {
          await updatePreferences(newPreferences);
        } catch (serverError) {
          console.warn("Failed to update server preferences:", serverError);
        }
      }
    } catch (err) {
      setError(err.message);
      console.error("Error updating preferences:", err);
    }
  }, []);

  const getRecentActivity = useCallback((limit = 10) => {
    const allActivity = [
      ...history.pageVisits.map(visit => ({
        type: 'page_visit',
        ...visit
      })),
      ...history.incidentReports.map(report => ({
        type: 'incident_report',
        ...report
      })),
      ...history.adminActions.map(action => ({
        type: 'admin_action',
        ...action
      }))
    ];

    return allActivity
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }, [history]);

  const getStats = useCallback(() => {
    return {
      totalPageVisits: history.pageVisits.length,
      totalIncidentReports: history.incidentReports.length,
      totalAdminActions: history.adminActions.length,
      lastActivity: history.lastActivity,
      recentActivity: getRecentActivity(5)
    };
  }, [history, getRecentActivity]);

  return {
    history,
    loading,
    error,
    loadHistory,
    trackPage,
    trackIncident,
    updatePreferences,
    getRecentActivity,
    getStats
  };
};

export default useSessionHistory;

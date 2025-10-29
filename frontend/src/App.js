import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import SignIn from "./components/SignIn";
import RoleSelect from "./components/RoleSelect";
import CitizenPortal from "./components/CitizenPortal";
import AdminDashboard from "./components/AdminDashboard";
import History from "./components/History";
import Footer from "./components/Footer";
import InstagramCallback from "./components/InstagramCallback";
import NotificationPermission from "./components/NotificationPermission";
import IncidentMap from "./components/IncidentMap";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import { useSessionHistory } from "./hooks/useSessionHistory";
import authService from "./services/authService";
import notificationService from "./services/notificationService";
import "./App.css";

function App() {
  const [page, setPage] = useState("landing");
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const { trackPage } = useSessionHistory();

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();
      
      setIsAuthenticated(authenticated);
      setUser(currentUser);
      
      if (authenticated && currentUser) {
        setRole(currentUser.role);
        setPage(currentUser.role === "citizen" ? "citizen" : "admin");
      }
    };

    checkAuth();

    // Listen for auth logout events
    const handleLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      setPage("landing");
    };

    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  // Track page visits
  useEffect(() => {
    trackPage(page);
  }, [page, trackPage]);

  // Request notification permission on app load
  useEffect(() => {
    if (isAuthenticated) {
      notificationService.requestPermission();
    }
  }, [isAuthenticated]);

  const handleSignIn = (userRole) => {
    if (userRole) {
      setRole(userRole);
      setIsAuthenticated(true);
      setUser(authService.getCurrentUser());
      setPage(userRole === "citizen" ? "citizen" : "admin");
    } else {
      setPage("role");
    }
  };

  const handleRoleSelect = (r) => {
    setRole(r);
    setIsAuthenticated(true);
    setUser(authService.getCurrentUser());
    setPage(r === "citizen" ? "citizen" : "admin");
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    setPage("landing");
  };

  // Protected route component
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
      // Redirect to home if not authorized
      setPage(role === 'admin' ? 'admin' : 'citizen');
      return null;
    }
    return children;
  };

  return (
    <>
      <NotificationPermission />
      <Navbar 
        go={setPage} 
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
      {page === "landing" && <LandingPage onSignInClick={() => setPage("signin")} />}
      {page === "signin" && <SignIn onSignIn={handleSignIn} onClose={() => setPage("landing")} />}
      {page === "role" && <RoleSelect onSelect={handleRoleSelect} />}
      {page === "citizen" && <CitizenPortal />}
      {page === "admin" && <AdminDashboard />}
      {page === "history" && <History />}
      {page === "map" && (
        <div className="map-page">
          <h2>Emergency Incidents Map</h2>
          <IncidentMap 
            incidents={[
              {
                id: 1,
                type: 'Medical',
                location: 'Downtown Medical Center',
                lat: 40.7128,
                lng: -74.0060,
                status: 'In Progress',
                priority: 'high',
                time: '2 min ago',
                description: 'Cardiac emergency reported'
              },
              {
                id: 2,
                type: 'Fire',
                location: 'Industrial District',
                lat: 40.7589,
                lng: -73.9851,
                status: 'Responding',
                priority: 'high',
                time: '5 min ago',
                description: 'Building fire with smoke'
              },
              {
                id: 3,
                type: 'Accident',
                location: 'Highway 101',
                lat: 40.7505,
                lng: -73.9934,
                status: 'En Route',
                priority: 'medium',
                time: '3 min ago',
                description: 'Multi-vehicle collision'
              }
            ]}
            showHeatmap={true}
          />
        </div>
      )}
      {page === "analytics" && (
        <ProtectedRoute requiredRole="admin">
          <AnalyticsDashboard />
        </ProtectedRoute>
      )}
      {page === "profile" && <Profile />}
      {page === "settings" && <Settings />}
      {page === "instagram-callback" && <InstagramCallback />}
      <Footer />
    </>
  );
}

export default App;

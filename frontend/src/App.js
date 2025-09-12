import React, { useState } from "react";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import SignIn from "./components/SignIn";
import RoleSelect from "./components/RoleSelect";
import CitizenPortal from "./components/CitizenPortal";
import AdminDashboard from "./components/AdminDashboard";
import History from "./components/History";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const [page, setPage] = useState("landing");
  const [role, setRole] = useState(null);

  const handleSignIn = () => setPage("role");
  const handleRoleSelect = (r) => {
    setRole(r);
    setPage(r === "citizen" ? "citizen" : "admin");
  };

  return (
    <>
      <Navbar go={setPage} />
      {page === "landing" && <LandingPage onSignInClick={() => setPage("signin")} />}
      {page === "signin" && <SignIn onSignIn={handleSignIn} />}
      {page === "role" && <RoleSelect onSelect={handleRoleSelect} />}
      {page === "citizen" && <CitizenPortal />}
      {page === "admin" && <AdminDashboard />}
      {page === "history" && <History />}
      <Footer />
    </>
  );
}

export default App;

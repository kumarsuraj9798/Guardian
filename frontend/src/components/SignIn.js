import React, { useEffect, useState } from "react";
import { authGoogle, emailLogin, emailRegister } from "../services/api";

export default function SignIn({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("citizen");
  const [rememberMe, setRememberMe] = useState(false);
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    phone: "",
    role: "citizen"
  });

  useEffect(() => {
    // Load saved credentials if remember me was checked
    const savedEmail = localStorage.getItem("gn_remember_email");
    const savedPassword = localStorage.getItem("gn_remember_password");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }

    // Load Google Identity Services
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
          callback: async (resp) => {
            const res = await authGoogle({ idToken: resp.credential });
            localStorage.setItem("gn_token", res.data.token);
            onSignIn?.(res.data.user.role);
          },
        });
        const btn = document.getElementById("googleSignInDiv");
        if (btn) window.google.accounts.id.renderButton(btn, { theme: "filled_blue", size: "large", shape: "pill" });
      }
    };
    document.body.appendChild(s);
  }, [onSignIn]);

  const doEmailLogin = async () => {
    const res = await emailLogin({ email, password });
    localStorage.setItem("gn_token", res.data.token);
    
    // Handle remember me functionality
    if (rememberMe) {
      localStorage.setItem("gn_remember_email", email);
      localStorage.setItem("gn_remember_password", password);
    } else {
      localStorage.removeItem("gn_remember_email");
      localStorage.removeItem("gn_remember_password");
    }
    
    onSignIn?.(res.data.user.role);
  };

  const handleForgotPassword = () => {
    if (!email) {
      alert("Please enter your email address first");
      return;
    }
    // In a real app, this would send a password reset email
    alert(`Password reset instructions have been sent to ${email}`);
  };

  const doEmailRegister = async () => {
    if (!registerData.email || !registerData.password || !registerData.phone) {
      alert("Please fill all required fields (email, password, contact number)");
      return;
    }
    try {
      const payload = { 
        email: registerData.email, 
        password: registerData.password, 
        name: registerData.email.split('@')[0], // Use email prefix as name
        phone: registerData.phone,
        role: registerData.role 
      };
      const res = await emailRegister(payload);
      localStorage.setItem("gn_token", res.data.token);
      
      // Close register modal and pass the role to onSignIn callback
      setShowRegisterModal(false);
      onSignIn?.(registerData.role);
    } catch (error) {
      console.error("Register failed:", error.response?.data || error.message);
      alert("Registration failed: " + (error.response?.data?.message || error.message));
    }
  };

  const handleRegisterInputChange = (field, value) => {
    setRegisterData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="signin-modal-overlay">
      <div className="signin-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Log in</h2>
          <button className="close-btn" onClick={() => window.history.back()}>×</button>
        </div>

        {/* New User Link */}
        <div className="new-user-link">
          New user? <span className="register-link" onClick={() => setShowRegisterModal(true)}>Register Now</span>
        </div>

        {/* Google Sign-in Button */}
        <div className="google-signin-container">
          <button 
            className="google-signin-btn" 
            onClick={() => setShowGooglePopup(true)}
          >
            <span className="google-icon">G</span>
            Continue with Google
          </button>
        </div>

        {/* Social Media Icons */}
        <div className="social-icons">
          <button className="social-btn facebook">
            <span className="social-icon">f</span>
          </button>
          <button className="social-btn linkedin">
            <span className="social-icon">in</span>
          </button>
          <button className="social-btn github">
            <span className="social-icon">G</span>
          </button>
          <button className="social-btn microsoft">
            <span className="social-icon">M</span>
          </button>
        </div>

        {/* Separator */}
        <div className="separator">
          <span>or</span>
        </div>

        {/* Form Fields */}
        <div className="form-fields">
          <div className="input-group">
            <label className="input-label">Username or Email</label>
            <input 
              placeholder="Username or Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="form-input"
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              placeholder="Enter password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="form-input"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkmark"></span>
              Remember Me
            </label>
            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }}>Forgot password</a>
          </div>

          {/* Role Selection */}
          <div className="input-group">
            <label className="input-label">Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="form-select"
            >
              <option value="citizen">Citizen</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Sign In Button */}
        <button onClick={doEmailLogin} className="signin-btn">
          Sign In
        </button>

        {/* Terms and Policies */}
        <div className="terms-text">
          By creating this account, you agree to our <a href="#" className="policy-link">Privacy Policy</a> & <a href="#" className="policy-link">Cookie Policy</a>.
        </div>

        {/* Register Button */}
        <div className="register-section">
          <button onClick={doEmailRegister} className="register-btn">
            Register New Account
          </button>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="register-modal-overlay">
          <div className="register-modal">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">Create Account</h2>
              <button className="close-btn" onClick={() => setShowRegisterModal(false)}>×</button>
            </div>

            {/* Already have account link */}
            <div className="new-user-link">
              Already have an account? <span className="register-link" onClick={() => setShowRegisterModal(false)}>Log in</span>
            </div>

            {/* Form Fields */}
            <div className="form-fields">
              <div className="input-group">
                <label className="input-label">Email Address *</label>
                <input 
                  placeholder="Enter your email address" 
                  type="email"
                  value={registerData.email} 
                  onChange={(e) => handleRegisterInputChange('email', e.target.value)} 
                  className="form-input"
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Password *</label>
                <input 
                  placeholder="Create a strong password" 
                  type="password" 
                  value={registerData.password} 
                  onChange={(e) => handleRegisterInputChange('password', e.target.value)} 
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Contact Number *</label>
                <input 
                  placeholder="Enter your contact number" 
                  type="tel"
                  value={registerData.phone} 
                  onChange={(e) => handleRegisterInputChange('phone', e.target.value)} 
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Account Type *</label>
                <select 
                  value={registerData.role} 
                  onChange={(e) => handleRegisterInputChange('role', e.target.value)}
                  className="form-select"
                >
                  <option value="citizen">Citizen - Report Emergencies</option>
                  <option value="admin">Admin - Manage Emergency Services</option>
                </select>
              </div>
            </div>

            {/* Sign Up Button */}
            <button onClick={doEmailRegister} className="signup-btn">
              Sign Up
            </button>

            {/* Separator */}
            <div className="separator">
              <span>or</span>
            </div>

            {/* Google Sign-in Button */}
            <div className="google-signin-container">
              <button 
                className="google-signin-btn" 
                onClick={() => setShowGooglePopup(true)}
              >
                <span className="google-icon">G</span>
                Continue with Google
              </button>
            </div>

            {/* Social Media Icons */}
            <div className="social-icons">
              <button className="social-btn facebook">
                <span className="social-icon">f</span>
              </button>
              <button className="social-btn linkedin">
                <span className="social-icon">in</span>
              </button>
              <button className="social-btn github">
                <span className="social-icon">G</span>
              </button>
              <button className="social-btn microsoft">
                <span className="social-icon">M</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sign-in Popup */}
      <div className="google-popup" style={{ display: showGooglePopup ? 'block' : 'none' }}>
        <div className="google-popup-content">
          <h3>Sign in with Google</h3>
          <div id="googleSignInDiv" />
          <button className="close-popup" onClick={() => setShowGooglePopup(false)}>×</button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { emailLogin, emailRegister, authFacebook, authInstagram } from "../services/api";
import { loginWithFacebook, loginWithInstagram } from "../utils/socialAuth";

export default function SignIn({ onSignIn, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("citizen");
  const [rememberMe, setRememberMe] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleInstagramLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Get Instagram auth data
      const instagramData = await loginWithInstagram();
      
      // Send to backend for verification and token generation
      const response = await authInstagram({
        accessToken: instagramData.accessToken,
        userInfo: instagramData.userInfo
      });
      
      // Store token and sign in
      localStorage.setItem("gn_token", response.data.token);
      onSignIn?.(response.data.user.role || "citizen");
      
    } catch (error) {
      console.error("Instagram login error:", error);
      alert(`Instagram login failed: ${error.message}. Please try again or use email login.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Get Facebook auth data
      const facebookData = await loginWithFacebook();
      
      // Send to backend for verification and token generation
      const response = await authFacebook({
        accessToken: facebookData.accessToken,
        userInfo: facebookData.userInfo
      });
      
      // Store token and sign in
      localStorage.setItem("gn_token", response.data.token);
      onSignIn?.(response.data.user.role || "citizen");
      
    } catch (error) {
      console.error("Facebook login error:", error);
      alert(`Facebook login failed: ${error.message}. Please try again or use email login.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-modal-overlay">
      <div className="signin-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Log in</h2>
          <button 
            className="close-btn" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose?.();
            }}
            style={{
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(244, 67, 54, 0.3)"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#d32f2f";
              e.target.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#f44336";
              e.target.style.transform = "scale(1)";
            }}
          >
            ×
          </button>
        </div>

        {/* New User Link */}
        <div className="new-user-link">
          New user? <span className="register-link" onClick={() => setShowRegisterModal(true)}>Register Now</span>
        </div>

        {/* Social Media Icons */}
        <div className="social-icons">
          <button 
            className={`social-btn instagram ${isLoading ? 'loading' : ''}`} 
            onClick={handleInstagramLogin} 
            title="Login with Instagram"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="social-icon">⏳</span>
            ) : (
              <svg className="instagram-logo" viewBox="0 0 24 24" width="20" height="20">
                <defs>
                  <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f09433" />
                    <stop offset="25%" stopColor="#e6683c" />
                    <stop offset="50%" stopColor="#dc2743" />
                    <stop offset="75%" stopColor="#cc2366" />
                    <stop offset="100%" stopColor="#bc1888" />
                  </linearGradient>
                </defs>
                <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            )}
          </button>
          <button 
            className={`social-btn facebook ${isLoading ? 'loading' : ''}`} 
            onClick={handleFacebookLogin} 
            title="Login with Facebook"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="social-icon">⏳</span>
            ) : (
              <svg className="facebook-logo" viewBox="0 0 24 24" width="20" height="20">
                <path fill="white" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
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

      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="register-modal-overlay">
          <div className="register-modal">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">Create Account</h2>
              <button 
                className="close-btn" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowRegisterModal(false);
                }}
                style={{
                  background: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(244, 67, 54, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#d32f2f";
                  e.target.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#f44336";
                  e.target.style.transform = "scale(1)";
                }}
              >
                ×
              </button>
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

            {/* Social Media Icons */}
            <div className="social-icons">
              <button 
                className={`social-btn instagram ${isLoading ? 'loading' : ''}`} 
                onClick={handleInstagramLogin} 
                title="Login with Instagram"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="social-icon">⏳</span>
                ) : (
                  <svg className="instagram-logo" viewBox="0 0 24 24" width="20" height="20">
                    <defs>
                      <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f09433" />
                        <stop offset="25%" stopColor="#e6683c" />
                        <stop offset="50%" stopColor="#dc2743" />
                        <stop offset="75%" stopColor="#cc2366" />
                        <stop offset="100%" stopColor="#bc1888" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                )}
              </button>
              <button 
                className={`social-btn facebook ${isLoading ? 'loading' : ''}`} 
                onClick={handleFacebookLogin} 
                title="Login with Facebook"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="social-icon">⏳</span>
                ) : (
                  <svg className="facebook-logo" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="white" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

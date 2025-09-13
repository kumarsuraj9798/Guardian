import React, { useEffect, useState } from "react";
import { emailLogin, emailRegister, authInstagram, authGoogle } from "../services/api";
import { loginWithInstagram, loginWithGoogle } from "../utils/socialAuth";
import authService from "../services/authService";
import notificationService from "../services/notificationService";

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
    if (isLoading) return;

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem("gn_remember_email", email);
          localStorage.setItem("gn_remember_password", password);
        } else {
          localStorage.removeItem("gn_remember_email");
          localStorage.removeItem("gn_remember_password");
        }

        // Request notification permission after successful login
        notificationService.requestPermission();

        onSignIn?.(result.user.role);
      } else {
        // Handle different error cases
        if (result.error.includes("not found") || result.error.includes("invalid")) {
          alert("User not found! Please register first or check your credentials.");
          setShowRegisterModal(true);
        } else if (result.error.includes("missing") || result.error.includes("validation")) {
          alert("Please enter both email and password.");
        } else if (result.error.includes("server")) {
          alert("Server error. Please try again later.");
        } else {
          alert(`Login failed: ${result.error}. Please try again.`);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(`Login failed: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
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
      const result = await authService.register(payload);
      
      if (result.success) {
        // Request notification permission after successful registration
        notificationService.requestPermission();
        
        // Close register modal and pass the role to onSignIn callback
        setShowRegisterModal(false);
        onSignIn?.(registerData.role);
      } else {
        alert(`Registration failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Register failed:", error.response?.data || error.message);
      
      // Handle different registration error cases
      if (error.response?.status === 409) {
        // User already exists
        alert("This email is already registered! Please try logging in instead.");
        setShowRegisterModal(false); // Close register modal
      } else if (error.response?.status === 400) {
        // Validation error
        alert("Please check your information and try again. Make sure all fields are filled correctly.");
      } else if (error.response?.status === 500) {
        // Server error
        alert("Server error. Please try again later.");
      } else {
        // Other errors
        alert("Registration failed: " + (error.response?.data?.message || error.message));
      }
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

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Get Google auth data
      const googleData = await loginWithGoogle();
      
      // Send to backend for verification and token generation
      const response = await authGoogle({
        idToken: googleData.idToken,
        userInfo: googleData.userInfo
      });
      
      // Request notification permission after successful login
      notificationService.requestPermission();
      
      // Store token and sign in
      localStorage.setItem("gn_token", response.data.token);
      onSignIn?.(response.data.user.role || "citizen");
      
    } catch (error) {
      console.error("Google login error:", error);
      
      // Handle specific error cases
      if (error.message.includes("not configured")) {
        alert("Google sign-in is not configured yet. Please use email login or contact support.");
      } else if (error.message.includes("cancelled")) {
        // User cancelled - don't show error
        console.log("Google sign-in was cancelled by user");
      } else {
        alert(`Google login failed: ${error.message}. Please try again or use email login.`);
      }
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
            className="social-btn google" 
            onClick={handleGoogleLogin} 
            title="Login with Google"
            disabled={isLoading}
          >
            <svg className="google-logo" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
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
        <button 
          onClick={doEmailLogin} 
          className="signin-btn"
          disabled={isLoading}
          style={{
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
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
            <button 
              onClick={doEmailRegister} 
              className="signup-btn"
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>

            {/* Separator */}
            <div className="separator">
              <span>or</span>
            </div>

            {/* Social Media Icons */}
            <div className="social-icons">
              <button 
                className="social-btn google" 
                onClick={handleGoogleLogin} 
                title="Sign up with Google"
                disabled={isLoading}
              >
                <svg className="google-logo" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              <button 
                className={`social-btn instagram ${isLoading ? 'loading' : ''}`} 
                onClick={handleInstagramLogin} 
                title="Sign up with Instagram"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="social-icon">⏳</span>
                ) : (
                  <svg className="instagram-logo" viewBox="0 0 24 24" width="20" height="20">
                    <defs>
                      <linearGradient id="instagram-gradient-register" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f09433" />
                        <stop offset="25%" stopColor="#e6683c" />
                        <stop offset="50%" stopColor="#dc2743" />
                        <stop offset="75%" stopColor="#cc2366" />
                        <stop offset="100%" stopColor="#bc1888" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#instagram-gradient-register)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
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

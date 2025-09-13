// JWT Authentication Service
import axios from 'axios';

class AuthService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.token = localStorage.getItem('gn_token');
    this.refreshToken = localStorage.getItem('gn_refresh_token');
    
    // Set up axios interceptors
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Login with email and password
  async login(email, password) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email,
        password
      });

      const { token, refreshToken, user } = response.data;
      
      this.setTokens(token, refreshToken);
      this.setUser(user);
      
      return { success: true, user, token };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/register`, userData);
      
      const { token, refreshToken, user } = response.data;
      
      this.setTokens(token, refreshToken);
      this.setUser(user);
      
      return { success: true, user, token };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  }

  // Social login (Google, Facebook, etc.)
  async socialLogin(provider, accessToken, userInfo) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/social`, {
        provider,
        accessToken,
        userInfo
      });

      const { token, refreshToken, user } = response.data;
      
      this.setTokens(token, refreshToken);
      this.setUser(user);
      
      return { success: true, user, token };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Social login failed' 
      };
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refreshToken: this.refreshToken
      });

      const { token } = response.data;
      this.token = token;
      localStorage.setItem('gn_token', token);
      
      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // Logout user
  logout() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('gn_token');
    localStorage.removeItem('gn_refresh_token');
    localStorage.removeItem('gn_user');
    
    // Notify other components about logout
    window.dispatchEvent(new CustomEvent('auth-logout'));
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && this.isTokenValid();
  }

  // Check if token is valid (not expired)
  isTokenValid() {
    if (!this.token) return false;
    
    try {
      const payload = this.parseJWT(this.token);
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('gn_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get current token
  getToken() {
    return this.token;
  }

  // Set tokens and user data
  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    
    localStorage.setItem('gn_token', token);
    if (refreshToken) {
      localStorage.setItem('gn_refresh_token', refreshToken);
    }
  }

  setUser(user) {
    localStorage.setItem('gn_user', JSON.stringify(user));
  }

  // Parse JWT token
  parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }

  // Get user role
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || 'citizen';
  }

  // Check if user has specific role
  hasRole(role) {
    return this.getUserRole() === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    const userRole = this.getUserRole();
    return roles.includes(userRole);
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await axios.put(`${this.baseURL}/auth/profile`, userData);
      const { user } = response.data;
      
      this.setUser(user);
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Profile update failed' 
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      await axios.put(`${this.baseURL}/auth/password`, {
        currentPassword,
        newPassword
      });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Password change failed' 
      };
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      await axios.post(`${this.baseURL}/auth/forgot-password`, { email });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Password reset request failed' 
      };
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      await axios.post(`${this.baseURL}/auth/reset-password`, {
        token,
        newPassword
      });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Password reset failed' 
      };
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/verify-email`, { token });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Email verification failed' 
      };
    }
  }

  // Resend verification email
  async resendVerificationEmail() {
    try {
      await axios.post(`${this.baseURL}/auth/resend-verification`);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to resend verification email' 
      };
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;

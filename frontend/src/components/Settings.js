import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import notificationService from '../services/notificationService';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    notifications: {
      emergency: true,
      updates: true,
      email: true,
      push: false
    },
    privacy: {
      shareLocation: true,
      shareData: false,
      publicProfile: false
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    }
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    setSettings(newSettings);
    localStorage.setItem('user_settings', JSON.stringify(newSettings));
    
    // Apply settings immediately
    applySettings(category, key, value);
  };

  const applySettings = (category, key, value) => {
    switch (category) {
      case 'notifications':
        if (key === 'push' && value) {
          notificationService.requestPermission();
        }
        break;
      case 'preferences':
        if (key === 'theme') {
          applyTheme(value);
        }
        break;
      case 'privacy':
        if (key === 'shareLocation') {
          handleLocationPermission(value);
        }
        break;
      default:
        break;
    }
  };

  const applyTheme = (theme) => {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    body.classList.add(`theme-${theme}`);
    
    // Store theme preference
    localStorage.setItem('theme', theme);
  };

  const handleLocationPermission = (enabled) => {
    if (enabled) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setMessage('Location access granted');
            localStorage.setItem('user_location', JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }));
          },
          (error) => {
            setMessage('Location access denied');
            handleSettingChange('privacy', 'shareLocation', false);
          }
        );
      } else {
        setMessage('Geolocation is not supported by this browser');
        handleSettingChange('privacy', 'shareLocation', false);
      }
    } else {
      localStorage.removeItem('user_location');
      setMessage('Location sharing disabled');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      if (result.success) {
        setMessage('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setMessage('Notification permission granted!');
      handleSettingChange('notifications', 'push', true);
      
      // Test notification
      setTimeout(() => {
        notificationService.showNotification(
          '🔔 Notifications Enabled',
          'You will now receive emergency alerts and updates from GuardianNet.'
        );
      }, 1000);
    } else {
      setMessage('Notification permission denied');
      handleSettingChange('notifications', 'push', false);
    }
  };

  const testNotification = () => {
    if (settings.notifications.push) {
      notificationService.showNotification(
        '🧪 Test Notification',
        'This is a test notification to verify your settings are working correctly.'
      );
    } else {
      setMessage('Please enable push notifications first');
    }
  };

  const handleEmailNotification = async (enabled) => {
    if (enabled) {
      // In a real app, this would call an API to enable email notifications
      setMessage('Email notifications enabled');
    } else {
      setMessage('Email notifications disabled');
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (confirmed) {
      // Implement account deletion logic
      setMessage('Account deletion requested. Please contact support.');
    }
  };

  if (!user) {
    return (
      <div className="settings-page">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h2>Settings</h2>
          <p>Manage your account preferences and security settings</p>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="settings-tabs">
          <button 
            className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            🔔 Notifications
          </button>
          <button 
            className={`tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            🔒 Privacy
          </button>
          <button 
            className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Preferences
          </button>
          <button 
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🛡️ Security
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3>Notification Settings</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Emergency Alerts</h4>
                  <p>Receive notifications for emergency incidents in your area</p>
                  <div className="notification-status">
                    {settings.notifications.emergency ? (
                      <span className="status-enabled">✅ Active</span>
                    ) : (
                      <span className="status-disabled">❌ Disabled</span>
                    )}
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emergency}
                    onChange={(e) => handleSettingChange('notifications', 'emergency', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>System Updates</h4>
                  <p>Get notified about system updates and maintenance</p>
                  <div className="notification-status">
                    {settings.notifications.updates ? (
                      <span className="status-enabled">✅ Active</span>
                    ) : (
                      <span className="status-disabled">❌ Disabled</span>
                    )}
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.updates}
                    onChange={(e) => handleSettingChange('notifications', 'updates', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Email Notifications</h4>
                  <p>Receive important updates via email</p>
                  <div className="notification-status">
                    {settings.notifications.email ? (
                      <span className="status-enabled">✅ Active</span>
                    ) : (
                      <span className="status-disabled">❌ Disabled</span>
                    )}
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => {
                      handleSettingChange('notifications', 'email', e.target.checked);
                      handleEmailNotification(e.target.checked);
                    }}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Push Notifications</h4>
                  <p>Receive browser push notifications</p>
                  <div className="notification-actions">
                    <button 
                      onClick={handleNotificationPermission}
                      className="btn-secondary"
                    >
                      {settings.notifications.push ? '✅ Enabled' : '🔔 Enable Push'}
                    </button>
                    {settings.notifications.push && (
                      <button 
                        onClick={testNotification}
                        className="btn-test"
                      >
                        🧪 Test
                      </button>
                    )}
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h3>Privacy Settings</h3>
              
              <div className="privacy-info">
                <p>🔒 Your privacy is important to us. These settings control how your data is used and shared.</p>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Share Location</h4>
                  <p>Allow GuardianNet to use your location for emergency services and incident reporting</p>
                  <div className="privacy-status">
                    {settings.privacy.shareLocation ? (
                      <span className="status-enabled">📍 Location sharing enabled</span>
                    ) : (
                      <span className="status-disabled">🚫 Location sharing disabled</span>
                    )}
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.privacy.shareLocation}
                    onChange={(e) => handleSettingChange('privacy', 'shareLocation', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Share Data</h4>
                  <p>Allow anonymous data sharing for system improvement and analytics</p>
                  <div className="privacy-status">
                    {settings.privacy.shareData ? (
                      <span className="status-enabled">📊 Data sharing enabled</span>
                    ) : (
                      <span className="status-disabled">🚫 Data sharing disabled</span>
                    )}
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.privacy.shareData}
                    onChange={(e) => handleSettingChange('privacy', 'shareData', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Public Profile</h4>
                  <p>Make your profile visible to other users and emergency admins</p>
                  <div className="privacy-status">
                    {settings.privacy.publicProfile ? (
                      <span className="status-enabled">👤 Profile is public</span>
                    ) : (
                      <span className="status-disabled">🔒 Profile is private</span>
                    )}
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.privacy.publicProfile}
                    onChange={(e) => handleSettingChange('privacy', 'publicProfile', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="privacy-summary">
                <h4>📋 Privacy Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Data Collection:</span>
                    <span className="summary-value">Minimal</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Data Storage:</span>
                    <span className="summary-value">Secure</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Data Sharing:</span>
                    <span className="summary-value">{settings.privacy.shareData ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Location Access:</span>
                    <span className="summary-value">{settings.privacy.shareLocation ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-section">
              <h3>App Preferences</h3>
              
              <div className="preferences-info">
                <p>⚙️ Customize your GuardianNet experience with these personal preferences.</p>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Theme</h4>
                  <p>Choose your preferred color theme for the application</p>
                  <div className="theme-preview">
                    <div className={`theme-option ${settings.preferences.theme === 'light' ? 'active' : ''}`}>
                      <div className="theme-light-preview"></div>
                      <span>Light</span>
                    </div>
                    <div className={`theme-option ${settings.preferences.theme === 'dark' ? 'active' : ''}`}>
                      <div className="theme-dark-preview"></div>
                      <span>Dark</span>
                    </div>
                    <div className={`theme-option ${settings.preferences.theme === 'auto' ? 'active' : ''}`}>
                      <div className="theme-auto-preview"></div>
                      <span>Auto</span>
                    </div>
                  </div>
                </div>
                <select
                  value={settings.preferences.theme}
                  onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                  className="form-select"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Language</h4>
                  <p>Select your preferred language for the interface</p>
                  <div className="language-info">
                    <span className="current-language">
                      🌐 Currently: {settings.preferences.language === 'en' ? 'English' : 
                                   settings.preferences.language === 'es' ? 'Spanish' :
                                   settings.preferences.language === 'fr' ? 'French' : 'German'}
                    </span>
                  </div>
                </div>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                  className="form-select"
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Timezone</h4>
                  <p>Set your local timezone for accurate time displays</p>
                  <div className="timezone-info">
                    <span className="current-timezone">
                      🕐 Current: {settings.preferences.timezone}
                    </span>
                    <span className="local-time">
                      Local time: {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                  className="form-select"
                >
                  <option value="UTC">UTC (GMT+0)</option>
                  <option value="America/New_York">🇺🇸 Eastern Time (GMT-5)</option>
                  <option value="America/Chicago">🇺🇸 Central Time (GMT-6)</option>
                  <option value="America/Denver">🇺🇸 Mountain Time (GMT-7)</option>
                  <option value="America/Los_Angeles">🇺🇸 Pacific Time (GMT-8)</option>
                  <option value="Europe/London">🇬🇧 London (GMT+0)</option>
                  <option value="Europe/Paris">🇫🇷 Paris (GMT+1)</option>
                  <option value="Asia/Tokyo">🇯🇵 Tokyo (GMT+9)</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Default Map View</h4>
                  <p>Choose your preferred default map view when opening the incident map</p>
                </div>
                <select
                  value={settings.preferences.mapView || 'satellite'}
                  onChange={(e) => handleSettingChange('preferences', 'mapView', e.target.value)}
                  className="form-select"
                >
                  <option value="street">Street View</option>
                  <option value="satellite">Satellite View</option>
                  <option value="hybrid">Hybrid View</option>
                  <option value="terrain">Terrain View</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Auto-refresh Interval</h4>
                  <p>How often should the dashboard automatically refresh data</p>
                </div>
                <select
                  value={settings.preferences.refreshInterval || '30'}
                  onChange={(e) => handleSettingChange('preferences', 'refreshInterval', e.target.value)}
                  className="form-select"
                >
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                  <option value="0">Manual only</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Security Settings</h3>
              
              <form onSubmit={handlePasswordChange} className="password-form">
                <h4>Change Password</h4>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="form-input"
                    required
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>

              <div className="danger-zone">
                <h4>Danger Zone</h4>
                <div className="danger-item">
                  <div className="danger-info">
                    <h5>Delete Account</h5>
                    <p>Permanently delete your account and all associated data</p>
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    className="btn-danger"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

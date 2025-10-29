import React, { useState, useEffect } from 'react';
import authService from '../services/authService';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        role: currentUser.role || ''
      });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const result = await authService.updateProfile(formData);
      if (result.success) {
        setUser(result.user);
        setMessage('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || ''
    });
    setIsEditing(false);
    setMessage('');
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h2>User Profile</h2>
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="profile-content">
          <div className="profile-section">
            <h3>Personal Information</h3>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-select"
              >
                <option value="citizen">Citizen</option>
                <option value="admin">Emergency Admin</option>
              </select>
            </div>
          </div>

          <div className="profile-section">
            <h3>Account Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">User ID:</span>
                <span className="info-value">{user.id || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Member Since:</span>
                <span className="info-value">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className={`status-badge ${user.status || 'active'}`}>
                  {user.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit Profile
              </button>
            ) : (
              <div className="action-buttons">
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

export default function NotificationPermission() {
  const [showBanner, setShowBanner] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = () => {
    const status = notificationService.getPermissionStatus();
    setPermissionStatus(status);
    
    // Show banner if notifications are supported but not granted
    if (status.supported && status.permission === 'default') {
      setShowBanner(true);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setShowBanner(false);
      // Show welcome notification
      notificationService.showNotification(
        '🔔 Notifications Enabled',
        'You will now receive emergency alerts and updates from GuardianNet.'
      );
    }
    checkNotificationPermission();
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Store dismissal preference
    localStorage.setItem('notification_banner_dismissed', 'true');
  };

  // Don't show banner if user previously dismissed it
  useEffect(() => {
    const dismissed = localStorage.getItem('notification_banner_dismissed');
    if (dismissed === 'true' && permissionStatus?.permission === 'default') {
      setShowBanner(false);
    }
  }, [permissionStatus]);

  if (!showBanner || !permissionStatus?.supported) {
    return null;
  }

  return (
    <div className="notification-permission-banner">
      <div className="banner-content">
        <span>🔔 Enable notifications to receive emergency alerts and updates</span>
        <button onClick={handleRequestPermission} className="enable-btn">
          Enable Notifications
        </button>
        <button onClick={handleDismiss} className="dismiss-btn">
          ×
        </button>
      </div>
    </div>
  );
}

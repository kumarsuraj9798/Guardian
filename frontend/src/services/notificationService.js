// Push Notification Service
class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Show emergency notification
  showEmergencyNotification(incident) {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    const options = {
      body: `Emergency: ${incident.type} at ${incident.location}`,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `emergency-${incident.id}`,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/logo.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/logo.png'
        }
      ],
      data: {
        incidentId: incident.id,
        type: incident.type,
        location: incident.location,
        priority: incident.priority || 'high'
      }
    };

    const notification = new Notification(`🚨 GuardianNet Alert`, options);

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      // Navigate to incident details or dashboard
      if (event.action === 'view') {
        window.location.href = `#/incident/${incident.id}`;
      }
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  }

  // Show general notification
  showNotification(title, message, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    const defaultOptions = {
      body: message,
      icon: '/logo.png',
      badge: '/logo.png',
      ...options
    };

    const notification = new Notification(title, defaultOptions);

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  // Show response unit notification
  showResponseNotification(unit, incident) {
    const title = `🚑 ${unit.type} Unit ${unit.id}`;
    const message = `Responding to ${incident.type} at ${incident.location}`;
    
    return this.showNotification(title, message, {
      tag: `response-${unit.id}`,
      data: { unitId: unit.id, incidentId: incident.id }
    });
  }

  // Show status update notification
  showStatusUpdate(incident, status) {
    const title = `📊 Incident Update`;
    const message = `${incident.type} status changed to: ${status}`;
    
    return this.showNotification(title, message, {
      tag: `status-${incident.id}`,
      data: { incidentId: incident.id, status }
    });
  }

  // Check if notifications are enabled
  isEnabled() {
    return this.isSupported && this.permission === 'granted';
  }

  // Get permission status
  getPermissionStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      enabled: this.isEnabled()
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;

// Social Authentication Utilities
// Instagram and Google login implementation

import { SOCIAL_AUTH_CONFIG } from '../config/socialAuth';

// Instagram App Configuration
const INSTAGRAM_CLIENT_ID = SOCIAL_AUTH_CONFIG.INSTAGRAM_CLIENT_ID;

// Google App Configuration
const GOOGLE_CLIENT_ID = SOCIAL_AUTH_CONFIG.GOOGLE_CLIENT_ID;

// Instagram Login (using Instagram Basic Display API)
export const loginWithInstagram = () => {
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/instagram/callback`);
  const scope = 'user_profile,user_media';
  
  const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  
  // Open Instagram auth in popup
  const popup = window.open(
    instagramAuthUrl,
    'instagram-login',
    'width=600,height=700,scrollbars=yes,resizable=yes'
  );
  
  return new Promise((resolve, reject) => {
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        reject(new Error('Instagram login was cancelled'));
      }
    }, 1000);
    
    // Listen for message from popup
    const messageListener = (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'INSTAGRAM_AUTH_SUCCESS') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        popup.close();
        resolve(event.data.data);
      } else if (event.data.type === 'INSTAGRAM_AUTH_ERROR') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        popup.close();
        reject(new Error(event.data.error));
      }
    };
    
    window.addEventListener('message', messageListener);
  });
};

// Handle Instagram callback (to be called from callback page)
export const handleInstagramCallback = (code) => {
  return new Promise((resolve, reject) => {
    // Exchange code for access token
    const tokenUrl = 'https://api.instagram.com/oauth/access_token';
    const params = new URLSearchParams({
      client_id: INSTAGRAM_CLIENT_ID,
      client_secret: SOCIAL_AUTH_CONFIG.INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: `${window.location.origin}/auth/instagram/callback`,
      code: code
    });
    
    fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    })
    .then(response => response.json())
    .then(data => {
      if (data.access_token) {
        // Get user profile
        return fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${data.access_token}`)
          .then(response => response.json())
          .then(profile => {
            resolve({
              accessToken: data.access_token,
              userInfo: {
                id: profile.id,
                username: profile.username,
                account_type: profile.account_type,
                media_count: profile.media_count
              }
            });
          });
      } else {
        reject(new Error(data.error_message || 'Failed to get access token'));
      }
    })
    .catch(error => reject(error));
  });
};

// Google Login (using Google Identity Services)
export const loginWithGoogle = () => {
  return new Promise((resolve, reject) => {
    // Check if Google client ID is configured
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      reject(new Error('Google Client ID not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your environment variables.'));
      return;
    }

    // Load Google Identity Services script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(() => {
          initializeGoogleAuth(resolve, reject);
        }, 100); // Small delay to ensure Google is fully loaded
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      document.head.appendChild(script);
    } else {
      initializeGoogleAuth(resolve, reject);
    }
  });
};

const initializeGoogleAuth = (resolve, reject) => {
  try {
    if (!window.google || !window.google.accounts) {
      reject(new Error('Google Identity Services not loaded properly'));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        try {
          // Decode the JWT token to get user info
          const payload = JSON.parse(atob(response.credential.split('.')[1]));
          resolve({
            idToken: response.credential,
            userInfo: {
              id: payload.sub,
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
              given_name: payload.given_name,
              family_name: payload.family_name
            }
          });
        } catch (error) {
          reject(new Error('Failed to parse Google response'));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    // Prompt the user to sign in
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // User cancelled or skipped
        reject(new Error('Google sign-in was cancelled'));
      }
    });
  } catch (error) {
    reject(new Error('Failed to initialize Google authentication'));
  }
};

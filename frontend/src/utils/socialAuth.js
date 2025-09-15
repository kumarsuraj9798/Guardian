// Social Authentication Utilities
// Instagram and Google login implementation

import { SOCIAL_AUTH_CONFIG } from '../config/socialAuth';

// App Configurations - Defined once at the top
const INSTAGRAM_CLIENT_ID = SOCIAL_AUTH_CONFIG.INSTAGRAM_CLIENT_ID;
const GOOGLE_CLIENT_ID = SOCIAL_AUTH_CONFIG.GOOGLE_CLIENT_ID;

// --- Instagram Login ---
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

// --- Handle Instagram Callback ---
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


// --- Google Login ---
export const loginWithGoogle = () => {
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
  // Standard scopes to get user's profile and email
  const scope = encodeURIComponent('openid email profile');
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&prompt=consent`;
  
  // Open Google auth in a popup
  const popup = window.open(
    googleAuthUrl,
    'google-login',
    'width=600,height=700,scrollbars=yes,resizable=yes'
  );
  
  return new Promise((resolve, reject) => {
    // Check if the user closed the popup
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        reject(new Error('Google login was cancelled'));
      }
    }, 1000);
    
    // Listen for a message from the callback page
    const messageListener = (event) => {
      // Ensure the message is from our own origin
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        popup.close();
        resolve(event.data.data);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        popup.close();
        reject(new Error(event.data.error));
      }
    };
    
    window.addEventListener('message', messageListener);
  });
};

// --- Handle Google Callback ---
export const handleGoogleCallback = (code) => {
  return new Promise((resolve, reject) => {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: SOCIAL_AUTH_CONFIG.GOOGLE_CLIENT_SECRET, // ⚠️ See security warning below
      grant_type: 'authorization_code',
      redirect_uri: `${window.location.origin}/auth/google/callback`,
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
      if (data.id_token) {
        // The id_token is a JWT that contains the user's profile info.
        const payload = JSON.parse(atob(data.id_token.split('.')[1]));
        
        resolve({
          idToken: data.id_token,
          accessToken: data.access_token,
          userInfo: {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            given_name: payload.given_name,
            family_name: payload.family_name
          }
        });
      } else {
        reject(new Error(data.error_description || 'Failed to get Google ID token'));
      }
    })
    .catch(error => reject(error));
  });
};
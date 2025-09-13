// Social Authentication Utilities
// Facebook and Instagram login implementations

import { SOCIAL_AUTH_CONFIG } from '../config/socialAuth';

// Facebook App Configuration
const FACEBOOK_APP_ID = SOCIAL_AUTH_CONFIG.FACEBOOK_APP_ID;
const INSTAGRAM_CLIENT_ID = SOCIAL_AUTH_CONFIG.INSTAGRAM_CLIENT_ID;

// Load Facebook SDK
export const loadFacebookSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve(window.FB);
    };
    
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
    document.body.appendChild(script);
  });
};

// Facebook Login
export const loginWithFacebook = async () => {
  try {
    const FB = await loadFacebookSDK();
    
    return new Promise((resolve, reject) => {
      FB.login((response) => {
        if (response.authResponse) {
          // Get user info
          FB.api('/me', { fields: 'id,name,email,picture' }, (userInfo) => {
            if (userInfo && !userInfo.error) {
              resolve({
                accessToken: response.authResponse.accessToken,
                userID: response.authResponse.userID,
                userInfo: {
                  id: userInfo.id,
                  name: userInfo.name,
                  email: userInfo.email,
                  picture: userInfo.picture?.data?.url
                }
              });
            } else {
              reject(new Error('Failed to get user info from Facebook'));
            }
          });
        } else {
          reject(new Error('Facebook login was cancelled or failed'));
        }
      }, { scope: 'email,public_profile' });
    });
  } catch (error) {
    throw new Error(`Facebook login error: ${error.message}`);
  }
};

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

// Social Authentication Configuration
// Replace these with your actual app credentials

export const SOCIAL_AUTH_CONFIG = {
  // Instagram App Configuration
  INSTAGRAM_CLIENT_ID: process.env.REACT_APP_INSTAGRAM_CLIENT_ID || 'YOUR_INSTAGRAM_CLIENT_ID',
  INSTAGRAM_CLIENT_SECRET: process.env.REACT_APP_INSTAGRAM_CLIENT_SECRET || 'YOUR_INSTAGRAM_CLIENT_SECRET',
  
  // Google Configuration (if needed)
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
};

// Instructions for setting up social login:
export const SETUP_INSTRUCTIONS = {
  INSTAGRAM: {
    steps: [
      '1. Go to https://developers.facebook.com/',
      '2. Create a new app or use existing one',
      '3. Add Instagram Basic Display product',
      '4. Get your App ID and App Secret',
      '5. Add your domain to Valid OAuth Redirect URIs',
      '6. Set REACT_APP_INSTAGRAM_CLIENT_ID and REACT_APP_INSTAGRAM_CLIENT_SECRET in your .env file'
    ]
  }
};

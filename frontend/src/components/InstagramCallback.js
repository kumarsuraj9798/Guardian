import React, { useEffect } from 'react';
import { handleInstagramCallback } from '../utils/socialAuth';

const InstagramCallback = () => {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (error) {
          throw new Error(`Instagram auth error: ${error}`);
        }
        
        if (!code) {
          throw new Error('No authorization code received');
        }
        
        // Handle the callback
        const result = await handleInstagramCallback(code);
        
        // Send result back to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'INSTAGRAM_AUTH_SUCCESS',
            data: result
          }, window.location.origin);
        }
        
      } catch (error) {
        console.error('Instagram callback error:', error);
        
        // Send error back to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'INSTAGRAM_AUTH_ERROR',
            error: error.message
          }, window.location.origin);
        }
      }
    };
    
    handleCallback();
  }, []);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Processing Instagram Login...</h2>
        <p>Please wait while we complete your authentication.</p>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #E4405F',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default InstagramCallback;

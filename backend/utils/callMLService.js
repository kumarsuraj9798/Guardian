const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";
const ML_SERVICE_TIMEOUT = 15000; // 15 seconds

// Cache for ML service health status
let mlServiceHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

/**
 * Check if ML service is healthy
 */
async function checkMLServiceHealth() {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return mlServiceHealthy;
  }
  
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    mlServiceHealthy = response.status === 200 && response.data?.status === 'healthy';
    lastHealthCheck = now;
    console.log(`ML service health check: ${mlServiceHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
  } catch (error) {
    mlServiceHealthy = false;
    lastHealthCheck = now;
    console.log('ML service health check: FAILED', error.message);
  }
  
  return mlServiceHealthy;
}

/**
 * Fallback classification based on keywords in description
 */
function fallbackClassification(description) {
  if (!description) return "Ambulance";
  
  const text = description.toLowerCase();
  
  // Fire-related keywords
  if (text.includes('fire') || text.includes('smoke') || text.includes('burning') || 
      text.includes('flame') || text.includes('blaze') || text.includes('explosion')) {
    return "Firebrigade";
  }
  
  // Police-related keywords
  if (text.includes('robbery') || text.includes('theft') || text.includes('crime') || 
      text.includes('violence') || text.includes('assault') || text.includes('weapon') ||
      text.includes('fight') || text.includes('shooting')) {
    return "Police";
  }
  
  // Hospital-related keywords (severe)
  if (text.includes('heart attack') || text.includes('stroke') || text.includes('overdose') ||
      text.includes('unconscious') || text.includes('critical')) {
    return "Hospital";
  }
  
  // Default to Ambulance for medical/accident cases
  return "Ambulance";
}

/**
 * Classify incident using ML service with robust error handling
 */
async function classifyIncident(data) {
  try {
    // Check ML service health first
    const isHealthy = await checkMLServiceHealth();
    
    if (!isHealthy) {
      console.log("ML service is unhealthy, using fallback classification");
      const service = fallbackClassification(data.description);
      return { service };
    }
    
    // Format data for ML service
    const mlData = {
      text: data.description || null,
      image: null,
      video: null,
      audio: null
    };
    
    // Extract media by type
    if (data.media && Array.isArray(data.media)) {
      for (const mediaItem of data.media) {
        if (mediaItem.type === 'image' && mediaItem.content) {
          mlData.image = mediaItem.content;
        } else if (mediaItem.type === 'video' && mediaItem.content) {
          mlData.video = mediaItem.content;
        } else if ((mediaItem.type === 'audio' || mediaItem.type === 'voice') && mediaItem.content) {
          mlData.audio = mediaItem.content;
        }
      }
    }
    
    console.log("Sending to ML service:", {
      url: `${ML_SERVICE_URL}/classify`,
      hasText: !!mlData.text,
      textLength: mlData.text ? mlData.text.length : 0,
      hasImage: !!mlData.image,
      hasVideo: !!mlData.video,
      hasAudio: !!mlData.audio
    });
    
    const response = await axios.post(`${ML_SERVICE_URL}/classify`, mlData, {
      timeout: ML_SERVICE_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("ML service response:", response.data);
    
    // Validate response
    if (response.data && response.data.service) {
      const validServices = ['Ambulance', 'Hospital', 'Police', 'Firebrigade'];
      if (validServices.includes(response.data.service)) {
        return response.data;
      }
    }
    
    // Invalid response, use fallback
    console.log("Invalid ML service response, using fallback");
    const service = fallbackClassification(data.description);
    return { service };
    
  } catch (error) {
    console.error("ML service error:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Mark service as unhealthy if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      mlServiceHealthy = false;
      lastHealthCheck = Date.now();
    }
    
    // Always provide fallback classification
    const service = fallbackClassification(data.description);
    console.log(`Using fallback classification: ${service}`);
    return { service };
  }
}

// Export both functions for testing
module.exports = {
  classifyIncident,
  checkMLServiceHealth,
  fallbackClassification
};

// For backward compatibility
module.exports.default = classifyIncident;

const axios=require("axios");

async function classifyIncident(data){
  try {
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
      hasText: !!mlData.text, 
      hasImage: !!mlData.image, 
      hasVideo: !!mlData.video, 
      hasAudio: !!mlData.audio 
    });
    
    const res = await axios.post("http://localhost:8000/classify", mlData, { timeout: 10000 });
    console.log("ML service response:", res.data);
    return res.data || { service: "Ambulance" };
  } catch (e) {
    console.error("ML service error:", e.message);
    return { service: "Ambulance" };
  }
}

module.exports = classifyIncident;
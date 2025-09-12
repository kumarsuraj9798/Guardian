const axios=require("axios");
async function classifyIncident(data){
  try {
    const res=await axios.post("http://localhost:8000/classify",data, { timeout: 3000 });
    return res.data || { service: "Ambulance" };
  } catch (e) {
    return { service: "Ambulance" };
  }
}
module.exports=classifyIncident;
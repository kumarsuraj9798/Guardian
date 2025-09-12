const axios=require("axios");
async function classifyIncident(data){
  const res=await axios.post("http://localhost:8000/classify",data);
  return res.data;
}
module.exports=classifyIncident;
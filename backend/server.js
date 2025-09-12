const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => res.send("GuardianNet Backend Running"));
app.listen(5000, () => console.log("Backend running on port 5000"));
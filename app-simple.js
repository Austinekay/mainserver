require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: "ShopPilot Backend API - Simple Version",
    status: "running",
    timestamp: new Date().toISOString(),
    env: {
      CLIENT_URL: process.env.CLIENT_URL,
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    }
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
});
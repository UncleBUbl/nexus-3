const express = require('express');
const cors = require('cors');
require('dotenv').config();

const deepThinkRoutes = require('./routes/deepThink');
const orchestrateRoutes = require('./routes/orchestrate');
const vibeRoutes = require('./routes/vibe');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads

// Routes
app.use('/api/think', deepThinkRoutes);
app.use('/api/orchestrate', orchestrateRoutes);
app.use('/api/vibe', vibeRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('Nexus 3 Backend Operational');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`
  ▲ NEXUS 3 SERVER ONLINE
  ► Listening on port ${PORT}
  ► Frontend URL: ${process.env.FRONTEND_URL}
  `);
});

module.exports = { app, server };
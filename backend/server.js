const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const balanceRoutes = require('./routes/balance');
const eventsRoutes = require('./routes/events');
const healthRoutes = require('./routes/health');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/balance', balanceRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/health', healthRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Bazuu-Save API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(3000, () => {
  console.log(`Server running on port ${PORT}`);
});
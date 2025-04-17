const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB database');
});

// Define Event Schema
const EventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Deposited', 'Withdrawn'],
    required: true
  },
  user: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  }
});

const Event = mongoose.model('Event', EventSchema);

module.exports = {
  Event,
  saveEvent: async (eventData) => {
    try {
      const event = new Event(eventData);
      await event.save();
      return event;
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  },
  getEventsByUser: async (user) => {
    try {
      return await Event.find({ user }).sort({ timestamp: -1 });
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }
};
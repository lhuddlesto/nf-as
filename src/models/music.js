const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  trackTitle: {
    type: String,
    required: true,
    unique: true,
  },
  genre: {
    type: String,
    required: true,
  },
  mood: {
    type: Array,
    required: true,
  },
  isPublic: {
    type: String,
    default: false,
  },
  price: {
    type: Number,
    default: 20,
    validate(value) {
      if (value < 0) {
        throw new Error('Price must be greater than 0');
      }
    },
  },
  bpm: {
    type: Number,
    required: true,
    validate(value) {
      if (value < 0) {
        throw new Error('BPM must be greater than 0');
      }
    },
  },
  trackUrl: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

musicSchema.index({
  trackTitle: 'text',
  genre: 'text',
  mood: 'text',
}, {
  weights: {
    trackTitle: 10,
    mood: 7,
    genre: 4,
  },
});

const Music = mongoose.model('Music', musicSchema);

module.exports = Music;

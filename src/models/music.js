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
  similarArtists: {
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
  similarArtists: 'text',
}, {
  weights: {
    trackTitle: 10,
    similarArtists: 8,
    mood: 7,
    genre: 6,
  },
});

const Music = mongoose.model('Music', musicSchema);

module.exports = Music;

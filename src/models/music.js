const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  trackTitle: {
    type: String,
    required: true,
  },
  presentationTitle: {
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
  duration: {
    type: Number,
    default: 0,
  },
  similarArtists: {
    type: Array,
    required: true,
  },
  isPublic: {
    type: String,
    default: false,
  },
  likeCount: {
    type: Number,
    default: 0,
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
  trackoutUrl: {
    type: String,
  },
  imageUrl: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

musicSchema.index({
  presentationTitle: 'text',
  genre: 'text',
  similarArtists: 'text',
  mood: 'text',
}, {
  weights: {
    presentationTitle: 10,
    similarArtists: 9,
    mood: 7,
    genre: 6,
  },
});

const Music = mongoose.model('Music', musicSchema);

module.exports = Music;

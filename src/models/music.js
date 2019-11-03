const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  trackTitle: {
    type: String,
    required: true,
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
}, {
  timestamps: true,
});

const Music = mongoose.model('Music', musicSchema);

module.exports = Music;

const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  local: {
    email: String,
    password: String,
  },
  facebook: {
    id: String,
    token: String,
    name: String,
    email: String,
  },
  twitter: {
    id: String,
    token: String,
    displayName: String,
    username: String,
  },
  google: {
    id: String,
    token: String,
    email: String,
    name: String,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  purchases: {
    type: Array,
  },
  likedTracks: {
    type: Array,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;

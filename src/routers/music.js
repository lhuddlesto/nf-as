const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const Music = require('../models/music');
const { uploadTrack, uploadCover } = require('../s3/s3_put');
const deleteTrack = require('../s3/s3_delete');

const storage = multer.diskStorage({
  destination: './tmp/tracks',
  filename: (req, file, cb) => {
    cb(null, file.originalname.replace(/ /g, '_').toLowerCase());
  },
});

const upload = multer({ storage });

const router = new express.Router();

// Grab all tracks
router.get('/music', async (req, res) => {
  const music = await Music.find({});
  res.send(music);
});

// Search for a track, returns one result
router.get('/music/search', async (req, res) => {
  if (!req.query) {
    res.status(404).send({
      error: 'Track not found.',
    });
  }
  try {
    const searchTerm = req.query.term;
    const matchingTracks = await Music.find({
      $text: {
        $search: searchTerm,
        $caseSensitive: false,
        $diacriticSensitive: false,
      },
    });
    console.log(matchingTracks);
    res.status(201).send(matchingTracks);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Upload a single master track with cover art
router.post('/music/upload', upload.fields([{ name: 'track', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const { genre, isPublic } = req.body;
  const trackTitle = req.body.trackTitle.replace(/ /g, '_').toLowerCase();
  const mood = req.body.mood.split(',');
  const price = Number(req.body.price) - 0.01;
  const bpm = Number(req.body.bpm);

  try {
    // eslint-disable-next-line dot-notation
    const imageUrl = await uploadCover(req.files['cover'][0].path, trackTitle);
    // eslint-disable-next-line dot-notation
    const trackUrl = await uploadTrack(req.files['track'][0].path, trackTitle);
    const music = new Music({
      trackTitle,
      genre,
      isPublic,
      mood,
      price,
      bpm,
      trackUrl,
      imageUrl,
    });
    await music.save();
    await res.status(201).send({
      status: 'success',
      message: 'Your track was uploaded successfully.',
    });
    console.log('success');
  } catch (e) {
    console.log(e);
    res.send({
      status: 'error',
      message: 'Sorry, we were unable to upload your track.',
      error: e,
    });
  }
});

// Update a track
router.patch('/music/', async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['mood', 'isPublic', 'price', 'trackTitle', 'genre', 'bpm'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates' });
  }

  try {
    const track = await Music.findOne({ trackTitle: req.query.trackTitle });

    if (!track) {
      return res.status(404).send();
    }

    updates.forEach((update) => {
      track[update] = req.body[update];
    });

    await track.save();

    return res.send(track);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Delete a track
router.delete('/music/', async (req, res) => {
  try {
    const track = await Music.findOneAndDelete({ trackTitle: req.query.trackTitle });

    if (!track) {
      return res.status(404).send();
    }
    await deleteTrack(req.query.trackTitle);
    return res.send(track);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;

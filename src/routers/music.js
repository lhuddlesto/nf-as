const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const Music = require('../models/music');
const { uploadTrack, uploadCover } = require('../s3/s3_put');

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
  console.log(req.query.track);
  try {
    const trackTitle = req.query.track;
    const matchingTracks = await Music.find({
      $text: {
        $search: trackTitle,
        $caseSensitive: false,
        $diacriticSensitive: false,
      },
    });

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

module.exports = router;

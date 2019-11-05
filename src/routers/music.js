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

// Grab tracks
router.get('/music', async (req, res) => {
  const music = await Music.find({});
  res.send(music);
});

// Upload a single master track with cover art
router.post('/music/upload', upload.fields([{ name: 'track', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const { trackTitle, genre, isPublic } = req.body;
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

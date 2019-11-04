const express = require('express');
const multer = require('multer');
const Music = require('../models/music');
const { uploadFile } = require('../s3/s3_put');

const storage = multer.diskStorage({
  destination: './tmp/tracks',
  filename: (req, file, cb) => {
    cb(null, file.originalname.replace(/ /g, '_').toLowerCase());
  },
});

const upload = multer({ storage });

const router = new express.Router();

router.post('/music/upload', upload.single('track'), async (req, res) => {
  const { trackTitle, genre, isPublic } = req.body;
  const mood = req.body.mood.split(',');
  const price = Number(req.body.price) - 0.01;
  const bpm = Number(req.body.bpm);

  try {
    const trackUrl = await uploadFile(req.file.path, trackTitle);
    const music = new Music({
      trackTitle,
      genre,
      isPublic,
      mood,
      price,
      bpm,
      trackUrl,
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

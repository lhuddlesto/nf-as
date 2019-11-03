const express = require('express');
const multer = require('multer');
const Music = require('../models/music');

const { getMasterUrl } = require('../s3/s3_get');
const { uploadFile } = require('../s3/s3_put');


const storage = multer.diskStorage({
  destination: './tmp/tracks',
  filename: (req, file, cb) => {
    cb(null, file.originalname.replace(/ /g, '_').toLowerCase());
  },
});
const upload = multer({ storage });

const router = new express.Router();

router.get('/music/track/:id', (req, res) => {
  let { id } = req.params;
  id = id.replace(/\s/g, '_').toLowerCase();
  const url = getMasterUrl(id);
  return res.send({
    url,
    id,
  });
});

router.post('/music/upload', upload.single('track'), async (req, res) => {
  const { trackTitle, genre, isPublic } = req.body;
  const mood = req.body.mood.split(',');

  const music = new Music({
    trackTitle,
    genre,
    isPublic,
    mood,
  });

  try {
    await music.save();
    await res.status(201).send({
      status: 'success',
      message: 'Track uploaded successfully',
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

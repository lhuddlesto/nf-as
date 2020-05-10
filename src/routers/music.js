const fs = require('fs');
const express = require('express');
const multer = require('multer');
const Music = require('../models/music');
const { uploadCover } = require('../s3/s3_post');
const managedUpload = require('../s3/managed_upload/managedUpload');
const deleteTrack = require('../s3/s3_delete');

const storage = multer.diskStorage({
  destination: './tmp/tracks',
  filename: (req, file, cb) => {
    cb(null, file.originalname.replace(/ /g, '_').toLowerCase());
  },
});

const upload = multer({ storage });

const router = new express.Router();

// Returns all tracks
router.get('/api/music', (req, res) => {
  console.log(req.query);
  Music.find({}).limit(Number(req.query.limit) || 10).sort({ createdAt: -1 }).skip(Number(req.query.skip || 0))
    .exec((err, data) => {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }
      return res.status(200).send(data);
    });
});

// Returns amount of documents for pagination
router.get('/api/music/count', async (req, res) => {
  try {
    const count = await Music.estimatedDocumentCount({});
    return res.send({
      count,
    });
  } catch (e) {
    console.log(e.message);
    return res.send(e.message);
  }
});
// Returns all unique "Mood" values
router.get('/api/music/mood', async (req, res) => {
  await Music.find().distinct('mood', (err, moods) => {
    if (err) {
      return res.status(404).send({
        status: 'failure',
        message: 'No values found for key "mood"',
        error: err,
      });
    }
    return res.status(201).send(moods);
  });
});

// Returns all unique "Genre" values
router.get('/api/music/genre', async (req, res) => {
  await Music.find().distinct('genre', (err, genres) => {
    if (err) {
      return res.status(404).send({
        status: 'failure',
        message: 'No values found for key "genre"',
        error: err,
      });
    }
    return res.status(201).send(genres);
  });
});


// Search for a track, returns matching results
router.get('/api/music/search', async (req, res) => {
  let { skip } = req.query;
  let count;
  let query;
  if (!req.query.skip) {
    skip = 0;
  }
  let matchingTracks;
  if (!req.query) {
    res.status(404).send({
      error: 'Track not found.',
    });
  }

  if (req.query.track) {
    try {
      matchingTracks = await Music.findOne({trackTitle: req.query.track});
      console.log(matchingTracks);
      return res.status(200).send(matchingTracks);
    } catch (e) {
      return res.status(500).send(e);
    }
  }

  if (req.query.term) {
    try {
      const searchTerm = req.query.term;
      matchingTracks = await Music.find({
        $text: {
          $search: searchTerm,
          $caseSensitive: false,
          $diacriticSensitive: false,
        },
      }).limit(10).sort({ createdAt: -1 }).skip(Number(skip))
        .exec((err, result) => {
          if (err) {
            return res.status(500).send(err);
          }
          return res.status(200).send(result);
        });
    } catch (e) {
      res.status(500).send(e);
    }
  }

  let genre;
  genre = req.query.genre;
  if (req.query.genre === 'all') {
    genre = {};
  }
  const priceLow = parseInt(req.query.price[0], 10);
  const priceHigh = parseInt(req.query.price[1], 10);

  const bpmLow = Number(req.query.bpm[0]);
  const bpmHigh = Number(req.query.bpm[1]);

  try {
    if (req.query.mood && !req.query.genre) {
      query = Music.find({
        mood: { $all: req.query.mood },
        price: { $gte: priceLow, $lte: priceHigh },
        bpm: { $gte: bpmLow, $lte: bpmHigh },
      });
      matchingTracks = await query.limit(10).sort({ createdAt: -1 }).skip(Number(skip)).exec();
    } else if (!req.query.mood && req.query.genre) {
      query = Music.find({
        genre: { $all: genre },
        price: { $gte: priceLow, $lte: priceHigh },
        bpm: { $gte: bpmLow, $lte: bpmHigh },
      });
      matchingTracks = await query.limit(10).sort({ createdAt: -1 }).skip(Number(skip)).exec();
    } else if (req.query.mood && req.query.genre) {
      query = Music.find({
        mood: { $all: req.query.mood },
        genre: { $all: genre },
        price: { $gte: priceLow, $lte: priceHigh },
        bpm: { $gte: bpmLow, $lte: bpmHigh },
      });
      matchingTracks = await query.limit(10).sort({ createdAt: -1 }).skip(Number(skip)).exec();
    } else {
      matchingTracks = await Music.find({
        price: { $gte: priceLow, $lte: priceHigh },
        bpm: { $gte: bpmLow, $lte: bpmHigh },
      });
      matchingTracks = await query.limit(10).sort({ createdAt: -1 }).skip(Number(skip)).exec();
    }
    count = await query.countDocuments({}).exec();
    console.log(count);
    res.send([matchingTracks, count]);
  } catch (e) {
    console.log(e);
  }
});

// Uploads master track, zip of trackouts, and cover art to S3 and links to database.
// Metadata goes into database.
router.post('/api/music/upload', upload.fields([{ name: 'track', maxCount: 1 }, { name: 'cover', maxCount: 1 }, { name: 'trackout', maxCount: 1 }]), async (req, res) => {
  console.log('Upload started');
  const { genre, isPublic } = req.body;
  const presentationTitle = req.body.trackTitle;
  const trackTitle = req.body.trackTitle.replace(/ /g, '_').toLowerCase();
  const mood = req.body.mood.split(',');
  const similarArtists = req.body.similarArtists.split(',');
  const price = Number(req.body.price) - 0.01;
  const bpm = Number(req.body.bpm);
  let trackoutUrl = '';
  let trackUrl;

  try {
    if (req.files.trackout) {
      trackoutUrl = await managedUpload(req.files.trackout[0].path, trackTitle, 'trackout', 'application/zip', 'zip');
    }
    trackUrl = await managedUpload(req.files.track[0].path, trackTitle, 'master', 'audio/wav', 'wav');
    const imageUrl = await uploadCover(req.files.cover[0].path, trackTitle);
    const music = new Music({
      trackTitle,
      presentationTitle,
      genre,
      isPublic,
      mood,
      similarArtists,
      price,
      bpm,
      trackUrl,
      imageUrl,
      trackoutUrl,
    });
    await music.save();
    console.log('success');
    if (req.files.trackout) {
      fs.unlinkSync(req.files.trackout[0].path);
    }
    fs.unlinkSync(req.files.track[0].path);
    fs.unlinkSync(req.files.cover[0].path);
    return res.status(201).send({
      status: 'success',
      message: 'Your track was uploaded successfully.',
      trackData: music,
    });
  } catch (e) {
    console.log(e);
    return res.send({
      status: 'error',
      message: 'Sorry, we were unable to upload your track.',
      error: e,
      trackData: null,
    });
  }
});

// Update a track
router.patch('/api/music', async (req, res) => {
  const updates = Object.keys(req.body);
  console.log(req.query.trackTitle);
  const allowedUpdates = ['mood', 'isPublic', 'price', 'trackTitle', 'presentationTitle', 'genre', 'bpm', 'similarArtists', 'duration'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates' });
  }

  try {
    const track = await Music.findOne({ trackTitle: decodeURIComponent(req.query.trackTitle) });

    if (!track) {
      console.log('not found');
      return res.status(404).send({
        status: 'error',
        message: 'Sorry, we were unable to update your track.',
        error: '',
      });
    }

    updates.forEach((update) => {
      console.log(update);
      if (update === 'trackTitle') {
        track[update] = req.body[update].replace(/ /g, '_').toLowerCase();
        track.presentationTitle = req.body[update];
        return;
      }
      track[update] = req.body[update];
    });

    await track.save();

    return res.send(
      {
        status: 'success',
        message: 'Your track has been updated.',
        track,
      },
    );
  } catch (e) {
    return res.status(400).send({
      status: 'error',
      message: 'Sorry, we were unable to upload your track',
      error: e,
    });
  }
});

// Delete a track
router.delete('/api/music', async (req, res) => {
  try {
    const track = await Music.findOneAndDelete({ trackTitle: req.query.trackTitle });

    if (!track) {
      return res.status(404).send();
    }
    await deleteTrack(req.query.trackTitle);
    return res.send(track);
  } catch (e) {
    return res.status(400).send(e);
  }
});

module.exports = router;

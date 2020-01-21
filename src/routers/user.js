const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Music = require('../models/music');

const validateRegisterInput = require('../utils/validation/register');
const validateLoginInput = require('../utils/validation/login');

const router = new express.Router();

const checkToken = (req, res, next) => {
  const header = req.headers.authorization;

  if (typeof header !== 'undefined') {
    const bearer = header.split(' ');
    const token = bearer[1];

    req.token = token;
    next();
  } else {
    res.sendStatus(403);
  }
};


router.post('/user/signup/local', async (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body.user.local);

  const { email, password, name } = req.body.user.local;

  if (!email) {
    return res.status(401).send('401 Unauthorized');
  }
  if (!isValid) {
    console.log(errors);
    return res.status(400).send(errors);
  }
  const doesUserExist = await User.findOne({ 'local.email': email });

  if (doesUserExist) {
    return res.status(400).send({
      email: 'Email already exists',
    });
  }

  const encryptedPassword = await bcrypt.hash(password, 8);

  const newUser = new User({
    local: {
      name,
      email,
      password: encryptedPassword,
    },
  });

  try {
    await newUser.save();
    console.log('New user created');
    return res.status(200).send(newUser);
  } catch (e) {
    console.log(e);
    return res.send(e);
  }
});

router.post('/user/login/local', async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body.user.local);
  if (!isValid) {
    console.log(400, errors);
    return res.status(400).send(errors);
  }

  const { email, password } = req.body.user.local;

  const user = await User.findOne({ 'local.email': email });
  if (!user) {
    console.log(400, 'Email not found');
    return res.status(404).send({ email: 'Email not found' });
  }
  console.log(password, user.local.password);

  const isMatch = await bcrypt.compare(password, user.local.password);
  if (isMatch) {
    const payload = {
      id: user.id,
      email: user.local.email,
    };
    jwt.sign(payload, process.env.SECRET_OR_KEY, { expiresIn: 31556926 }, (err, token) => {
      res.send({
        success: true,
        token: `Bearer ${token}`,
      });
    });
  } else {
    console.log(400, 'Password incorrect');
    return res.status(400).send({ passwordIncorrect: 'Password incorrect' });
  }
});

router.get('/user', checkToken, async (req, res) => {
  try {
    const { id } = req.query;
    const user = await User.findById(id);
    const { name, email } = user.local;
    const { purchases, likedTracks } = user;
    return res.status(200).send({
      name,
      email,
      purchases,
      likedTracks,
    });
  } catch (e) {
    console.log(e);
    return res.staus(400).send(e);
  }
});

// Lets user like a track.  The id of the track is added to "likes" array.
// Must be an authenticated user to like a track.
router.patch('/user/music/like', checkToken, async (req, res) => {
  try {
    const { id, trackId } = req.query;
    const user = await User.findById(id);
    const track = await Music.findById(trackId);

    if (!track) {
      return res.status(404).send('Track not found');
    }

    if (!user) {
      return res.status(404).send('User id not provided');
    }

    const { presentationTitle } = track;

    if (user.likedTracks.includes(trackId) && track.likedBy.includes(id)) {
      res.status(500).send({
        status: 'Failure',
        message: `You've already liked ${presentationTitle}.`,
      });
    }
    user.likedTracks.push(trackId);
    track.likedBy.push(id);
    await user.save();
    await track.save();
    return res.status(200).send({
      status: 'Success',
      message: `${presentationTitle} has been added to your likes.`,
    });
  } catch (e) {
    console.log(e.message);
    return res.status(500).send(e.message);
  }
});

// Removes a track that a user has liked. The tracks id is removed from the likedTracks array.
// Must be an authenticated user to remove a liked track.
router.delete('/user/music/like', checkToken, async (req, res) => {
  try {
    const { id, trackId } = req.query;
    const user = await User.findById(id);
    const track = await Music.findById(trackId);

    if (!track) {
      return res.status(404).send('Track not found');
    }

    if (!user) {
      return res.status(404).send('User id not provided');
    }

    const { presentationTitle } = track;

    if (!user.likedTracks.includes(trackId) && !track.likedBy.includes(id)) {
      return res.status(500).send({
        status: 'Failure',
        message: `${presentationTitle} is not a track you've liked`,
      });
    }
    const userResult = await User.findByIdAndUpdate(
      id,
      {
        $pull: {
          likedTracks: trackId,
        },
      },
    );
    const trackResult = await Music.findByIdAndUpdate(
      trackId,
      {
        $pull: {
          likedBy: id,
        },
      },
    );

    if (userResult && trackResult) {
      return res.status(200).send(`${presentationTitle} has been removed from your likes.`);
    }
    throw new Error('something went wrong');
  } catch (e) {
    console.log(e);
    return res.status(500).send(e.message);
  }
});

module.exports = router;

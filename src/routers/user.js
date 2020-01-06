const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const validateRegisterInput = require('../utils/validation/register');
const validateLoginInput = require('../utils/validation/login');

const router = new express.Router();

router.post('/user/signup/local', async (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body.user.local);

  let email;
  let password;
  if (req.body.user.local) {
    email = req.body.user.local.email;
    password = req.body.user.local.password;
  }
  if (!email) {
    return res.status(401).send('401 Unauthorized');
  }
  if (!isValid) {
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
      email,
      password: encryptedPassword,
    },
  });

  try {
    await newUser.save();
    console.log('New user created');
    res.status(200).send(newUser);
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

router.post('/user/login/local', async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body.user.local);
  if (!isValid) {
    return res.status(400).send(errors);
  }

  const { email, password } = req.body.user.local;

  const user = await User.findOne({ 'local.email': email });
  if (!user) {
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
    return res.status(400).send({ passwordIncorrect: 'Password incorrect' });
  }
});

router.post('/user/logout', () => {

});

module.exports = router;

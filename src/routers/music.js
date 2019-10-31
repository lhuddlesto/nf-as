const express = require('express');
const multer = require('multer');

const { getMasterUrl } = require('../utils/s3/s3_get');
const { uploadFile } = require('../utils/s3/s3_put');


const storage = multer.diskStorage({
  destination: './tmp/tracks',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
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
  try {
    console.log(req.body, req.file);
    res.send({
      status: 'success',
      message: 'Track uploaded successfully',
    });
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

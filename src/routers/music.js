const express = require('express');
const { getMasterUrl } = require('../utils/s3/s3_get');
const { uploadFile } = require('../utils/s3/s3_put');

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

router.post('/music/upload', async (req, res) => {
  try {
    const message = await uploadFile();
    res.send({
      hi: 'hi',
      message,
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;

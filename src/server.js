const express = require('express');
const { getMasterUrl } = require('./utils/s3/s3_get');
const { uploadFile } = require('./utils/s3/s3_put');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/track/:id', (req, res) => {
  let { id } = req.params;
  id = id.replace(/\s/g, '_').toLowerCase();
  const url = getMasterUrl(id);
  return res.send({
    url,
    id,
  });
});

app.post('/upload', async (req, res) => {
  const message = await uploadFile();
  res.send({
    hi: 'hi',
    message,
  });
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});

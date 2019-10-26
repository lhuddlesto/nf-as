const express = require('express');
const { getMasterUrl } = require('./aws_example');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/track/:id', async (req, res) => {
  const { id } = req.params;
  const track = await getMasterUrl(id);
  res.send({
    track,
    id,
  });
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});

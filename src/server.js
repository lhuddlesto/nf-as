const express = require('express');
const musicRouter = require('./routers/music');

const app = express();

app.use(musicRouter);

app.listen(5000, () => {
  console.log('Listening on port 5000');
});

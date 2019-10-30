const express = require('express');
const cors = require('cors');
const musicRouter = require('./routers/music');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000/'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(cors());
app.use(express.json());
app.use(musicRouter);

app.listen(5000, () => {
  console.log('Listening on port 5000');
});

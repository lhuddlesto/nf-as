const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/nf-as-test', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
}, (err) => {
  if (err) {
    console.log('Unable to connect to database!');
  }
});

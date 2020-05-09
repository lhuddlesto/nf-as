const mongoose = require('mongoose');

mongoose.connect(`mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@nf-test-cluster-bdml4.mongodb.net/test?retryWrites=true&w=majority
`, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
}, (err) => {
  if (err) {
    console.log(err);
    console.log('Unable to connect to database!');
  }
});

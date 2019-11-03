const fs = require('fs');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const uploadFile = async (path, track) => {
  const file = fs.readFileSync(path);
  const params = {
    Bucket: 'nf.music.test',
    Key: `${track}/master/${track}.wav`,
    Body: file,
    ContentType: 'audio/wav',
  };

  s3.upload(params, (err, data) => {
    if (err) throw err;
    console.log(`File uploaded successfuly at ${data.Location}`);
  });
};

module.exports = {
  uploadFile,
};

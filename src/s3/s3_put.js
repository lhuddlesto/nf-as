const fs = require('fs');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const uploadFile = (path, trackTitle) => {
  let trackUrl;
  const file = fs.readFileSync(path);
  const params = {
    Bucket: 'nf.music.test',
    Key: `${trackTitle}/master/${trackTitle}.wav`,
    Body: file,
    ContentType: 'audio/wav',
  };

  const s3Upload = s3.upload(params).promise();

  return s3Upload
    .then((data) => {
      console.log(data.Location);
      trackUrl = data.Location;
      fs.unlinkSync(path);
      return trackUrl;
    }).catch((e) => {
      throw e;
    });
};

module.exports = {
  uploadFile,
};

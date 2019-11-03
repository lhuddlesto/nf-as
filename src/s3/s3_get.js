const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const getMasterUrl = (track) => {
  const params = {
    Bucket: 'nf.music.test',
    Key: `${track}/master/${track}.wav`,
  };
  return s3.getSignedUrl('getObject', params);
};

module.exports = {
  getMasterUrl,
};

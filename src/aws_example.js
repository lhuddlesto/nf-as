const AWS = require('aws-sdk');

const getMasterUrl = (track) => {
  const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  const params = {
    Bucket: 'nf.music',
    Key: `${track}/Master/${track}.wav`,
  };

  return s3.getSignedUrl('getObject', params);
};

module.exports = {
  getMasterUrl,
};

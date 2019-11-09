const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const deleteTrack = async (trackTitle) => {
  const params = {
    Bucket: 'nf.music.test',
    Delete: {
      Objects: [
        {
          Key: `${trackTitle}/master/${trackTitle}.wav`,
        },
        {
          Key: `${trackTitle}/cover/cover_${trackTitle}.jpg`,
        },
      ],
    },
  };

  const s3Delete = s3.deleteObjects(params).promise();

  return s3Delete.then((data) => console.log(data)).catch((e) => {
    console.log(e);
    throw e;
  });
};

module.exports = deleteTrack;

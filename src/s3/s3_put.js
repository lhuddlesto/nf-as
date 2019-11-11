const fs = require('fs');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const uploadTrack = (path, trackTitle) => {
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
      trackUrl = data.Location;
      fs.unlinkSync(path);
      return `http://d3g8t2jk5ak9zp.cloudfront.net/${data.Key}`;
    })
    .catch((e) => {
      throw e;
    });
};

const uploadCover = (path, trackTitle) => {
  const file = fs.readFileSync(path);
  const params = {
    Bucket: 'nf.music.test',
    Key: `${trackTitle}/cover/cover_${trackTitle}.jpg`,
    Body: file,
    ContentType: 'image/jpeg',
  };
  const s3Upload = s3.upload(params).promise();

  return s3Upload
    .then((data) => {
      fs.unlinkSync(path);
      return `http://d3g8t2jk5ak9zp.cloudfront.net/${data.Key}`;
    })
    .catch((e) => {
      throw e;
    });
};

const uploadTrackout = (path, trackTitle) => {
  const params = {
    Bucket: 'nf.music.test',
    Key: `${trackTitle}/trackouts/trackouts_${trackTitle}.zip`,
    Body: fs.readFileSync(path),
    ContentType: 'application/zip',
  };

  const s3Upload = s3.upload(params).promise();

  return s3Upload
    .then((data) => {
      fs.unlinkSync(path);
      return data.Location;
    })
    .catch((e) => {
      throw e;
    });
};

const multiPartUpload = (filePath) => {
  const partSize = 1024 * 1024 * 5;
  const fileBuffer = fs.readFileSync(filePath);
};

module.exports = {
  uploadTrack,
  uploadTrackout,
  uploadCover,
};

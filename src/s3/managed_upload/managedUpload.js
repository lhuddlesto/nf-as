const AWS = require('aws-sdk');
const fs = require('fs');

const managedUpload = async (filePath, trackTitle, folder, ContentType, extension) => {
  const file = fs.readFileSync(filePath);
  const params = {
    Bucket: 'nf-music-test',
    Key: `${trackTitle}/${folder}/${trackTitle}-${folder}.${extension}`,
    Body: file,
    ContentType,
  };

  const s3 = new AWS.S3.ManagedUpload({
    apiVersion: '2006-03-01',
    useAccelerateEndpoint: true,
    params,
  });

  const s3Upload = s3.on('httpUploadProgress', (progress) => {
    console.log(progress);
  }).promise();

  try {
    const data = await s3Upload;
    console.log(`${trackTitle} ${folder} upload complete.`)
    return `http://d3g8t2jk5ak9zp.cloudfront.net/${data.Key}`;
  } catch (e) {
    return e;
  }
};

module.exports = managedUpload;

/* eslint-disable no-plusplus */
/* eslint-disable no-useless-catch */
const fs = require('fs');
const async = require('async');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

// const uploadTrack = async (path, trackTitle) => {
//   const file = fs.readFileSync(path);
//   const params = {
//     Bucket: 'nf-music-test',
//     Key: `${trackTitle}/master/${trackTitle}.wav`,
//     Body: file,
//     ContentType: 'audio/wav',
//   };

//   const s3Upload = s3.upload(params).promise();

//   // eslint-disable-next-line no-useless-catch
//   try {
//     const data = await s3Upload;
//     console.log(`${trackTitle} master track uploaded.`);
//     return `http://d3g8t2jk5ak9zp.cloudfront.net/${data.Key}`;
//   } catch (e) {
//     throw e;
//   }
// };

const uploadCover = async (path, trackTitle) => {
  const file = fs.readFileSync(path);
  const params = {
    Bucket: 'nf-music-test',
    Key: `${trackTitle}/cover/cover_${trackTitle}.jpg`,
    Body: file,
    ContentType: 'image/jpeg',
  };
  const s3Upload = s3.upload(params).promise();

  try {
    const data = await s3Upload;
    console.log(`${trackTitle} cover art uploaded.`);
    return `http://d3g8t2jk5ak9zp.cloudfront.net/${data.Key}`;
  } catch (e) {
    throw e;
  }
};

// const uploadTrackout = async (path, trackTitle) => {
//   const params = {
//     Bucket: 'nf-music-test',
//     Key: `${trackTitle}/trackouts/trackouts_${trackTitle}.zip`,
//     Body: fs.readFileSync(path),
//     ContentType: 'application/zip',
//   };

//   const s3Upload = s3.upload(params).promise();

//   try {
//     const data = await s3Upload();
//     return data.Location;
//   } catch (e) {
//     throw e;
//   }
// };

function uploadMultipart(filePath, trackTitle, fileType, extension, uploadCb) {
  const bucketName = 'nf-music-test';

  s3.createMultipartUpload({ Bucket: bucketName, Key: `${trackTitle}/${fileType}/${fileType}_${trackTitle}.${extension}` }, (mpErr, multipart) => {
    if (!mpErr) {
      // console.log("multipart created", multipart.UploadId);
      fs.readFile(filePath, (err, fileData) => {
        const partSize = 1024 * 1024 * 5;
        const parts = Math.ceil(fileData.length / partSize);

        async.times(parts, (partNum, next) => {
          const rangeStart = partNum * partSize;
          const end = Math.min(rangeStart + partSize, fileData.length);

          console.log('uploading ', trackTitle, ' % ', (partNum / parts).toFixed(2));

          partNum++;
          async.retry((retryCb) => {
            s3.uploadPart({
              Body: fileData.slice(rangeStart, end),
              Bucket: bucketName,
              Key: `${trackTitle}/${fileType}/${fileType}_${trackTitle}.${extension}`,
              PartNumber: partNum,
              UploadId: multipart.UploadId,
            }, (err, mData) => {
              retryCb(err, mData);
            });
          }, (err, data) => {
            // console.log(data);
            next(err, { ETag: data.ETag, PartNumber: partNum });
          });
        }, (err, dataPacks) => {
          s3.completeMultipartUpload({
            Bucket: bucketName,
            Key: `${trackTitle}/${fileType}/${fileType}_${trackTitle}.${extension}`,
            MultipartUpload: {
              Parts: dataPacks,
            },
            UploadId: multipart.UploadId,
          }, uploadCb);
        });
      });
    } else {
      uploadCb(mpErr);
    }
  });
}

function uploadFile(filePath, trackTitle, fileType, extension, uploadCb) {
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats.size;
  const bucketName = 'nf-music-test';

  if (fileSizeInBytes < (1024 * 1024 * 5)) {
    async.retry((retryCb) => {
      fs.readFile(filePath, (err, fileData) => {
        s3.putObject({
          Bucket: bucketName,
          Key: `${trackTitle}/${fileType}/${fileType}_${trackTitle}.${extension}`,
          Body: fileData,
        }, retryCb);
      });
    }, uploadCb);
  } else {
    return uploadMultipart(filePath, trackTitle, fileType, extension, uploadCb);
  }
}

module.exports = {
  uploadCover,
  uploadFile,
};

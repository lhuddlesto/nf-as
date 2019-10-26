const fs = require('fs');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const uploadFile = async (path, track) => {
  const file = fs.readFileSync(path);
  //   if (err) throw err;
  const params = {
    Bucket: 'nf.music',
    Key: `${track}/master/${track}.wav`,
    Body: file,
    ContentType: 'audio/wav',
  };

  s3.upload(params, (err, data) => {
    if (err) throw err;
    console.log(`File uploaded successfuly at ${data.Location}`);
  });
};

uploadFile('/Users/lhuddleston/Music/Projects/Space_Age/Boss_Fight_1.wav', 'boss_fight_1');

module.exports = {
  uploadFile,
};

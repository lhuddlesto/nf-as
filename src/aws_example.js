const AWS = require('aws-sdk');

const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const params = {
    Bucket: 'nf.music'
}

s3.getBucketVersioning(params, (err, data) => {
    if (err) {
        return console.log(err.stack)
    }
    console.log(data);
});
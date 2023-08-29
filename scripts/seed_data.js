const AWS = require('aws-sdk');
const data = require('../data_to_seed.json');
AWS.config.update({ region: 'us-west-2' });
const dynamoDB = new AWS.DynamoDB({ apiVersion: '2012-08-10' });


function* chunks(arr, n) {
  for (let i = 0; i < arr.length; i += n) yield arr.slice(i, i + n);
}

function batchWriteItem(params) {
  return Promise.resolve(dynamoDB.batchWriteItem(params).promise())
}

(async () => {
  console.time('HowFastWasThat');
  for (let k in data) {
    if (data[k].length < 25) {
      console.log(await batchWriteItem({ RequestItems: { [k]: data[k] } }));
    } else {
      for (let chunk of [...chunks(data[k], 25)]) {
        console.log({ RequestItems: { [k]: chunk } })
        console.log(await batchWriteItem({ RequestItems: { [k]: chunk } }));
      }
    }
  }
  console.timeEnd('HowFastWasThat');
})();
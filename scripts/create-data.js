const fs = require('fs')
const path = require('path')

const tableName = 'dev-archimedes-table'
const outputFilename = './scripts/output/data_to_seed.json'

function createMiniQuizzExercisesData(finalData) {
  const tableData = JSON.parse(fs.readFileSync(`./scripts/output/mini-quiz-activities.json`));
  for (let data of tableData) {
    topic_upper = data['TOPIC'].toUpperCase().replaceAll(' ', '_')
    subtopic_upper = data['SUBTOPIC'].toUpperCase().replaceAll(' ', '_')

    item = {
      'pk': { 'S': `TOPIC#${topic_upper}#SUBTOPIC#${subtopic_upper}` },
      'sk': { 'S': `ACTIVITY#${data['ACTIVITY ID']}` },
      'type': { 'S': 'ACTIVITY' },
      'code': { 'S': data['ACTIVITY ID'] },
      'name': { 'S': data['ACTIVITY DESCRIPTION'] },
      'path': { 'S': `miniquiz/${data['ACTIVITY ID']}.html` },
      'classification': { 'S': 'miniquiz' },
      'gsi1pk': { 'S': `ACTIVITY#${data['ACTIVITY ID']}` },
      'gsi1sk': { 'S': `TOPIC#${topic_upper}` },
      'gsi2pk': { 'S': `TOPIC#${topic_upper}` },
      'gsi2sk': { 'S': `ACTIVITY#${data['ACTIVITY ID']}` }
    }

    request = { PutRequest: { Item: item } };

    finalData[tableName].push(request);
  }
}


function createTopics(finalData) {
  const tableData = JSON.parse(fs.readFileSync(`./scripts/output/topics.json`));

  seen = new Set()
  for (let data of tableData) {
    if (seen.has(data['TOPIC']))
      continue;

    topic_upper = data['TOPIC'].toUpperCase().replaceAll(' ', '_')
    subtopic_upper = data['SUBTOPIC'].toUpperCase().replaceAll(' ', '_')

    item = {
      'pk': { 'S': 'TOPIC' },
      'sk': { 'S': `TOPIC#${topic_upper}` },
      'type': { 'S': 'TOPIC' },
      'id': { 'S': topic_upper },
      'topicName': { 'S': data['TOPIC'] }
    }

    request = { PutRequest: { Item: item } };

    finalData[tableName].push(request);
    seen.add(data['TOPIC'])
  }
}


function createSubtopics(finalData) {
  const tableData = JSON.parse(fs.readFileSync(`./scripts/output/topics.json`));
  for (let data of tableData) {
    topic_upper = data['TOPIC'].toUpperCase().replaceAll(' ', '_')
    subtopic_upper = data['SUBTOPIC'].toUpperCase().replaceAll(' ', '_')

    item = {
      'pk': { 'S': `TOPIC#${topic_upper}` },
      'sk': { 'S': `SUBTOPIC#${subtopic_upper}` },
      'type': { 'S': 'SUBTOPIC' },
      'id': { 'S': subtopic_upper },
      'topicName': { 'S': data['SUBTOPIC'] }
    }

    request = { PutRequest: { Item: item } };

    finalData[tableName].push(request);
  }
}

finalData = {};
finalData[tableName] = []

createMiniQuizzExercisesData(finalData);
createTopics(finalData);
createSubtopics(finalData);

console.log(finalData);
dataJson = JSON.stringify(finalData, undefined, 2)

fs.writeFile(outputFilename, dataJson, 'utf8', (err) => {
  if (err) throw err;
  console.log(`Data saved to ${outputFilename}`);
});
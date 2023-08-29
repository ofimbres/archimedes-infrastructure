const fs = require('fs')
const path = require('path')

const tableName = 'ArchimedesData3'
const outputFilename = 'data_to_seed.json'

function createMiniQuizzExercisesData(finalData) {
  const tableData = require(`../mini-quizz-exercises.json`);
  for (let data of tableData) {
    topic_upper = data['TOPIC'].toUpperCase().replaceAll(' ', '_')
    subtopic_upper = data['SUBTOPIC'].toUpperCase().replaceAll(' ', '_')

    item = {
      'pk': { 'S': `TOPIC#${topic_upper}#SUBTOPIC#${subtopic_upper}` },
      'sk': { 'S': `EXERCISE#${data['EXERCISE ID']}` },
      'type': { 'S': 'EXERCISE' },
      'code': { 'S': data['EXERCISE ID'] },
      'name': { 'S': data['EXERCISE DESCRIPTION'] },
      'path': { 'S': `mini-quiz/${data['EXERCISE ID']}.html` },
      'classification': { 'S': 'miniquiz' },
      'gsipk': { 'S': `EXERCISE#${data['EXERCISE ID']}` },
      'gsisk': { 'S': `TOPIC#${topic_upper}` },
      'gsipk2': { 'S': `TOPIC#${topic_upper}` },
      'gsisk2': { 'S': `EXERCISE#${data['EXERCISE ID']}` }
    }

    request = { PutRequest: { Item: item } };

    finalData[tableName].push(request);
  }
}


function createTopics(finalData) {
  const tableData = require(`../topics.json`);

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
  const tableData = require(`../topics.json`);
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
const fs = require('fs')
const path = require('path')

const tableName = 'dev-archimedes-table'
const outputFilename = './scripts/output/dynamodb-data-to-seed.json'

function createSchools(finalData) {
  const tableData = JSON.parse(fs.readFileSync(`./scripts/output/schools.json`));
  for (let data of tableData) {
    // Create a school code from the school name
    const schoolCode = data['USER_School_Name']
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_'); // Replace spaces with underscores

    // Combine address components
    const address = `${data['USER_School_Street_Address']}, ${data['USER_School_City']}, ${data['USER_School_State']}, ${data['USER_School_Zip']}`;

      item = {
        'pk': { 'S': `SCHOOL#${data['USER_School_Number']}` },
        'sk': { 'S': '#METADATA' },
        'entityType': { 'S': 'SCHOOL' },
        'schoolId': { 'S': data['USER_School_Number'] },
        'schoolCode': { 'S': schoolCode },
        'name': { 'S': data['USER_School_Name'] },
        'address': { 'S': address },
        'principalName': { 'S': data['USER_School_Principal'] || '' },
        'contactEmail': { 'S': data['USER_School_Email_Address'] || '' },
        'phoneNumber': { 'S': data['USER_School_Phone'] || '' },
        'gsi1pk': { 'S': 'SCHOOL' },
        'gsi1sk': { 'S': `SCHOOL#${data['USER_School_Number']}` },
        'gsi2pk': { 'S': 'SCHOOL_CODE' },
        'gsi2sk': { 'S': schoolCode }
      }

    request = { PutRequest: { Item: item } };

    finalData[tableName].push(request);
  }
}

function createMiniQuizzExercisesData(finalData) {
  const tableData = JSON.parse(fs.readFileSync(`./scripts/output/miniquiz-activities.json`));
  for (let data of tableData) {
    topic_upper = data['TOPIC'].toUpperCase().replaceAll(' ', '_')
    subtopic_upper = data['SUBTOPIC'].toUpperCase().replaceAll(' ', '_')

    item = {
      'pk': { 'S': `EXERCISE#${data['ACTIVITY_ID']}` },
      'sk': { 'S': '#METADATA' },
      'entityType': { 'S': 'EXERCISE' },
      'exerciseId': { 'S': data['ACTIVITY_ID'] },
      'topicId': { 'S': topic_upper },
      'subtopicId': { 'S': subtopic_upper },
      'name': { 'S': data['ACTIVITY_DESCRIPTION'] },
      'exerciseType': { 'S': 'Miniquiz' },
      'path': { 'S': `${data['ACTIVITY_ID']}.htm` },
      'difficulty': { 'S': 'BEGINNER' },
      'gsi1pk': { 'S': `TOPIC#${topic_upper}#SUBTOPIC#${subtopic_upper}` },
      'gsi1sk': { 'S': `EXERCISE#${data['ACTIVITY_ID']}` },
      'gsi2pk': { 'S': 'EXERCISE_TYPE' },
      'gsi2sk': { 'S': `Miniquiz#${data['ACTIVITY_ID']}` }
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

    item = {
      'pk': { 'S': `TOPIC#${topic_upper}` },
      'sk': { 'S': '#METADATA' },
      'entityType': { 'S': 'TOPIC' },
      'topicId': { 'S': topic_upper },
      'name': { 'S': data['TOPIC'] },
      'parentTopicId': { 'NULL': true },
      'path': { 'S': data['TOPIC'] },
      'level': { 'N': '1' },
      'gsi1pk': { 'S': 'TOPIC' },
      'gsi1sk': { 'S': `TOPIC#${topic_upper}` },
      'gsi2pk': { 'S': 'ROOT_TOPIC' },
      'gsi2sk': { 'S': `TOPIC#${topic_upper}` }
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
      'pk': { 'S': `TOPIC#${topic_upper}#SUBTOPIC#${subtopic_upper}` },
      'sk': { 'S': '#METADATA' },
      'entityType': { 'S': 'SUBTOPIC' },
      'topicId': { 'S': topic_upper },
      'subtopicId': { 'S': subtopic_upper },
      'name': { 'S': data['SUBTOPIC'] },
      'parentTopicId': { 'S': topic_upper },
      'path': { 'S': `${data['TOPIC']} > ${data['SUBTOPIC']}` },
      'level': { 'N': '2' },
      'gsi1pk': { 'S': `TOPIC#${topic_upper}` },
      'gsi1sk': { 'S': `SUBTOPIC#${subtopic_upper}` }
    }

    request = { PutRequest: { Item: item } };

    finalData[tableName].push(request);
  }
}

finalData = {};
finalData[tableName] = []

createSchools(finalData);
createMiniQuizzExercisesData(finalData);
createTopics(finalData);
createSubtopics(finalData);

console.log(finalData);
dataJson = JSON.stringify(finalData, undefined, 2)

fs.writeFile(outputFilename, dataJson, 'utf8', (err) => {
  if (err) throw err;
  console.log(`Data saved to ${outputFilename}`);
});
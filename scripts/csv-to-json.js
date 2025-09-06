const csv = require("csvtojson")
const fs = require('fs')
const path = require('path')

// Get command line arguments
const inputFile = process.argv[2] || './scripts/data/filtered-schools.csv'
const outputFile = process.argv[3] || './scripts/output/schools.json'

topics_filename = './data/topics.csv'
mini_quizz_exercises_filename = './data/miniquiz-activities.csv'

function csvToJson(filename, outputFilename) {
    csv()
        .fromFile(filename)
        .then(function(jsonArrayObj) { //when parse finished, result will be emitted here.
            
            data = JSON.stringify(jsonArrayObj, undefined, 2);
            fs.writeFile(outputFilename, data, 'utf8', (err) => {
                if (err) throw err;
                console.log(`Data saved to ${outputFilename}`);
            });
        });
}

csvToJson(inputFile, outputFile)
csvToJson(topics_filename, './scripts/output/topics.json')
csvToJson(mini_quizz_exercises_filename, './scripts/output/miniquiz-activities.json')

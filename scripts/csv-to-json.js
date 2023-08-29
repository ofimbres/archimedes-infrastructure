const csv = require("csvtojson")
const fs = require('fs')
const path = require('path')

topics_filename = './assets/data/topics.csv'
mini_quizz_exercises_filename = './assets/data/mini-quizz-exercises.csv'

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

csvToJson(topics_filename, './topics.json')
csvToJson(mini_quizz_exercises_filename, './mini-quizz-exercises.json')

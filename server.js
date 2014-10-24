var express = require('express');
var bodyParser = require('body-parser');
var questions = require('./routes/questions');
var app = express();
var cors = require('cors');

app.use(cors());

// Set which 
var corsOptions = {
  origin: 'http://localhost:9000'
};

app.use( bodyParser.json() );	      					// to support JSON-encoded bodies
app.use( bodyParser.urlencoded( {extended:false}) );	// to support URL-encoded bodies

app.get('/questions', cors(corsOptions), questions.findAll); //retrieve all questions
app.get('/questions/nextTenQuestions/:requestNumber', cors(corsOptions), questions.nextTenQuestions); //retrieve all questions
app.get('/questions/:id', cors(corsOptions), questions.findById); //retrieve questions with id
app.post('/questions', cors(corsOptions), questions.addQuestion); //add a question
app.put('/questions/:id', cors(corsOptions), questions.updateQuestion); //update a question
app.put('/questions/upvote/:id', cors(corsOptions), questions.upVote); //update a question
app.put('/questions/dnvote/:id', cors(corsOptions), questions.dnVote); //update a question
app.delete('/questions/:id', cors(corsOptions), questions.deleteQuestion); //delete a question

app.listen(3000);

console.log('running on 3000...');
var express = require('express');
var bodyParser = require('body-parser');
var questions = require('./routes/questions');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var cors = require('cors');

app.set('views', './views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


var CAS = require('cas');
var cas = new CAS({base_url: 'https://my.monash.edu.au/authentication/cas', service: 'my_service'});



exports.cas_login = function(req, res) {
  var ticket = req.param('ticket');
  if (ticket) {
    cas.validate(ticket, function(err, status, username) {
      if (err) {
        // Handle the error
        res.send({error: err});
      } else {
        // Log the user in
        res.send({status: status, username: username});
      }
    });
  } else {
    res.redirect('/');
  }
};





io.on('connection', function (socket) {

  // Add users to discussion rooms
  socket.on('enter discussion', function (data) {
    socket.join(data.question_id);
    console.log(data.username + ' joined question: ' + data.question_id);

    // Wait for new messages then boadcast to room
    socket.on('new message', function (data) {
      // data.date = new Date();
      console.log(data);
      // we tell the client to execute 'new message'
      socket.broadcast.to(data.question_id).emit('new message', data.);
    });
  });

  // Remove users from discussion rooms
  socket.on('leave discussion', function (data) {
    socket.leave(data.question_id);
    console.log(data.username + ' left question: ' + data.question_id)
  });

});




// allow corss origin requests from the following servers
app.use(cors());
var corsOptions = {
  // origin: 'http://localhost:9000',
  // origin: 'http://0.0.0.0:9000'
};

app.use( bodyParser.json() );	      					// to support JSON-encoded bodies
app.use( bodyParser.urlencoded( {extended:false}) );	// to support URL-encoded bodies

// log in
// app.get('/', function(req, res){
// 	res.redirect('https://my.monash.edu.au/authentication/cas/login?service=http://google.com');
// });
app.get('/questions', cors(corsOptions), questions.findAll); //retrieve all questions
app.get('/questions/nextTenQuestions/:requestNumber', cors(corsOptions), questions.nextTenQuestions); //retrieve all questions
app.get('/questions/:id', cors(corsOptions), questions.findById); //retrieve questions with id
app.post('/questions', cors(corsOptions), questions.addQuestion	); //add a question
app.put('/questions/:id', cors(corsOptions), questions.updateQuestion); //update a question
app.put('/questions/upvote/:id', cors(corsOptions), questions.upVote); //update a question
app.put('/questions/dnvote/:id', cors(corsOptions), questions.dnVote); //update a question
app.delete('/questions/:id', cors(corsOptions), questions.deleteQuestion); //delete a question


server.listen(3000, function(){
	var host = server.address().address
	var port = server.address().port
   	console.log('Discussions API listening at http://%s:%s', host, port)	
});
// var appserver = app.listen(3000, function(){
// var host = appserver.address().address
// var port = appserver.address().port

//   console.log('Discussions API listening at http://%s:%s', host, port)	
// });
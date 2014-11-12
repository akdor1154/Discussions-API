var express = require('express');
var bodyParser = require('body-parser');
var questions = require('./routes/questions');
var comments = require('./routes/comments');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var cors = require('cors');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;


var CAS = require('cas');
var cas = new CAS({base_url: 'https://my.monash.edu.au/authentication/cas', service: 'http://melts-dev.eng.monash.edu:7999/nrshe1/'});

app.set('views', './views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');







passport.use('provider', new OAuth2Strategy({
    authorizationURL: 'https://www.google.com/oauth2/authorize',
    tokenURL: 'https://www.google.com/oauth2/token',
    clientID: '123-456-789',
    clientSecret: 'shh5-its-a-secret',
    callbackURL: 'https://localhost:3000/auth/provider/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken, refreshToken, profile, done)
    // User.findOrCreate(..., function(err, user) {
    //   done(err, user);
    // });
  }
));






io.on('connection', function (socket) {
  console.log('new connection');

  // Add users to discussion rooms
  socket.on('enter discussion', function (data) {

    // Check if user already joined
    if (socket.rooms.indexOf(data.question_id) === -1) {
      socket.join(data.question_id);
      // console.log(socket.rooms);
    }
  });

  // Wait for new messages then boadcast to room
  socket.on('message sent', function (data) {

    // we tell the client to execute 'new message'
    socket.broadcast.to(data.question_id).emit('new message', data);
  });


  // Remove users from discussion rooms
  socket.on('leave discussion', function (data) {
    socket.leave(data.question_id);
    console.log(data.username + ' left question: ' + data.question_id)
  });

});




// allow cross origin requests from the following servers
app.use(cors());
var corsOptions = {
	origin: 'http://localhost:9000'
};

app.use( bodyParser.json() );	      					// to support JSON-encoded bodies
app.use( bodyParser.urlencoded( {extended:false}) );	// to support URL-encoded bodies





// log in
app.get('/', function(req, res) {
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
     res.redirect('https://my.monash.edu.au/authentication/cas/login?service=http://melts-dev.eng.monash.edu:7999/nrshe1/');
   }
});





// Redirect the user to the OAuth 2.0 provider for authentication.  When
// complete, the provider will redirect the user back to the application at
//     /auth/provider/callback
app.get('/auth/provider', passport.authenticate('provider'));

// The OAuth 2.0 provider has redirected the user back to the application.
// Finish the authentication process by attempting to obtain an access
// token.  If authorization was granted, the user will be logged in.
// Otherwise, authentication has failed.
app.get('/auth/provider/callback', 
  passport.authenticate('provider', { successRedirect: '/questions',
                                      failureRedirect: '/' }));

app.get('/questions', cors(corsOptions), questions.findAll); //retrieve all questions
app.get('/questions/nextTenQuestions/:requestNumber', cors(corsOptions), questions.nextTenQuestions); //retrieve all questions
app.get('/questions/:id', cors(corsOptions), questions.findById); //retrieve questions with id
app.post('/questions', cors(corsOptions), questions.addQuestion	); //add a question
app.put('/questions/:id', cors(corsOptions), questions.updateQuestion); //update a question
app.put('/questions/upvote/:id', cors(corsOptions), questions.upVote); //upvote uestion
app.put('/questions/dnvote/:id', cors(corsOptions), questions.dnVote); //downvote a question
app.delete('/questions/:id', cors(corsOptions), questions.deleteQuestion); //delete a question

app.get('/comments/:id', cors(corsOptions), comments.findAll); //retrieve all comments
app.post('/comments/:id', cors(corsOptions), comments.addComment); //add a comments
app.delete('/comments/:commentId', cors(corsOptions), comments.deleteComment); //delete a question

server.listen(8002, function(){
	var host = server.address().address
	var port = server.address().port
   	console.log('Discussions API listening at http://%s:%s', host, port)	
});

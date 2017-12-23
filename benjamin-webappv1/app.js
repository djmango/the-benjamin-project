var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const fs = require('fs');

var index = require('./routes/index');
var users = require('./routes/users');
var about = require('./routes/about');
// var login = require('./routes/login');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/about', about);
// app.use('/login', login);
const keys = JSON.parse(fs.readFileSync('./keys/keys.json')); //read all keys

var express = require('express'),
  session = require('express-session'),
  passport = require('passport'),
  Strategy = require('passport-discord').Strategy,
  router = express();

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

var scopes = ['identify', 'email', 'guilds', 'guilds.join'];

passport.use(new Strategy({
  clientID: keys.discordid,
  clientSecret: keys.discordtoken,
  callbackURL: 'http://localhost:3000/callback',
  scope: scopes
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile);
  });
}));

app.use(session({
  secret: keys.discordtoken,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.get('/login', passport.authenticate('discord', {
  scope: scopes
}), function (req, res) {});

app.get('/info', checkAuth, function (req, res) {
  console.log(req.user)
  res.json(req.user);
});

app.get('/callback', //TODO: figured out the console.log, investigate and pull key data, then make authentication request using passport
  function (req, res) {console.log(req)},
  passport.authenticate('discord', {
    failureRedirect: '/'
  }),
  function (req, res) {
    res.redirect('/about')
  } // auth success
);
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});
app.get('/about2', checkAuth, function (req, res) {
  res.json(req.user);
});

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.send('not logged in :(');
}


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
app.listen(3000, () => {
  console.log('App started, listening on port 3000')
})
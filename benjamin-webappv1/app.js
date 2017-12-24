var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const fs = require('fs');
const fetch = require('node-fetch');
const btoa = require('btoa');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const DiscordStrategy = require('passport-discord').Strategy;

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


passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

var scopes = ['identify', 'email', 'guilds', 'guilds.join'];
var callbackURL = 'http://localhost:3000/callback'

passport.use(new DiscordStrategy({
  authorizationURL: 'https://discordapp.com/api/oauth2/authorize',
  tokenURL: 'https://discordapp.com/api/oauth2/token',
  clientID: keys.discordid,
  clientSecret: keys.discordtoken,
  callbackURL: callbackURL,
  scope: scopes
}, function (accessToken, refreshToken, profile, cb) {
  User.findOrCreate({
    exampleId: profile.id
  }, function (err, user) {
    return cb(err, user);
  });
}));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

//error handling
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.get('/login', passport.authenticate('discord', {
  scope: scopes
}), function (req, res) {});

app.get('/info', checkAuth, function (req, res) {
  console.log(req.user)
  res.json(req.user);
});
/*
app.get('/callback',
  async function (req, res, err) {
    if (!req.query.code) throw new Error('NoCodeProvided');
    passport.authorize('discord', {
        scope: scopes,
        successRedirect: '/info',
        failureRedirect: '/',
        failureFlash: true
      })
  });
*/
/*
app.get('/callback', async function (req, res) {
  if (!req.query.code) throw new Error('NoCodeProvided');
  const code = req.query.code;
  const creds = btoa(`${keys.discordid}:${keys.discordtoken}`);
  console.log(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&client_id=${keys.discordid}&client_secret=${keys.discordtoken}&redirect_uri=${callbackURL}`)
  const response = await fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&client_id=${keys.discordid}&client_secret=${keys.discordtoken}&redirect_uri=${callbackURL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${code}`,
    },
  });
  const json = await response.json();
  console.log(json)
  res.redirect(`/?token=${code}`);
});
*/

app.get('/callback', async function (req, res) {
  if (!req.query.code) throw new Error('NoCodeProvided');
  const code = req.query.code;
  const creds = btoa(`${keys.discordid}:${keys.discordtoken}`);
  let API_ENDPOINT = "https://discordapp.com/api/v6"
  var data = {
    "client_id": keys.discordid,
    "client_secret": keys.discordtoken,
    "grant_type": "authorization_code",
    "code": code,
    "redirect_url": callbackURL
  }
  var headers = [
    ["Content-Type", "application/x-www-form-urlencoded"]
  ]
  const response = await fetch(`${API_ENDPOINT}/oauth2/token?grant_type=authorization_code&&code=${code}`, {
    method: 'POST',
    headers: ["Content-Type", "application/x-www-form-urlencoded"]
  });
  const json = await response.json();
  console.log(json)
  res.redirect(`/?token=${code}`);
});

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
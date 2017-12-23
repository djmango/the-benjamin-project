const express = require('express');
const fs = require('fs')
const passport = require('passport')
const OAuth2Strategy = require('passport-oauth2')

const router = express.Router();
const keys = JSON.parse(fs.readFileSync('./keys/keys.json')); //read all keys

const CLIENT_ID = keys.discordid;
const CLIENT_SECRET = keys.discordtoken;
const redirect = encodeURIComponent('http://localhost:50451/api/discord/callback');

passport.use(new OAuth2Strategy({
    authorizationURL: 'https://www.example.com/oauth2/authorize', //TODO: change url
    tokenURL: 'https://www.example.com/oauth2/token',
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: redirect
  },
  function (accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      exampleId: profile.id
    }, function (err, user) {
      return cb(err, user);
    });
  }
));

module.exports = router;
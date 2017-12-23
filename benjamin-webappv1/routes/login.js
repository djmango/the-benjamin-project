// const express = require('express');
// const router = express.Router();
const path = __dirname + '/views/';
const fs = require('fs')

/* GET home page. */
/*
router.get('/', function (req, res, next) {
    res.sendFile('/views/contact.html', { root: './' });
});
*/

// const passport = require('passport');

//https://discordapp.com/oauth2/authorize?response_type=code&redirect_uri=http://localhost:3000/about&scope=identify&client_id=393872294004391936

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

router.use(session({
    secret: keys.discordtoken,
    resave: false,
    saveUninitialized: false
}));
router.use(passport.initialize());
router.use(passport.session());
router.get('/', passport.authenticate('discord', {
    scope: scopes
}), function (req, res) {});

module.exports = router;
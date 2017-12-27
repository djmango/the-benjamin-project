const path = __dirname + '/views/';
const fs = require('fs')
const express = require('express'),
    session = require('express-session'),
    passport = require('passport'),
    Strategy = require('passport-discord').Strategy,
    router = express();

const keys = JSON.parse(fs.readFileSync('./keys/keys.json')); //read all keys


module.exports = router;
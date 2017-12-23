var express = require('express');
var router = express.Router();
var path = __dirname + '/views/';

/* GET home page. */
router.get('/', function (req, res, next) {
    res.sendFile('/views/contact.html', { root: './' });
});

module.exports = router;
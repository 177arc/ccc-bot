var express = require('express');
var router = express.Router();
const config = require('../config');

/* GET users listing. */
router.get('/', function(req, res, next) {

    res.writeHead(302, {
        'Location': config.url+'/'+decodeURI(req.param('dest'))
    });
    res.end();
});

module.exports = router;

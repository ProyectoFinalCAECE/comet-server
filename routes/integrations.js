"use strict";

/**

* Module dependencies

*/


var jwt = require('express-jwt');
var models  = require('../models');
var express = require('express');
var router  = express.Router();


// saves the unencrypted token in the 'payload' field of request
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

module.exports = router;

"use strict";

/**

* Module dependencies

*/


var jwt = require('express-jwt');
var express = require('express');
var router  = express.Router();
var integrationsService  = require('../services/integrationsService');

// saves the unencrypted token in the 'payload' field of request
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

/*
* Get available Integrations.
* Requires authentication header.
*
*/
router.get('/', auth, function(req, res) {
  integrationsService.getIntegrations(function(result){
    return res.status(result.code).json(result.message);
  });
});

module.exports = router;

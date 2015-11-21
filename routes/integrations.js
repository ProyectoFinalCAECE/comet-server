"use strict";

/**

* Module dependencies

*/


var jwt = require('express-jwt');
var models  = require('../models');
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
  //If these parameters are detected, somebody is requesting for active integrations
  //or a certain project.
  if(req.primaryParams && req.primaryParams.project_id){
    models.User.findById(req.payload._id).then(function(user) {
      if(!user){
        return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
      }
      //look for active integrations of a certain project
      integrationsService.getActiveIntegrationsForProject(req.primaryParams.project_id, user, function(result){
        return res.status(result.code).json(result.message);
      });

    });

  } else {
    //If no parameters are detected, somebody is requesting for all the
    //available integrations at the system.
    integrationsService.getIntegrations(function(result){
      return res.status(result.code).json(result.message);
    });
  }
});

module.exports = router;

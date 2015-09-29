"use strict";

/**

 * Module dependencies

 */


var jwt = require('express-jwt');
var models  = require('../models');
var express = require('express');
var router  = express.Router();
var channelService  = require('../services/channelService');
var channelValidator  = require('../services/validators/channelValidator');


// saves the unencrypted token in the 'payload' field of request
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

/*
* Create new Channel.
* Requires authentication header.
*
* @name
* @description
* @type
*
*/
router.post('/', auth, channelValidator.validCreate, function(req, res) {
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }
    channelService.createChannel(user, req, res);
  });
});


/*
* Get project's information.
* Requires authentication header.
*
*/
router.get('/', function(req, res) {
  // look for current user's account
  /*models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    projectService.getProject(req, res, user);
  });*/


  //console.log('req is primaryParams: ' + JSON.stringify(req.primaryParams));

  return res.json({
                    id: 'the id',
                    name: 'the channel name',
                    description: 'the channel desc',
                    createdAt: 'the channel createdAt'
                });
});
module.exports = router;

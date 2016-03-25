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

var callService  = require('../services/callService');
var callValidator  = require('../services/validators/callValidator');


/**
 * Endpoint to retrieve the Calls of a certain Channel
 * @param  {} '/'
 * @param  {} auth
 * @param  {Function} callValidator.validRetrieveCalls
 * @return {Function} callback
 */
router.get('/', auth, callValidator.validRetrieveCalls, function(req, res){
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }
    callService.retrieveCalls(req.primaryParams.project_id, req.primaryParams.channel_id, user, function(result){
      return res.status(result.code).json(result.message);
    });
  });
});
/**
 * Endpoint to store a new call.
 * @param  {} '/'
 * @param  {} auth
 * @param  {Function} callValidator.validNewCall
 * @param  {Function} callback
 */
router.post('/', auth, callValidator.validNewCall, function(req, res){
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }
    callService.createNewCall(req.primaryParams.project_id, req.primaryParams.channel_id, user, req.body, function(result){
      return res.status(result.code).json(result.message);
    });
  });
});

/**
 * Endpoint to update a preexistent call.
 * @param  {} '/:id'
 * @param  {} auth
 * @param  {Function} callValidator.validUpdateCall
 * @param  {Function} callback
 */
router.put('/:id', auth, callValidator.validUpdateCall, function(req, res){
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }
    callService.updateCall(req.primaryParams.project_id, req.primaryParams.channel_id, user, req.params.id, req.body, function(result){
      return res.status(result.code).json(result.message);
    });
  });
});
module.exports = router;

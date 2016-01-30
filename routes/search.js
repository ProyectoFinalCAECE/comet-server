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

var searchService  = require('../services/searchService');
var searchValidator  = require('../services/validators/searchValidator');

/**
 * Endpoint to search for messages containing provided text in a project.
 * @param  {} '/messages'
 * @param  {} auth
 * @param  {Function} searchValidator.validSearchMessageInProject
 * @param  {Function} callback
 */
router.get('/messages', auth, searchValidator.validSearchMessageInProject, function(req, res) {
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }
    searchService.searchMessage(req.primaryParams.project_id, req.query.q, user,
      req.query.limit, req.query.last_id, function(result){
      return res.status(result.code).json(result.message);
    });
  });
});

/**
 * Endpoint to search for messages containing provided text in a channel.
 * @param  {} '/messages'
 * @param  {} auth
 * @param  {Function} searchValidator.validSearchMessageInChannel
 * @param  {Function} callback
 */
router.get('/messages/channels/:channel_id', auth, searchValidator.validSearchMessageInChannel, function(req, res) {
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }
    searchService.searchMessage(req.primaryParams.project_id, req.query.q, user,
      req.query.limit, req.query.last_id, function(result){
      return res.status(result.code).json(result.message);
    }, req.primaryParams.channel_id);
  });
});

/**
 * Endpoint to search for Users in a project.
 * @param  {} '/users'
 * @param  {} auth
 * @param  {Function} searchValidator.validSearchUserInProject
 * @param  {Function} callback
 */
router.get('/users', auth, searchValidator.validSearchUserInProject, function(req, res){
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }
    searchService.searchUserInProject(req.primaryParams.project_id, req.query.q, user, function(result){
      return res.status(result.code).json(result.message);
    });
  });
});

module.exports = router;

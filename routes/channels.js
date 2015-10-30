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
* @project_id
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
* Get channel's information.
* Requires authentication header.
* @project_id
* @id
*
*/
router.get('/:id', auth, channelValidator.validGet, function(req, res) {
    // look for current user's account
    models.User.findById(parseInt(req.payload._id)).then(function(user) {
      if (!user) {
        return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
      }
      channelService.getChannel(req, res, user);
    });
});

/*
* Get all Project's Channels information ordered by createdAt date showing the last created first.
* Requires authentication header.
* @project_id
*
*/
router.get('/', auth, channelValidator.validGetByChannel, function(req, res) {
  // look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    channelService.getChannels(req, res, user);
  });
});

/*
*Allows Project's User to add other Project's Users to a Project's Channel.
* @project_id
* @id
* @members
*
*/
router.put('/:id/members', auth, channelValidator.validAddMembers, function(req, res){
  // look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    channelService.addMembersBulk(req.body.members, req.primaryParams.project_id, req.params.id, user, function(result){
      return res.status(result.code).json(result.message);
    });
  });
});

/*
* Delete a Channel of a Project.
* Requires authentication header.
* @project_id
* @id
*
*/
router.delete('/:id', auth, channelValidator.validDelete, function(req, res) {
  // look for user account
  models.User.findById(req.payload._id).then(function(user) {
    if (!user) {
      return res.status(404).json({ message: 'No se encontro usuario asociado al token provisto.'});
    }
    channelService.deleteChannel(req.primaryParams.project_id, req.params.id, user, function(result){
      return res.status(result.code).json(result.message);
    });
  });
});

/*
* Close a Project's Channel.
* Requires authentication header.
* @project_id
* @id
*
*/
router.delete('/:id/close', auth, channelValidator.validClose, function(req, res) {
  // look for user account
  models.User.findById(req.payload._id).then(function(user) {
    if (!user) {
      return res.status(404).json({ message: 'No se encontro usuario asociado al token provisto.'});
    }
    channelService.closeChannel(req.primaryParams.project_id, req.params.id, user, function(result){
      return res.status(result.code).json(result.message);
    });
  });
});

/*
*
* Allows currently logged User to remove himself from a Project's channel.
* Requires authentication header.
*
*/
router.delete('/:id/members/:member_id', auth, channelValidator.validRemoveMember, function(req, res){
  //look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    channelService.removeMember(req.primaryParams.project_id, req.params.id, user, req.params.member_id, function(result){
      return res.status(result.code).json(result.message);
    });
  });
});

/*
* Allows Channel's Member to update Channel's properties.
* @project_id
* @id
* @name
* @type
* @description
*
*/
router.put('/:id', auth, channelValidator.validUpdateChannel, function(req, res){
  // look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    channelService.updateChannel(req.body, req.primaryParams.project_id, req.params.id, user, function(result){
      return res.status(result.code).json(result.message);
    });
  });
});

module.exports = router;

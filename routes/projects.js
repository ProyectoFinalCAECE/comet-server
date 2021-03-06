"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');
var jwt = require('express-jwt');
var express = require('express');
var router  = express.Router();
var projectService  = require('../services/projectService');
var projectValidator  = require('../services/validators/projectValidator');


// saves the unencrypted token in the 'payload' field of request
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

/*
* Create new Project. Currently logged User is owner.
* Requires authentication header.
*
* @name
* @description
*
*/
router.post('/', auth, projectValidator.validCreate, function(req, res) {
  projectService.createProject(req, res);
});

/*
* Get project's information.
* Requires authentication header.
*
*/
router.get('/:id', auth, projectValidator.validGet, function(req, res) {
  // look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    projectService.getProject(req, res, user);
  });
});

/*
* Get all User Project's information.
* Requires authentication header.
*
*/
router.get('/', auth, function(req, res) {
  // look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    projectService.getProjects(req, res, user);
  });
});

/*
*
* Sends invitations to be part of a project to provided email accounts.
* Requires authentication header.
* @id
* @addresses
*
*/
router.post('/:id/invitations', auth, projectValidator.validNewMembers, function(req, res){
  //look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    projectService.sendInvitationsBulk(req, res, user);
  });
});

/*
*
* Allows currently logged User to accept an invitation to a Project
* Requires authentication header.
* @token
*
*/
router.post('/:id/invitations/accept', auth, projectValidator.validAcceptInvitation, function(req, res){
  //look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    projectService.acceptProjectInvitation(req, res, user, req.body.token);
  });
});


/*
* Update a Project of currently logged User ownership.
* Requires authentication header.
*
*
*/
router.put('/:id', auth, projectValidator.validUpdate, function(req, res) {

  //look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    projectService.updateProject(req, res, user);
  });
});

/*
* Delete a Project of currently logged User ownership.
* Requires authentication header.
*
*/
router.delete('/:id', auth, function(req, res, next) {
  // look for user account
  models.User.findById(req.payload._id).then(function(user) {
    if (!user) {
      return res.status(404).json({ message: 'No se encontro usuario asociado al token provisto.'});
    }
    projectService.deleteProject(req, res, user);
  });
});

/*
* Closes a Project of currently logged User ownership.
* Requires authentication header.
*
*/
router.delete('/:id/close', auth, function(req, res, next) {
  // look for user account
  models.User.findById(req.payload._id).then(function(user) {
    if (!user) {
      return res.status(404).json({ message: 'No se encontro usuario asociado al token provisto.'});
    }
    projectService.closeProject(req, res, user);
  });
});

/*
*
* Allows currently logged User to remove a Project's member if currently logged User is the Project's owner.
* Requires authentication header.
*
*/
router.delete('/:project_id/members/:member_id', auth, function(req, res){
  //look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }
    projectService.removeMember(req, res, user);
  });
});

module.exports = router;

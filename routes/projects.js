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

  var projectCreated = projectService.createProject(req, res);
  if (!(projectCreated instanceof Error))
    return res.status(200).json(projectCreated);
});

/*
* Get project's information.
* Requires authentication header.
*
*/
router.get('/:id', auth, function(req, res, next) {
  // look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }

    projectService.getProject(req.body.id, user).then(function(project) {
      return res.status(200).json(project);
    }).catch(function(err) {
      // error while retrieving
      return next (err);
    });
  });
});

/*
* Update a Project of currently logged User ownership.
* Requires authentication header.
*
*
*/
/*router.put('/:id', auth, projectValidator.validUpdate, function(req, res) {

  // check if there's already an User with provided id at the db
  models.User.findById(req.payload._id).then(function(user) {
    if (!user) {
      return res.status(404).json({ message: 'No se encontro usuario asociado al token provisto.'});
    } else {
      if(req.body.firstName){
        user.firstName = req.body.firstName;
      }
      if(req.body.lastName){
        user.lastName = req.body.lastName;
      }
      if(req.body.alias){
        user.alias = req.body.alias;
      }

      // save modified User
      user.save()
              .then(function(userSaved) {
                // User saved successfully
                return res.json({
                  //token is renewed in case alias was modified
                  token: userSaved.generateJWT()
                });
              }).catch(function(err) {
                  // error while saving
                  return next (err);
              });
    }
  });
});*/

/*
* Delete a Project of currently logged User ownership.
* Requires authentication header.
*
*/
/*router.delete('/:id', auth, function(req, res, next) {
  // look for user account
  models.User.findById(req.payload._id).then(function(user) {
    if (!user) {
      return res.status(404).json({ message: 'No se encontro usuario asociado al token provisto.'});
    } else {
      //Closes account
      user.closeAccount();

      // save deleted User
      user.save()
            .then(function(userSaved) {
              // User saved successfully
              mailerService.sendGoodbyeMail(user.email);
              req.logout();
              res.redirect('/');
            }).catch(function(err) {
              // error while saving
              return next (err);
            });
        }
      });
});*/

module.exports = router;

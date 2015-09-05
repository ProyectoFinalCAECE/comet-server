"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');
var jwt = require('express-jwt');
var express = require('express');
var router  = express.Router();
var accountService  = require('../services/accountService');

var mailerService = require('../services/mailer');
// should we take this to a UserService.js ?

// saves the unencrypted token in the 'payload' field of request
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

/*
* Create new User Account.
*
* @email
* @password
* @firstName
* @lastName
*
*/
router.post('/', function(req, res, next) {
  // validate input parameters
  if (!req.body.email ||
      !req.body.password ||
      !req.body.firstName ||
      !req.body.lastName)  {
        return res.status(400).json({ errors: { all: 'Por completa todos tus datos para continuar.'}});
  }
  if(!models.User.isValidPassword(req.body.password)){
    return res.status(400).json({ errors: { password: 'El formato de la contraseña provista no es válido.'}});
  }

  //check if there's already an User with provided email at the db
  models.User.findOne({ where: { email: req.body.email } }).then(function(userExists) {
    if (userExists) {
      return res.status(403).json({ errors: { email: 'Ya existe un usuario con esta dirección de correo.' }});
    }

    // create new User instance
    var user = models.User.build({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });

    //populating other user record fields
    user.populateUserRecord(req.body.password);

    // save User
    user.save()
            .then(function(userCreated) {
              // User created successfully
              mailerService.sendWelcomeMail(user.email);
              mailerService.sendAccountConfirmationMail(user.email, accountService.generateConfirmationToken(userCreated.id));

              return res.json({
                token: userCreated.generateJWT()
              });
            }).catch(function(err) {
                // error while saving
                return next (err);
            });
    });
});

/*
* Get currently logged User's full Account information.
* Requires authentication header.
*
*/
router.get('/', auth, function(req, res, next) {
  // look for current user's account
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if (!user) {
      return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }

    return res.json({
                    user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    alias: user.alias,
                    email: user.email,
                    profilePicture: user.profilePicture,
                    confirmed: user.confirmed
                    }
                  });
  });
});

/*
* Update currently logged User's Account.
* Requires authentication header.
*
* @alias
* @firstName
* @lastName
*
*/
router.put('/', auth, function(req, res, next) {
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
});

/*
* Delete currently logged User's Account.
* Requires authentication header.
*
*/
router.delete('/', auth, function(req, res, next) {
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
});

module.exports = router;

"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');
var passport = require('passport');
var jwt = require('express-jwt');
var express = require('express');
var router  = express.Router();

var mailerService = require('../services/mailer');
// should we take this to a UserService.js ?

// saves the unencrypted token in the 'payload' field of request
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

/*
* Create User Account
*
* @email
* @password
* @firstName
* @lastName
*/
router.post('/', function(req, res, next) {

    // validate input parameters
    if (!req.body.email ||
        !req.body.password ||
        !req.body.firstName ||
        !req.body.lastName) {
        return res.status(400).json({ errors: { all: 'Please provide required fields.'}});
    }

    // check if there's already an User with provided email at the db
    models.User.findOne({ where: { email: req.body.email } }).then(function(userExists) {
        if (userExists) {
            console.log('there\'s an User with provided email:' + req.body.email);
            return res.status(403).json({ errors: { email: 'Ya existe un usuario con ese email' }});
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
                //mailerService.sendWelcomeMail(user.email);
                //mailerService.sendAccountConfirmationMail(user.email);

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
* Get current logged User full Account information
*
*/
router.get('/', auth, function(req, res, next) {

    // look for current user's account
    models.User.findById(parseInt(req.payload._id)).then(function(user) {
        if (!user) {
            return res.status(401).json({ message: 'there\'s no User with provided id.' });
        }

        return res.json({
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              alias: user.alias,
              email: user.email,
              profilePicture: user.profilePicture
            }
        });
    });
});

/*
* Update User Account
*
* @id
* @alias
* @firstName
* @lastName
*/
router.put('/:id', auth, function(req, res, next) {
    if(req.params.id == req.payload._id ){
      // check if there's already an User with provided id at the db
      models.User.findById(req.params.id).then(function(user) {
        if (!user) {
            return res.status(404).json({ message: 'Cant\'t find user with provided id.'});
        }else{
          if(req.body.firstName){
            user.firstName = req.body.firstName
          }
          if(req.body.lastName){
            user.lastName = req.body.lastName
          }
          if(req.body.alias){
            user.alias = req.body.alias
          }
          // save modified User
          user.save()
              .then(function(userSaved) {
                  // User saved successfully
                  return res.json({
                      token: userSaved.generateJWT()
                  });
              }).catch(function(err) {
                  // error while saving
                  return next (err);
              });
        }
      });
    }else{
      return res.status(401).json({ message: 'Not allowed to perform this action.'});
    }
});

/*
* Create User session
*
* @email
* @password
*/
router.post('/login', function(req, res, next) {

    // validate input parameters
    if (!req.body.email || !req.body.password){
        return res.status(400).json({ message: 'Please provide required fields.' });
    }

    // login using passport
    passport.authenticate('local', function (err, user, info) {

        if (err) {
            console.log(err);
            return next (err);
        }

        if (user) {
            // authenticated User
            return res.json({ token : user.generateJWT() });
        }
        else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

/*
* Destroy current User session
*
*/
router.post('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;

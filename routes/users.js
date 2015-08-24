"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');
var passport = require('passport');
var jwt = require('express-jwt');
var express = require('express');
var router  = express.Router();

// should we take this to a UserService.js ?

// saves the unencrypted token in the 'payload' field of request
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

router.post('/', function(req, res, next) {

    // validate input parameters
    if (!req.body.email ||
        !req.body.password ||
        !req.body.firstName ||
        !req.body.lastName) {
        return res.status(400).json({ message: 'Please provide required fields.'});
    }

    // check if there's already an User with provided email at the db
    models.User.findOne({ where: { email: req.body.email } }).then(function(userExists) {
        if (userExists) {
            console.log('there\'s an User with provided email:' + req.body.email);
            return res.status(403).json({ message: 'there\'s an User with provided email.' });
        }

        // create new User instance
        var user = models.User.build({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
        });
        user.alias = user.firstName.toLowerCase() + user.lastName.toLowerCase();
        user.setPassword(req.body.password);

        // save User
        user.save()
            .then(function(userCreated) {
                // User created successfully
                return res.json({
                    token: userCreated.generateJWT()
                });
            }).catch(function(err) {
                // error while saving
                return next (err);
            });
    });
});

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

module.exports = router;
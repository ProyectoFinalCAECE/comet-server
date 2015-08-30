"use strict";

/**

 * Module dependencies

 */
var accountService  = require('../services/accountService');
var mailerService = require('../services/mailer');
var models  = require('../models');
var express = require('express');
var router  = express.Router();
var jwt = require('express-jwt');
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

/*
* Sends password recovery token to user's email, if confirmed.
* @email
*/
router.post('/password/token', function(req, res) {
  if(!req.body.email){
    return res.status(400).json({ errors: { all: 'Please provide required fields.'}});
  }
  models.User.findOne({ where: { email: req.body.email } }).then(function(user) {
      if(!user) {
          return res.status(404).json({ errors: { email: 'Can\t find user with provided email.' }});
      }

      if(user.confirmed) {
        mailerService.sendPasswordRecoveryMail(user.email, accountService.generatePasswordRecoveryToken(user.id));
        return res.status(200).json({});
      }else{
        return res.status(403).json({ errors: { email: 'User account not confirmed so password can\'t be restored.' }});
      }
  });
});

/*
* Allows Password Recovery
* @newpassword
* @token
*/
router.post('/password/recover', function(req, res){

  if(!req.body.token || !req.body.newpassword){
    return res.status(400).json({ errors: { all: 'Please provide required fields.'}});
  } else {
    accountService.recoverPassword(res, req.body.token, req.body.newpassword);
  }
});

/*
* Allows password renewal for current logged user.
* @oldpassword
* @newpassword
*/

router.post('/password/renew', auth, function(req, res){

  if(!req.body.oldpassword || !req.body.newpassword){
    return res.status(400).json({ errors: { all: 'Please provide required fields.'}});
  } else {
    // look for current user's account
    models.User.findById(parseInt(req.payload._id)).then(function(user) {
        if (!user) {
            return res.status(401).json({ message: 'there\'s no User with provided token.' });
        }

        if(user.validatePassword(req.body.oldpassword)){
          user.setPassword(req.body.newpassword);
          user.save();
          return res.status(200).json({});
        } else {
          return res.status(403).json({ errors: { all: 'Provided parameters are incorrect.'}});
        }

    });
  }
});

module.exports = router;

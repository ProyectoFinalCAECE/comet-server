"use strict";

/**

 * Module dependencies

 */
var accountService  = require('../services/accountService');

var mailerService = require('../services/mailer');

var models  = require('../models');

var express = require('express');

var router  = express.Router();

/*
* Sends password recovery token to user's email, if confirmed.
* @email
*/
router.post('/sendPasswordRecoveryToken', function(req, res) {
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
router.post('/recoverPassword', function(req, res){

  if(!req.body.token || !req.body.newpassword){
    return res.status(400).json({ errors: { all: 'Please provide required fields.'}});
  } else {
    accountService.recoverPassword(res, req.body.token, req.body.newpassword);
  }
});

module.exports = router;

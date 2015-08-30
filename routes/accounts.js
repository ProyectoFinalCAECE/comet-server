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
* Sends password recovery token to user's email, if account is confirmed.
*
* @email
*
*/
router.post('/password/token', function(req, res) {

  if(!req.body.email){
    return res.status(400).json({ errors: { all: 'Por favor ingrese los parametros requeridos.'}});
  }

  models.User.findOne({ where: { email: req.body.email } }).then(function(user) {

      if(!user) {
          return res.status(404).json({ errors: { email: 'No se encontro usuario con el email provisto.' }});
      }

      if(user.confirmed) {
        mailerService.sendPasswordRecoveryMail(user.email, accountService.generatePasswordRecoveryToken(user.id));
        return res.status(200).json({});
      } else {
        return res.status(403).json({ errors: { email: 'La contraseña no podra actualizarse hasta que la cuenta no sea confirmada.' }});
      }
  });
});

/*
* Sets new password to User account if provided token is valid.
*
* @newpassword
* @token
*
*/
router.post('/password/recover', function(req, res){

  if(!req.body.token || !req.body.newpassword){
    return res.status(400).json({ errors: { all: 'Por favor ingrese los parametros requeridos.'}});
  } else {
    accountService.recoverPassword(res, req.body.token, req.body.newpassword);
  }
});

/*
* Sets new password for current logged user.
* Requires authentication header.
*
* @oldpassword
* @newpassword
*
*/

router.post('/password/renew', auth, function(req, res){

  if(!req.body.oldpassword || !req.body.newpassword){
    return res.status(400).json({ errors: { all: 'Por favor ingrese los parametros requeridos.'}});
  } else {
    // look for current user's account
    models.User.findById(parseInt(req.payload._id)).then(function(user) {
      if (!user) {
        return res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
      }

      //If old password is valid
      if(user.validatePassword(req.body.oldpassword)){
        //Sets new password
        user.setPassword(req.body.newpassword);
        user.save();
        return res.status(200).json({});
      } else {
        return res.status(403).json({ errors: { all: 'Los parametros ingresados son incorrectos.'}});
      }
    });
  }
});

module.exports = router;

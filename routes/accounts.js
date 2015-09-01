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
var passport = require('passport');

/*
* Logs in an User with provided credentials and returns a session token.
*
* @email
* @password
*
*/
router.post('/login', function(req, res, next) {
  // validate input parameters
  if (!req.body.email || !req.body.password){
    return res.status(400).json({ message: 'Por favor ingrese los parametros requeridos.' });
  }

  // login using passport
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      console.log(err);
      return next (err);
    }

    if (user) {
      // authenticated User
      return res.json({
                      token : user.generateJWT()
                      });
    } else {
      return res.status(401).json({ errors: info });
    }
  })(req, res, next);
});

/*
* Destroy currently logged User's session
*
*/
router.post('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/*
* Allows User Account confirmation with token previously sent via email
*
* @token
*
*/
router.post('/confirm', function(req, res, next) {
  if(!req.body.token){
    return res.status(400).json({ errors: { all: 'Por favor ingrese los parametros requeridos.'}});
  } else {
    accountService.confirmAccount(res, req.body.token);
  }
});

/*
* Resends User's Account confirmation link via email.
* Requires authentication header.
*
* @token
*
*/
router.post('/confirm/token', auth, function(req, res, next) {
  // look for user account
  models.User.findById(req.payload._id).then(function(user) {
    if (!user) {
      return res.status(404).json({ message: 'No se encontro usuario asociado al token provisto.'});
    } else {
      mailerService.sendAccountConfirmationMail(user.email, accountService.generateConfirmationToken(user.id));
      return res.status(200).json({});
    }
  });
});

/*
* Sends password recovery token to User's email account, if account exists and is confirmed.
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
  }

  if(!models.User.isValidPassword(req.body.password)){
    return res.status(400).json({ errors: { password: 'El formato de la contraseña provista no es valido.'}});
  }

  accountService.recoverPassword(res, req.body.token, req.body.newpassword);

});

/*
* Sets new password for currently logged user, if old password is correct.
* Requires authentication header.
*
* @oldpassword
* @newpassword
*
*/

router.post('/password/renew', auth, function(req, res){

  if(!req.body.oldpassword || !req.body.newpassword){
    return res.status(400).json({ errors: { all: 'Por favor ingrese los parametros requeridos.'}});
  }

  if(!models.User.isValidPassword(req.body.password)){
    return res.status(400).json({ errors: { password: 'El formato de la contraseña provista no es valido.'}});
  }

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
});

module.exports = router;

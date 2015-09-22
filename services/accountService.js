"use strict";

/**

 * Module dependencies

 */
var jwt = require('jsonwebtoken');
var models  = require('../models');

/*
* Generates an expirable confirmation token to be sent via email for user to confirmate its new account.
*
* @user_id
*
*/
module.exports.generateConfirmationToken = function(user_id) {
  // expirates in 1 day
  var today = new Date();
  var expiration = new Date(today);
  expiration.setDate(today.getDate() + 1);

  //generating jwt
  return jwt.sign({
                    _id: user_id,
                    action: 'confirm',
                    exp: parseInt(expiration.getTime() / 1000)
                  }
                  , 'mySecretPassword');
}

/*
* Confirms User account evaluating provided token
*
* @res
* @token
*
*/
module.exports.confirmAccount = function(res, token){
  //verifying jwt
  jwt.verify(token, 'mySecretPassword', function(err, decoded) {
    if (err) {
      return res.status(400).json({error:{name: err.name, message: err.message}});
      /*
        err = {
          name: 'TokenExpiredError',
          message: 'jwt expired',
          expiredAt: 1408621000
        }
      */
    }

    //evaluating token action
    if(decoded.action == 'confirm'){
      // look for current user's account
      models.User.findById(parseInt(decoded._id)).then(function(user) {
        if (!user) {
          return res.status(404).json({ errors: { all: 'No se encontro usuario asociado al token provisto.'}});
        }

        user.getTokens({ where: ['value = ?', token] }).then(function(tokens){
          if (!(tokens === undefined || tokens.length === 0)) {
            return res.status(403).json({ errors: { all: 'El token provisto ya ha sido consumido.'}});
          }

          if(!user.confirmed){
             //saving token to avoid reusing it
             user.createToken({value: token});
             //confirming user account
             user.confirmAccount();
             user.save();
             return res.status(200).json({});
          } else {
            return res.status(403).json({ errors: { all: 'La cuenta ya habia sido confirmada previamente.'}});
          }
        });
      });

    } else {
      return res.status(403).json({ errors: { all: 'El token provisto no fue diseñado para este proposito.'}});
    }
  });
}

/*
* Generates an expirable password recovery token for provided user.
*
* @user_id
*
*/
module.exports.generatePasswordRecoveryToken = function(user_id) {
  // expirates in 20 minutes
  var now = new Date();
  now.setMinutes(now.getMinutes() + 20);

  return jwt.sign({
                    _id: user_id,
                    action: 'recover',
                    exp: parseInt(now.getTime() / 1000)
                  },
                  'mySecretPassword');
}

/*
* Sets new password to account if provided token is valid.
*
* @res
* @token
* @newpassword
*
*/
module.exports.recoverPassword = function(res, token, newpassword){
  jwt.verify(token, 'mySecretPassword', function(err, decoded) {
    if (err) {
      return res.status(400).json({error:{name: err.name, message: err.message}});
      /*
        err = {
          name: 'TokenExpiredError',
          message: 'jwt expired',
          expiredAt: 1408621000
        }
      */
    }

    //evaluating token action
    if(decoded.action == 'recover'){
      // look for current user's account
      models.User.findById(parseInt(decoded._id)).then(function(user) {
        if (!user) {
          return res.status(404).json({ errors: { all: 'No se encontro usuario asociado al token provisto.'}});
        }

        user.getTokens({ where: ['value = ?', token] }).then(function(tokens){
          if (!(tokens === undefined || tokens.length === 0)) {
            return res.status(403).json({ errors: { all: 'El token provisto ya ha sido consumido.'}});
          }

           //saving token to avoid reusing it
           user.createToken({value: token});
           //setting new password
           user.setPassword(newpassword);
           user.save();
           return res.status(200).json({});
        });
      });
    } else {
      return res.status(403).json({ errors: { all: 'El token provisto no fue diseñado para este proposito.'}});
    }
  });
}

/*
* Generates an expirable account recovery token for provided user.
*
* @user_id
*
*/
module.exports.generateAccountRecoveryToken = function(user_id) {
  // expirates in 20 minutes
  var now = new Date();
  now.setMinutes(now.getMinutes() + 20);

  return jwt.sign({
                    _id: user_id,
                    action: 'account',
                    exp: parseInt(now.getTime() / 1000)
                  },
                  'mySecretPassword');
}

/*
* Re-opens closed User Account and sets new password to it, if provided token is valid.
*
* @res
* @token
* @newpassword
*
*/
module.exports.reopenAccount = function(res, token, newpassword){
  jwt.verify(token, 'mySecretPassword', function(err, decoded) {
    if (err) {
      return res.status(400).json({error:{name: err.name, message: err.message}});
      /*
        err = {
          name: 'TokenExpiredError',
          message: 'jwt expired',
          expiredAt: 1408621000
        }
      */
    }

    //evaluating token action
    if(decoded.action == 'account'){
      // look for current user's account
      models.User.findById(parseInt(decoded._id)).then(function(user) {
        if (!user) {
          return res.status(404).json({ errors: { all: 'No se encontro usuario asociado al token provisto.'}});
        }

        user.getTokens({ where: ['value = ?', token] }).then(function(tokens){
          if (!(tokens === undefined || tokens.length === 0)) {
            return res.status(403).json({ errors: { all: 'El token provisto ya ha sido consumido.'}});
          }

           //saving token to avoid reusing it
           user.createToken({value: token});
           //setting new password
           user.reopenAccount(newpassword);
           user.save();
           return res.status(200).json({});
        });
      });
    } else {
      return res.status(403).json({ errors: { all: 'El token provisto no fue diseñado para este proposito.'}});
    }
  });
}

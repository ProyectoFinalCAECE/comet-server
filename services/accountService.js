"use strict";

/**

 * Module dependencies

 */
var jwt = require('jsonwebtoken');
var models  = require('../models');

/*
* Generates an expirable confirmation token to be sent via email to confirmate a new account.
*/
module.exports.generateConfirmationToken = function(user_id) {
    // expirates in 1 day
    var today = new Date();
    var expiration = new Date(today);
    expiration.setDate(today.getDate() + 1);

    return jwt.sign({
                      _id: user_id,
                      exp: parseInt(expiration.getTime() / 1000)
                    }
                    , 'mySecretPassword');
}

/*
* Confirms User account
*/
module.exports.confirmAccount = function(res, token) {
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

        // look for current user's account
        models.User.findById(parseInt(decoded._id)).then(function(user) {
            if (!user) {
                return res.status(404).json({ errors: { all: 'there\'s no User with provided id.'}});
            }
            user.confirmAccount();
        });
        return res.status(200).json({});
    });
}

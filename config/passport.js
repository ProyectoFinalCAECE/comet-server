var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var models  = require('../models');
var winston = require('winston');

// login using Passport - Local Strategy
// reads request's parameters values
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {

    // search for an User with provided email at db

    //convert to lowercase since pg is casesensitive
    email = email.toLowerCase();
    models.User.findOne({ where: { email: email} }).then( function(user) {

      // User doesn't exist
      if (!user) {
        return done(null, false, { email: 'Dirección de correo no encontrada.' });
      }

      // User is not able to login
      if (!user.active) {
        return done(null, false, { closed: 'Esta cuenta se encuentra cerrada.' });
      }

      // Wrong password
      if (!user.validatePassword(password)) {
        return done(null, false, { password: 'Contraseña incorrecta.' });
      }

      // Authenticated User
      return done(null, user);

    }).catch(function(err) {
        winston.info('error at passport login:' + err);
        return done(err);
    });
  }
));

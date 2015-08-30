var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var models  = require('../models');

// login using Passport - Local Strategy
// reads request's parameters values
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {

    // search for an User with provided email at db
    models.User.findOne({ where: { email: email} }).then( function(user) {

      // User doesn't exist
      if (!user) {
        return done(null, false, { email: 'Email no encontrado.' });
      }

      // User is not able to login
      if (!user.active) {
        return done(null, false, { email: 'Cuenta cerrada.' });
      }

      // Wrong password
      if (!user.validatePassword(password)) {
        return done(null, false, { password: 'Contraseña incorrecta.' });
      }

      // Authenticated User
      return done(null, user);

    }).catch(function(err) {
        console.log('error at passport login:' + err);
        return done(err);
    });
  }
));

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
        return done(null, false, { message: 'User not found.' });
      }

      // Wrong password
      if (!user.validatePassword(password)) {
        return done(null, false, { message: 'Wrong password.' });
      }

      // Authenticated User
      return done(null, user);

    }).catch(function(err) {
        console.log('error at passport login:' + err);
        return done(err);
    });
  }
));

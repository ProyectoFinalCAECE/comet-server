var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var models  = require('../models');

// login utilizando Passport - Local Strategy
// toma el valor de los campos directamente del request
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    
    // busco en la BD si existe el mail
    models.Usuario.findOne({ where: { email: email} }).then( function(usuario) {
      
      // no existe el usuario
      if (!usuario) {
        return done(null, false, { message: 'Usuario no encontrado.' });
      }
      
      // el password es incorrecto
      if (!usuario.validarPassword(password)) {
        return done(null, false, { message: 'Password incorrecto.' });
      }
      
      // usuario autenticado
      return done(null, usuario);
      
    }).catch(function(err) {
        console.log('error en login con passport:' + err);
        return done(err);
    });
  }
));

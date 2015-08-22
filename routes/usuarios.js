var models  = require('../models');
var passport = require('passport');
var jwt = require('express-jwt');
var express = require('express');
var router  = express.Router();

// llevar a un UserService.js ?

// saves the unecrypted token in the 'payload' field of request
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

router.post('/crear', function(req, res, next) {
    
    // validaciones
    if (!req.body.email || 
        !req.body.password || 
        !req.body.nombre ||
        !req.body.apellido) {
        return res.status(400).json({ message: 'Por favor complete todos los campos.' });
    }
    
    // busco si existe un usuario con el mismo email
    models.Usuario.findOne({ where: { email: req.body.email } }).then(function(usuarioExistente) {
        if (usuarioExistente) {
            console.log("ya existe el usuario con email:" + req.body.email);
            return res.status(400).json({ message: 'Ya existe un usuario con ese email.' });
        }
      
        // cargo datos en Usuario    
        var usuario = models.Usuario.build({ 
            email: req.body.email,
            nombre: req.body.nombre,
            apellido: req.body.apellido, 
        });
        usuario.alias = usuario.nombre.toLowerCase() + usuario.apellido.toLowerCase();
        usuario.setPassword(req.body.password);
        
        // grabo en SQL
        usuario.save()
            .then(function(usuarioCreado) {
                // usuario guardado exitosamente
                return res.json({
                    token: usuarioCreado.generateJWT()
                });
            }).catch(function(err) {
                // error al grabar
                return next (err);
            });
    });
});

router.post('/login', function(req, res, next) {
    
    // validaciones
    if (!req.body.email || !req.body.password){
        return res.status(400).json({ message: 'Por favor complete todos los campos.' });
    }
    
    // login usando passport 
    passport.authenticate('local', function (err, user, info) {
        
        if (err) { 
            console.log(err);
            return next (err); 
        }

        if (user) {
            // usuario autenticado
            return res.json({ token : user.generateJWT() });
        }
        else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

module.exports = router;
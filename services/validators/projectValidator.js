"use strict";

/**

 * Module dependencies

 */

/*
*
* Checks if provided parameters for new Project are valid or returns an appropiate response.
* @name
* @description
* @members - optional
*
*/
var validator = require("email-validator");

//Max project name and description text lengths
//should be consts but it's use is not allowed under strict mode... yet.
var NameLenght = 40;
var DescLength = 200;

module.exports.validCreate = function(req, res, next) {
  var errors = {};
  var hasErrors = false;

  // validate input parameters
  if (!req.body.name && !req.body.description) {
    return res.status(400).json({ errors: { all: 'Por favor completa el nombre y la descripción de tu proyecto.'}});
  }

  if (!req.body.name) {
    errors.name = 'Por favor ingresa el nombre de tu proyecto.';
    hasErrors = true;
  } else if (req.body.name.length > NameLenght) {
    errors.name = 'El nombre de tu proyecto no debe superar los '+NameLenght+' caracteres.';
    hasErrors = true;
  }

  if (!req.body.description) {
    errors.description = 'Por favor ingresa una descripción de tu proyecto.';
    hasErrors = true;
  } else if (req.body.description.length > DescLength) {
    errors.description = 'La descripción de tu proyecto no debe superar los '+DescLength+' caracteres.';
    hasErrors = true;
  }

  if (req.body.members.length > 0) {
    for (var m in req.body.members) {
      if (!validator.validate((req.body.members[m].address))) {
        errors[req.body.members[m].name] = 'Correo inválido';
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
}

/*
*
* Checks if provided parameters to update a Project are valid or returns an appropiate response.
* @name
* @description
*
*/

module.exports.validUpdate = function(req, res, next) {
  // validate input parameters
  if (req.body.name) {
    if(req.body.name === ''){
      return res.status(400).json({ errors: { name: 'El nombre provisto no es válido.'}});
    }
  }

  if (req.body.description) {
    if(req.body.description === ''){
      return res.status(400).json({ errors: { description: 'La descripción provista no es válida.'}});
    }
  }
  next();
}

/*
*
* Checks if provided parameters get a Project are valid or returns an appropiate response.
* @id
*
*/
module.exports.validGet = function(req, res, next) {
  // validate input parameters
  if (!req.params.id)  {
        return res.status(400).json({ errors: { all: 'Por favor ingrese los parámetros requeridos.'}});
  }
  next();
}

/*
*
* Checks if provided parameters to send invitations to Project are valid or returns an appropiate response.
* @id
* @addresses
*
*/
module.exports.validNewMembers = function(req, res, next){
  var errors = {};
  var hasErrors = false;

  // validate input parameters
  if (!req.params.id || !req.body.addresses)  {
        return res.status(400).json({ errors: { all: 'Por favor ingrese los parámetros requeridos.'}});
  }

  if (req.body.addresses.length > 0) {
    for (var a in req.body.addresses) {
      if (!validator.validate((req.body.addresses[a].address))) {
        errors[req.body.addresses[a].name] = 'Correo inválido';
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
}

/*
*
* Checks if provided parameters to accept project invitations are valid or returns an appropiate response.
*
*
*
*/
module.exports.validAcceptInvitation = function(req, res, next){
  // validate input parameters
  if (!req.body.token)  {
    return res.status(400).json({ errors: { all: 'Por favor ingrese los parámetros requeridos.'}});
  }
  next();
}

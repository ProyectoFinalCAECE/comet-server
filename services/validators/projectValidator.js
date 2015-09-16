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
module.exports.validCreate = function(req, res, next) {
  // validate input parameters
  if (!req.body.name) {
    return res.status(400).json({ errors: { name: 'Por favor ingresa el nombre de tu proyecto.'}});
  }

  if (!req.body.description) {
    return res.status(400).json({ errors: { description: 'Por favor ingresa alguna descripción de tu proyecto.'}});
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
  // validate input parameters
  if (!req.params.id || !req.body.addresses)  {
        return res.status(400).json({ errors: { all: 'Por favor ingrese los parámetros requeridos.'}});
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

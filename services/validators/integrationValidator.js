"use strict";

/**

 * Module dependencies

 */

var models  = require('../../models');

//Allowed integrations active states.
var validActiveStates = ["true", "false"];

/*
*
* Checks if provided parameters to update an Integration state of a certain Project is valid or returns an appropiate response.
* @active
* @project_id
* @integration_id
*
*/
module.exports.validUpdateIntegration = function(req, res, next){
  // validate input parameters
  var errors = {};
  var hasErrors = false;

  if (!req.body.active) {
    errors.type = 'Por favor ingrese un valor para el estado active de la integración.';
    hasErrors = true;
  } else if (validActiveStates.indexOf(req.body.active) === -1) {
    errors.type = 'El valor provisto para el parámetro active es inválido.';
    hasErrors = true;
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
};

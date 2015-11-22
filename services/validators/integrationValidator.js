"use strict";

/**

 * Module dependencies

 */

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
module.exports.validUpdateProjectIntegration = function(req, res, next){
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

/*
*
* Checks if provided parameters to create a specific XX_Integration for a certain Project are valid or returns an appropiate response.
* @projectId
* @projectIntegrationId
* @channelId
* @name
* @token
*
*/
module.exports.validCreateProjectIntegration = function(req, res, next){
  // validate input parameters
  var errors = {};
  var hasErrors = false;

  if (!req.primaryParams.project_id)  {
    errors.project_id = 'Por favor ingrese el id de proyecto.';
    hasErrors = true;
  }

  if (!req.params.id)  {
    errors.project_integration_id = 'Por favor ingrese el id de proyectointegracion.';
    hasErrors = true;
  }

  if (!req.body.channelId) {
    errors.channelId = 'Por favor ingresa el id del canal al que deseas asociar la integración.';
    hasErrors = true;
  }

  if (!req.body.name) {
    errors.name = 'Por favor ingresa el nombre con el cual van a figurar los mensajes de la integración.';
    hasErrors = true;
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
};

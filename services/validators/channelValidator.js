"use strict";

/**

 * Module dependencies

 */

//Max channel name and description text lengths
//should be consts but it's use is not allowed under strict mode... yet.
var NameLenght = 50;
var DescLenght = 500;
//Allowed channel types.
var channelTypes = ['S','P'];

/*
*
* Checks if provided parameters for new Channel are valid or returns an appropiate response.
* @name
* @type
* @description
*
*/

module.exports.validCreate = function(req, res, next) {
  var errors = {};
  var hasErrors = false;

  // validate input parameters
  if (!req.body.name && !req.body.description) {
    return res.status(400).json({ errors: { all: 'Por favor completa el nombre y la descripción de tu canal.'}});
  }

  if (!req.body.name) {
    errors.name = 'Por favor ingresa el nombre de tu canal.';
    hasErrors = true;
  } else if (req.body.name.length > NameLenght) {
    errors.name = 'El nombre de tu canal no debe superar los '+ NameLenght +' caracteres.';
    hasErrors = true;
  }

  if (!req.body.description) {
    errors.description = 'Por favor ingresa la descripción de tu canal.';
    hasErrors = true;
  } else if (req.body.description.length > DescLenght) {
    errors.description = 'La descripción de tu canal no debe superar los '+ DescLenght +' caracteres.';
    hasErrors = true;
  }

  if (!req.body.type) {
    errors.type = 'Por favor ingresa el tipo de tu canal.';
    hasErrors = true;
  } else if (channelTypes.indexOf(req.body.type) === -1) {
    errors.type = 'El tipo provisto para tu canal es inválido.';
    hasErrors = true;
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
};

/*
*
* Checks if provided parameters to get a Channel are valid or returns an appropiate response.
* @id
* @project_id
*
*/
module.exports.validGet = function(req, res, next) {
  // validate input parameters
  if (!req.params.id)  {
    return res.status(400).json({ errors: { all: 'Por favor ingrese el id de canal deseado.'}});
  }

  if (!req.primaryParams.project_id)  {
    return res.status(400).json({ errors: { all: 'Por favor ingrese el id de proyecto.'}});
  }

  next();
};

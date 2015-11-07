"use strict";

/**

 * Module dependencies

 */

//Max channel name and description text lengths
//should be consts but it's use is not allowed under strict mode... yet.
var models  = require('../../models');

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
  } else if (req.body.name.length > models.Channel.nameLength()) {
    errors.name = 'El nombre de tu canal no debe superar los '+ models.Channel.nameLength() +' caracteres.';
    hasErrors = true;
  }

  if (!req.body.description) {
    errors.description = 'Por favor ingresa la descripción de tu canal.';
    hasErrors = true;
  } else if (req.body.description.length > models.Channel.descriptionLength()) {
    errors.description = 'La descripción de tu canal no debe superar los '+ models.Channel.descriptionLength() +' caracteres.';
    hasErrors = true;
  }

  if (!req.body.type) {
    errors.type = 'Por favor ingresa el tipo de tu canal.';
    hasErrors = true;
  } else if (channelTypes.indexOf(req.body.type) === -1) {
    errors.type = 'El tipo provisto para tu canal es inválido.';
    hasErrors = true;
  }

  if (req.body.members && req.body.members.length > 0) {
    for (var m in req.body.members) {
      if (isNaN(req.body.members[m].id)) {
        errors[req.body.members[m].name] = 'ID de usuario inválido';
        hasErrors = true;
      }
    }
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

/*
*
* Checks if provided parameters to get Project's Channels are valid or returns an appropiate response.
* @project_id
*
*/
module.exports.validGetByChannel = function(req, res, next) {
  if (!req.primaryParams.project_id)  {
    return res.status(400).json({ errors: { all: 'Por favor ingrese el id de proyecto.'}});
  }

  next();
};

/*
*
* Checks if provided parameters to add members to a Project's Channels are valid or returns an appropiate response.
* @project_id
* @id
* @members
*
*/
module.exports.validAddMembers = function(req, res, next) {
  var errors = {};
  var hasErrors = false;

  if (!req.primaryParams.project_id)  {
    errors.project_id = 'Por favor ingrese el id de proyecto.';
    hasErrors = true;
  }

  if (!req.params.id)  {
    errors.id = 'Por favor ingrese el id de canal deseado.';
    hasErrors = true;
  }

  if (!req.body.members || req.body.members.length === 0)  {
    return res.status(400).json({ errors: { all: 'Por favor ingrese el id de los miembros a agregar al canal.'}});
  } else {
    for (var m in req.body.members) {
      if (isNaN(req.body.members[m].id)) {
        errors[req.body.members[m].name] = 'ID de usuario inválido';
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
};

/*
*
* Checks if provided parameters to delete a Project's Channels are valid or returns an appropiate response.
* @project_id
* @id
*
*/
module.exports.validDelete = function(req, res, next){
  var errors = {};
  var hasErrors = false;

  if (!req.params.id)  {
    errors.id = 'Por favor ingrese el id de canal deseado.';
    hasErrors = true;
  }

  if (!req.primaryParams.project_id)  {
    errors.id = 'Por favor ingrese el id de proyecto.';
    hasErrors = true;
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
};

/*
*
* Checks if provided parameters to close a Project's Channels are valid or returns an appropiate response.
* @project_id
* @id
*
*/
module.exports.validClose = function(req, res, next){
  var errors = {};
  var hasErrors = false;

  if (!req.params.id)  {
    errors.id = 'Por favor ingrese el id de canal deseado.';
    hasErrors = true;
  }

  if (!req.primaryParams.project_id)  {
    errors.id = 'Por favor ingrese el id de proyecto.';
    hasErrors = true;
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
};

/*
*
* Checks if provided parameters to remove a Project's Channel's member are valid or returns an appropiate response.
* @project_id
* @id
* @member_id
*
*/
module.exports.validRemoveMember = function(req, res, next){
  var errors = {};
  var hasErrors = false;

  if (!req.params.member_id)  {
    errors.member_id = 'Por favor ingrese el id del usuario a eliminar.';
    hasErrors = true;
  }

  if (!req.params.id)  {
    errors.id = 'Por favor ingrese el id de canal deseado.';
    hasErrors = true;
  }

  if (!req.primaryParams.project_id)  {
    errors.id = 'Por favor ingrese el id de proyecto.';
    hasErrors = true;
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
};

/*
*
* Checks if provided parameters to update a Channel are valid or returns an appropiate response.
* @name
* @description
* @type
*
*/
module.exports.validUpdateChannel = function(req, res, next){
  // validate input parameters
  var errors = {};
  var hasErrors = false;

  if (req.body.name !== undefined) {
    if(req.body.name === ''){
      errors.name = 'Por favor ingresa el nombre de tu canal.';
      hasErrors = true;
    }
    if(req.body.name.length > models.Channel.nameLength()){
      errors.name = 'El nombre de tu canal no debe superar los '+ models.Channel.nameLength() +' caracteres.';
      hasErrors = true;
    }
  }

  if (req.body.description !== undefined) {
    if(req.body.description === ''){
      errors.description = 'Por favor ingresa la descripción de tu canal.';
      hasErrors = true;
    }
    if(req.body.description.length > models.Channel.descriptionLength()){
      errors.description = 'La descripción de tu canal no debe superar los '+ models.Channel.descriptionLength() +' caracteres.';
      hasErrors = true;
    }
  }

  if (req.body.type !== undefined) {
    if(req.body.type === '' || channelTypes.indexOf(req.body.type) === -1){
      return res.status(400).json({ errors: { description: 'El tipo provisto no es válido.'}});
    }
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
};

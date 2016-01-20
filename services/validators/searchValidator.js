"use strict";

/**

 * Module dependencies

*/

/**
 * validates if provided search parameters for a message in a project are valid.
 * @param  {http request}   req
 * @param  {http request}   res
 * @param  {Function} next
 * @return {Function} next
 */
module.exports.validSearchMessageInProject = function(req, res, next) {
  var errors = {};
  var hasErrors = false;

  if (!req.primaryParams.project_id)  {
    return res.status(400).json({ errors: { all: 'Por favor ingrese el id de proyecto.'}});
  }

  if(!req.params.q ||
      typeof req.params.q !== String ||
      req.params.q.length === 0){
        return res.status(400).json({ errors: { all: 'Por favor ingrese una cadena de busqueda valida.'}});
  } else {
    req.params.q = req.sanitize(req.param('q'));

    if(req.params.q.length === 0){
          return res.status(400).json({ errors: { all: 'Por favor ingrese una cadena de busqueda valida.'}});
    }
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
};

/**
 * validates if provided search parameters for a message in a channel are valid.
 * @param  {http request}   req
 * @param  {http request}   res
 * @param  {Function} next
 * @return {Function} next
 */
module.exports.validSearchMessageInChannel = function(req, res, next) {
  var errors = {};
  var hasErrors = false;

  if (!req.primaryParams.project_id)  {
    return res.status(400).json({ errors: { all: 'Por favor ingrese el id de proyecto.'}});
  }

  if (!req.primaryParams.channel_id)  {
    return res.status(400).json({ errors: { all: 'Por favor ingrese el id de canal.'}});
  }

  if(!req.params.q ||
      typeof req.params.q !== String ||
      req.params.q.length === 0){
        return res.status(400).json({ errors: { all: 'Por favor ingrese una cadena de busqueda valida.'}});
  } else {
    req.params.q = req.sanitize(req.param('q'));

    if(req.params.q.length === 0){
          return res.status(400).json({ errors: { all: 'Por favor ingrese una cadena de busqueda valida.'}});
    }
  }

  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }

  next();
};

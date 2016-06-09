"use strict";

/**

 * Module dependencies

*/

var validator = require('validator');
var XRegExp = require('xregexp').XRegExp;

/**
 * validates if provided search parameters for a message in a project are valid.
 * @param  {http request}   req
 * @param  {http request}   res
 * @param  {Function} next
 * @return {Function} next
 */
module.exports.validSearchMessageInProject = function(req, res, next) {
  var errors = {};

  if (!req.primaryParams.project_id || !validator.isNumeric(req.primaryParams.project_id))
    errors.project_id = 'Por favor ingrese el id de proyecto.';

  if(!req.query.q ||
      (typeof(req.query.q) !== "string") ||
      req.query.q.length === 0){
        errors.q = 'Por favor ingrese una cadena de búsqueda válida.';
  } else {

    if(!XRegExp.test(req.query.q, /^[a-z\u00E0-\u00FC0-9 ]+$/i)){
      errors.q = 'Por favor ingrese una cadena de búsqueda válida.';
    }

    req.query.q = validator.replaceWhiteSpaces(req.query.q);
    req.query.q = validator.trim(req.query.q);
    req.query.q = validator.escape(req.query.q);
    req.query.q = req.query.q.toLowerCase();

    if(req.query.q.length === 0)
      errors.q = 'Por favor ingrese una cadena de búsqueda válida.';

  }

  if (Object.keys(errors).length > 0)
    return res.status(400).json({ errors: errors });

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

  if (!req.primaryParams.project_id || !validator.isNumeric(req.primaryParams.project_id))
    errors.project_id = 'Por favor ingrese el id de proyecto.';

  if (!req.primaryParams.channel_id)
    errors.channel_id = 'Por favor ingrese el id de canal.';

  if(!req.query.q ||
      (typeof(req.query.q) !== "string") ||
      req.query.q.length === 0){
        errors.q = 'Por favor ingrese una cadena de búsqueda válida.';
  } else {

    if(!XRegExp.test(req.query.q, /^[a-z\u00E0-\u00FC0-9 ]+$/i)){
      errors.q = 'Por favor ingrese una cadena de búsqueda válida.';
    }

    req.query.q = validator.replaceWhiteSpaces(req.query.q);
    req.query.q = validator.trim(req.query.q);
    req.query.q = validator.escape(req.query.q);
    req.query.q = req.query.q.toLowerCase();

    if(req.query.q.length === 0)
      errors.q = 'Por favor ingrese una cadena de búsqueda válida.';
  }

  if (Object.keys(errors).length > 0)
    return res.status(400).json({ errors: errors });

  next();
};

/**
* validates if provided search parameters for a User are valid.
* @param  {http request}   req
* @param  {http request}   res
* @param  {Function} next
* @return {Function} next
 */
module.exports.validSearchUserInProject = function(req, res, next){
  var errors = {};

  if (!req.primaryParams.project_id || !validator.isNumeric(req.primaryParams.project_id))
    errors.project_id = 'Por favor ingrese el id de proyecto.';

  if(!req.query.q ||
      (typeof(req.query.q) !== "string") ||
      req.query.q.length === 0){
        errors.q = 'Por favor ingrese una cadena de búsqueda válida.';
  } else {

    if(!XRegExp.test(req.query.q, /^[a-z\u00E0-\u00FC0-9 ]+$/i)){
      errors.q = 'Por favor ingrese una cadena de búsqueda válida.';
    }

    req.query.q = validator.replaceWhiteSpaces(req.query.q);
    req.query.q = validator.trim(req.query.q);
    req.query.q = validator.escape(req.query.q);
    req.query.q = req.query.q.toLowerCase();

    if(req.query.q.length === 0)
      errors.q = 'Por favor ingrese una cadena de búsqueda válida.';

  }

  if (Object.keys(errors).length > 0)
    return res.status(400).json({ errors: errors });

  next();
};

/**
 * validates if provided string contains whitespaces
 * @return {boolean}
 */
validator.extend('replaceWhiteSpaces', function (str) {
    return str.replace(/ /g, "%");
});

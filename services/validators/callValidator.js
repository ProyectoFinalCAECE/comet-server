"use strict";

/**

 * Module dependencies

*/

var validator = require('validator');

/**
 * validates if provided parameters to retrieve a Channel's calls are valid.
 * @param  {http request}   req
 * @param  {http request}   res
 * @param  {Function} next
 * @return {Function} next
 */
module.exports.validRetrieveCalls = function(req, res, next) {
  var errors = {};

  if (!req.primaryParams.project_id || !validator.isNumeric(req.primaryParams.project_id))
    errors.project_id = 'Por favor ingrese el id de proyecto.';

    if (!req.primaryParams.channel_id || !validator.isNumeric(req.primaryParams.channel_id))
      errors.channel_id = 'Por favor ingrese el id de canal.';

  if (Object.keys(errors).length > 0)
    return res.status(400).json({ errors: errors });

  next();
};

/**
 * validates if provided parameters to create a call are valid.
 * @param  {http request}   req
 * @param  {http request}   res
 * @param  {Function} next
 * @return {Function} next
 */
module.exports.validNewCall = function(req, res, next) {
  var errors = {};

  if (!req.primaryParams.project_id || !validator.isNumeric(req.primaryParams.project_id))
    errors.project_id = 'Por favor ingrese el id de proyecto.';

  if (!req.primaryParams.channel_id || !validator.isNumeric(req.primaryParams.channel_id))
    errors.channel_id = 'Por favor ingrese el id de canal.';

  if (Object.keys(errors).length > 0)
    return res.status(400).json({ errors: errors });

  next();
};

/**
* validates if provided parameters to update a call are valid.
* @param  {http request}   req
* @param  {http request}   res
* @param  {Function} next
* @return {Function} next
 */
module.exports.validUpdateCall = function(req, res, next){
  var errors = {};

  if (!req.primaryParams.project_id || !validator.isNumeric(req.primaryParams.project_id))
    errors.project_id = 'Por favor ingrese el id de proyecto.';

  if (!req.primaryParams.channel_id || !validator.isNumeric(req.primaryParams.channel_id))
    errors.channel_id = 'Por favor ingrese el id de canal.';

  if (Object.keys(errors).length > 0)
    return res.status(400).json({ errors: errors });

  next();
};

/**
* validates if provided parameters to add a call member are valid.
* @param  {http request}   req
* @param  {http request}   res
* @param  {Function} next
* @return {Function} next
 */
module.exports.validAddCallMember = function(req, res, next){
  var errors = {};

  if (!req.primaryParams.project_id || !validator.isNumeric(req.primaryParams.project_id))
    errors.project_id = 'Por favor ingrese el id de proyecto.';

  if (!req.primaryParams.channel_id || !validator.isNumeric(req.primaryParams.channel_id))
    errors.channel_id = 'Por favor ingrese el id de canal.';

  if (Object.keys(errors).length > 0)
    return res.status(400).json({ errors: errors });

  next();
};

/**
* validates if provided parameters to add a summary to a call are valid.
* @param  {http request}   req
* @param  {http request}   res
* @param  {Function} next
* @return {Function} next
 */
module.exports.validAddCallSummary = function(req, res, next){
  var errors = {};

  if (!req.primaryParams.project_id || !validator.isNumeric(req.primaryParams.project_id))
    errors.project_id = 'Por favor ingrese el id de proyecto.';

  if (!req.primaryParams.channel_id || !validator.isNumeric(req.primaryParams.channel_id))
    errors.channel_id = 'Por favor ingrese el id de canal.';

  if (!req.body.summary || req.body.summary.length === 0)
      errors.summary = 'Por favor ingrese una minuta valida.';

  if (Object.keys(errors).length > 0)
    return res.status(400).json({ errors: errors });

  next();
};

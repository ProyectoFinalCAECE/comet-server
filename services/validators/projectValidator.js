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
  if (!req.body.name ||
      !req.body.description)  {
        return res.status(400).json({ errors: { all: 'Por favor ingrese los parametros requeridos.'}});
  }
  next();
}

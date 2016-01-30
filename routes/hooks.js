"use strict";

/**

 * Module dependencies

 */
var express = require('express');
var hookService  = require('../services/hookService');
var router  = express.Router();
var winston = require('winston');
/*
*
*/
router.post('/:token', function(req, res, next) {
  try {
    var token = req.params.token;
    var integrationId = parseInt(req.query.integrationId);

    hookService.processHook(req, token, integrationId, function(result){
      return res.status(result.status).end();
    });

  }
  catch (e) {
    winston.info('##### HOOK error #####', e);
    return res.status(500).end();
  }
});

router.get('/:token', function(req, res, next) {
  try {
      return res.status(200).end();
  }
  catch (e) {
    winston.info('##### HOOK error #####', e);
    return res.status(500).end();
  }
});

module.exports = router;

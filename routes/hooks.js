"use strict";

/**

 * Module dependencies

 */
var models  = require('../models');
var express = require('express');
var hookService  = require('../services/hookService');
var router  = express.Router();
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
    console.log('##### HOOK error #####', e);
    return res.status(500).end();
  }
});

router.get('/:token', function(req, res, next) {
  try {
      return res.status(200).end();
  }
  catch (e) {
    console.log('##### HOOK error #####', e);
    return res.status(500).end();
  }
});

module.exports = router;

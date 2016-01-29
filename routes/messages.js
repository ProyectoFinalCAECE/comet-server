"use strict";

/**

 * Module dependencies

 */


var jwt = require('express-jwt');
var express = require('express');
var router  = express.Router();
var messagingService  = require('../services/messagingService');


// saves the unencrypted token in the 'payload' field of request
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

/*
* Get all Project's Channels information ordered by createdAt date showing the last created first.
* Requires authentication header.
* @project_id
*
*/
router.get('/', auth, function(req, res) {
  messagingService.retrieveMessages(req.primaryParams.channel_id, req.query.offset,
    req.query.limit, req.query.isDirect, req.payload._id, function(result){
    return res.status(result.code).json(result.message);
  });
});

/**
 * Retrieves direct or common channel's messages by id, and set of side messages too.
 * @param  {Integer} '/:id'
 * @param  {Function} auth
 * @return {List}
 */
router.get('/:id', auth, function(req, res) {
  messagingService.retrieveMessagesById(req.params.id, req.query.limit, req.query.direction,
    req.primaryParams.channel_id, req.primaryParams.project_id, function(result){
    return res.status(result.code).json(result.message);
  });
});

module.exports = router;

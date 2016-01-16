"use strict";

/**

* Module dependencies

*/


var jwt = require('express-jwt');
var models  = require('../models');
var express = require('express');
var router  = express.Router();
var integrationsService  = require('../services/integrationsService');
var integrationValidator  = require('../services/validators/integrationValidator');

// saves the unencrypted token in the 'payload' field of request
var auth = jwt({secret: 'mySecretPassword', userProperty: 'payload'});

/*
* Get available Integrations.
* Requires authentication header.
*
*/
router.get('/', auth, function(req, res) {

  //These validations can't be done at integrationsValidator.

  //If these parameters are detected, somebody is requesting for active integrations
  //or a certain project.
  if(req.primaryParams && req.primaryParams.project_id){
    models.User.findById(req.payload._id).then(function(user) {
      if(!user){
        return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
      }
      //look for active integrations of a certain project
      integrationsService.getActiveIntegrationsForProject(req.primaryParams.project_id, user, function(result){
        return res.status(result.code).json(result.message);
      });

    });

  } else {
    //If no parameters are detected, somebody is requesting for all the
    //available integrations at the system.
    integrationsService.getIntegrations(function(result){
      return res.status(result.code).json(result.message);
    });
  }
});

/*
* Update the state of an Integration of a Project.
* Requires authentication header.
* @active
*
*/
/*router.put('/:id', auth, integrationValidator.validUpdateProjectIntegration, function(req, res) {
  //If these parameters are detected, somebody is requesting to update the state of a certain integration
  //of a certain project.
  if(req.primaryParams && req.primaryParams.project_id){
    models.User.findById(req.payload._id).then(function(user) {
      if(!user){
        return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
      }
      //look for active integrations of a certain project
      integrationsService.updateProjectIntegrationActiveState(req.primaryParams.project_id, req.params.id, user, req.body.active ,function(result){
        return res.status(result.code).json(result.message);
      });
    });
  } else {

      //
      // SYSADMIN COULD BE TRYING TO DISABLE AN INTEGRATION FROM BEING CONFIGURED TO ANY PROJECT AT ALL.
      //
      return res.status(404).json('Requested Operation Not Found');
  }
});*/

/*
* Get Project Integration by Id.
* Requires authentication header.
*
*/
router.get('/:id', auth, function(req, res) {

    models.User.findById(req.payload._id).then(function(user) {
      if(!user){
        return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
      }

      integrationsService.getProjectIntegrationById(req.primaryParams.project_id, req.params.id, user, function(result){
        return res.status(result.code).json(result.message);
      });

    });
});

/*
* Create a specific XXX_Integration for ProjectId by ProjectIntegrationId.
* Requires authentication header.
* @projectId
* @projectIntegrationId
* @channelId
* @name
* @token
*
*/
router.post('/:id', auth, integrationValidator.validCreateProjectIntegration, function(req, res) {
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }

    integrationsService.createInstanceOfProjectIntegration(req.primaryParams.project_id,
      req.params.id, user, req.body, function(result){
        return res.status(result.code).json(result.message);
    });
  });
});

/*
* Update a specific XXX_Integration for ProjectId by ProjectIntegrationId.
* Requires authentication header.
* @projectId
* @projectIntegrationId
* @channelId
* @name
* @token
*
*/
router.put('/:id', auth, integrationValidator.validUpdateInstanceOfProjectIntegration, function(req, res) {
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }

    integrationsService.updateInstanceOfProjectIntegration(req.primaryParams.project_id,
      req.params.id, user, req.body, function(result){
        return res.status(result.code).json(result.message);
    });
  });
});


/*
* Remove a specific XXX_Integration for ProjectId by ProjectIntegrationId.
* Requires authentication header.
* @projectId
* @projectIntegrationId
* @channelId
* @name
* @token
*
*/
router.delete('/:id', auth, function(req, res) {
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }

    integrationsService.disableInstanceOfProjectIntegration(req.primaryParams.project_id,
      req.params.id, user, req.body, function(result){
        return res.status(result.code).json(result.message);
    });
  });
});

/*
* Endpoint to configure statuscake integration
*
*
*/
router.post('/statuscake/auth/:id', auth, function(req, res) {
  models.User.findById(req.payload._id).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }

    integrationsService.configurateStatusCakeIntegration(req.body.cakeUser,
      req.body.cakeToken, req.body.name, req.primaryParams.project_id,
      req.body.channelId, req.body.token, user, req.params.id, function(result){
        return res.status(result.code).json(result.message);
    });
  });
});

module.exports = router;

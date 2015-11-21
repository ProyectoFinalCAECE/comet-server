"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');


/*
* Get available Integrations.
*
* @callback
*
*/
module.exports.getIntegrations = function(callback) {
    var result = {};
    result.code = 404;
    result.message = { errors: { all: 'No se encontró ninguna Integración disponible.'}};

    var integrations_to_be_returned = [];

    models.Integration.findAll().then(function(integrations){
      if (integrations === undefined || integrations.length === 0) {
        return callback(result);
      }

      for(var x in integrations){
        integrations_to_be_returned.push(formatIntegration(integrations[x]));
      }

      result.code = 200;
      result.message = { integrations: integrations_to_be_returned };
      return callback(result);

    });
};

/*
* Get actve Integrations of provided Project.
*
* @project_id
* @user
* @callback
*
*/
module.exports.getActiveIntegrationsForProject = function(project_id, user, callback) {
  var result = {};
  result.code = 404;
  result.message = { errors: { all: 'No se encontró ninguna Integración disponible.'}};

  var integrations_to_be_returned = [];

  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', project_id, "B"] }).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      result.code = 404;
      result.message = { errors: { all: 'No se puede encontrar ningun proyecto con el id provisto.'}};
      callback(result);
    }

    if(projects[0].ProjectUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}};
      callback(result);
    } else {

      //look for active integrations
      projects[0].getIntegrations().then(function(integrations){
        for(var x in integrations){
          integrations_to_be_returned.push(formatIntegrationForProjects(integrations[x]));
        }

        result.code = 200;
        result.message = { integrations: integrations_to_be_returned };
        return callback(result);
      });
    }
  });
};

/*
* Update the state of an Integration of a Project.
*
* @project_id
* @integration_id
* @user
* @active
* @callback
*
*/
module.exports.updateProjectIntegrationActiveState = function(project_id, integration_id, user, active, callback) {
  var result = {};
  result.code = 404;
  result.message = { errors: { all: 'No se encontró ninguna Integración disponible.'}};

  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', project_id, "B"] }).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      result.code = 404;
      result.message = { errors: { all: 'No se puede encontrar ningun proyecto con el id provisto.'}};
      callback(result);
    }

    if(projects[0].ProjectUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}};
      callback(result);
    } else {
      if(projects[0].ProjectUser.isOwner === false){
        result.code = 403;
        result.message = { errors: { all: 'El usuario no puede realizar la operación solicitada.'}};
        callback(result);
      } else {

        //look for active integrations
        projects[0].getIntegrations({ where: ['"ProjectIntegration"."uid" = ?', integration_id] }).then(function(integrations){

          if (integrations === undefined || integrations.length === 0) {
            result.code = 404;
            result.message = { errors: { all: 'No se puede encontrar ninguna Integración con el id provisto.'}};
            callback(result);
          }

          integrations[0].ProjectIntegration.active = (active === 'true');

          integrations[0].ProjectIntegration.save().then(function(saved){
            result.code = 200;
            result.message = { integration: {
                                              integrationId: integrations[0].id,
                                              name: integrations[0].name,
                                              description: integrations[0].description,
                                              projectIntegrationId: saved.uid,
                                              active: saved.active
                                            }
                            };
            return callback(result);
            }
          );
        });
      }
    }
  });
};

/*
* Format a given Integration to match excepted output.
*/
function formatIntegration(raw_integration){
  return {
    id: raw_integration.id,
    name: raw_integration.name,
    description: raw_integration.description
  };
}

/*
* Format a given Integration to match excepted output.
*/
function formatIntegrationForProjects(raw_integration){
  return {
    integrationId: raw_integration.id,
    name: raw_integration.name,
    description: raw_integration.description,
    projectIntegrationId: raw_integration.ProjectIntegration.uid,
    active: raw_integration.ProjectIntegration.active
  };
}

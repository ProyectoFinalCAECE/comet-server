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
      return callback(result);
    }

    if(projects[0].ProjectUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}};
      return callback(result);
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
      return callback(result);
    }

    if(projects[0].ProjectUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}};
      return callback(result);
    } else {
      if(projects[0].ProjectUser.isOwner === false){
        result.code = 403;
        result.message = { errors: { all: 'El usuario no puede realizar la operación solicitada.'}};
        return callback(result);
      } else {

        projects[0].getIntegrations({ where: ['"ProjectIntegration"."uid" = ?', integration_id] }).then(function(integrations){

          if (integrations === undefined || integrations.length === 0) {
            result.code = 404;
            result.message = { errors: { all: 'No se puede encontrar ninguna Integración con el id provisto.'}};
            return callback(result);
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
* Get Project Integration by Id.
* @project_id
* @integration_id
* @user
* @callback
*
*/

module.exports.getProjectIntegrationById = function(project_id, integration_id, user, callback) {
  var result = {};
  result.code = 404;
  result.message = { errors: { all: 'No se encontró ninguna Integración disponible.'}};

  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', project_id, "B"] }).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      result.code = 404;
      result.message = { errors: { all: 'No se puede encontrar ningun proyecto con el id provisto.'}};
      return callback(result);
    }

    if(projects[0].ProjectUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}};
      return callback(result);
    } else {
      if(projects[0].ProjectUser.isOwner === false){
        result.code = 403;
        result.message = { errors: { all: 'El usuario no puede realizar la operación solicitada.'}};
        return callback(result);
      } else {

        projects[0].getIntegrations({ where: ['"ProjectIntegration"."uid" = ?', integration_id] }).then(function(integrations){

          if (integrations === undefined || integrations.length === 0) {
            result.code = 404;
            result.message = { errors: { all: 'No se puede encontrar ninguna Integración con el id provisto.'}};
            return callback(result);
          }

          result.code = 200;
          result.message = { integration: formatIntegrationForProjects(integrations[0]) };
          return callback(result);
        });
      }
    }
  });
};

/*
* Create a specific XXX_Integration for ProjectId by ProjectIntegrationId.
* @projectId
* @projectIntegrationId
* @channelId
* @name
* @token
*
*/
module.exports.createProjectIntegration = function(project_id, integration_id, user, request_body, callback) {
  var result = {};
  result.code = 404;
  result.message = { errors: { all: 'No se encontró ninguna Integración disponible.' } };

  //Looking for Project
  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', project_id, "B"], include: [{ model: models.Channel}]}).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      result.code = 404;
      result.message = { errors: { all: 'No se puede encontrar ningun proyecto con el id provisto.'}};
      return callback(result);
    }

    //If user is active at retrieved Project
    if(projects[0].ProjectUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}};
      return callback(result);
    } else {
      //If user is the owner of the Project
      if(projects[0].ProjectUser.isOwner === false){
        result.code = 403;
        result.message = { errors: { all: 'El usuario no puede realizar la operación solicitada.'}};
        return callback(result);
      } else {

        //Looking for Integration among retrieved Project's Integrations.
        projects[0].getIntegrations({ where: ['"ProjectIntegration"."uid" = ?', integration_id] }).then(function(integrations){
          if (integrations === undefined || integrations.length === 0) {
            result.code = 404;
            result.message = { errors: { all: 'No se puede encontrar ninguna Integración con el id provisto.'}};
            return callback(result);
          }

          //Looking for Channel among retrieved Project's Channels.
          projects[0].getChannels({ where: ['"Channel"."id" = ?', request_body.channelId ] }).then(function(channels){

            if (channels === undefined || channels.length === 0) {
              result.code = 404;
              result.message = { errors: { all: 'No se puede encontrar ningun Canal con el id provisto.'}};
              return callback(result);
            }

            switch (integrations[0].name) {
              case 'Dropbox': {
                result.code = 400;
                result.message = { errors: { all: 'La integracion provista no requiere de configuración.'}};
                return callback(result);
              }
              case 'Github': {
                //Checking if Tuple Project-Integration-Channel does not exist already.
                models.GithubIntegration.findAll({ where: ['"GithubIntegration"."ProjectIntegrationUid" = ? AND "GithubIntegration"."ChannelId" = ?',
                                                  integration_id, request_body.channelId ] }).then(function(project_integrations){

                  if(project_integrations !== undefined && project_integrations.length > 0){
                    result.code = 401;
                    result.message = { errors: { all: 'Ya hay una configuracion para el Proyecto, Integración y Canal provistos.'}};
                    return callback(result);
                  }

                  //New GithubIntegration instance.
                  var githubIntegration = models.GithubIntegration.build({
                    name: request_body.name,
                    token: request_body.token,
                    active: true
                  });

                  //Adding Channel to GithubIntegration instance.
                  githubIntegration.ChannelId = channels[0].id;

                  //Adding ProjectIntegration to githubIntegration instance.
                  githubIntegration.ProjectIntegrationUid = integration_id;

                  //Saving GithubIntegration instance.
                  githubIntegration.save().then(function(){
                    result.code = 200;
                    result.message = { githubIntegration: {
                                                            id: githubIntegration.id,
                                                            name: githubIntegration.name,
                                                            active: githubIntegration.active,
                                                            token: githubIntegration.token,
                                                            channelId: githubIntegration.ChannelId,
                                                            ProjectIntegrationId: githubIntegration.ProjectIntegrationUid
                                                          }
                                    };
                    return callback(result);
                  });
                });
                break;
              }
              case 'Trello': {
                result.code = 404;
                result.message = { errors: { all: 'La integración requerida aún no puede ser configurada.'}};
                return callback(result);
              }
              case 'PingDom': {
                result.code = 404;
                result.message = { errors: { all: 'La integración requerida aún no puede ser configurada.'}};
                return callback(result);
              }
            }
          });
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

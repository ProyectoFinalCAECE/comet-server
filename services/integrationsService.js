"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "development";
var config    = require(__dirname + '/../config/sequelize.json')[env];
var sequelize = new Sequelize(config.database, config.username, config.password, {    "username": "postgres",
  "password": "123456789",
  "database": "comet",
  "host": "127.0.0.1",
  "dialect": "postgres",
  "define": {
    "updatedAt": "updatedAt",
    "createdAt": "createdAt"},
                                                                                    "pool": {
                                                                                      "max": 10,
                                                                                      "min": 1,
                                                                                      "idle": 10000
                                                                                    }
                                                                                });

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
      sequelize.query('SELECT "PI".uid as "PIuid", "PI".active as "PIactive", "PI"."IntegrationId", ' +
                      ' "I".name as "Iname", "I".description as "Idescription", "I".active as "Iactive" ' +
                      ' FROM "ProjectIntegrations" AS "PI" ' +
                      ' JOIN "Integrations" AS "I" ' +
                      ' ON "I".id = "PI"."IntegrationId" ' +
                      ' WHERE "PI"."ProjectId" = ?',
                      { type: sequelize.QueryTypes.SELECT,
                        replacements: [project_id]})
      .then(function(fullProjectIntegrations) {

        for(var x in fullProjectIntegrations){
          integrations_to_be_returned.push(formatIntegrationForProjectsFromQuery(fullProjectIntegrations[x]));
        }

        //looking for github puid among the integrations obtained
        var githubPuid = obtainGithubPuidFromIntegrationsToBeReturned(integrations_to_be_returned);

        sequelize.query('SELECT "GI".id as "GIid", "GI".name as "GIname", "GI".token as "GItoken" ,' +
                      ' "GI"."ChannelId" as "GIChannelId", "GI".active as "GIactive", ' +
                      ' "GI"."createdAt" as "GIcreatedAt", "GI"."updatedAt" as "GIupdatedAt", ' +
                      ' "GI"."ProjectIntegrationUid" as "GIProjectIntegrationUid" ' +
                      ' FROM "GithubIntegrations" AS "GI" ' +
                      ' WHERE "GI"."ProjectIntegrationUid" = ?' +
                      ' AND "GI".active = true',
                        { type: sequelize.QueryTypes.SELECT,
                          replacements: [githubPuid]})
        .then(function(githubDetails) {

          //adding configurations details to github integration
          addGithubDetailsToIntegrationsToBeReturned(integrations_to_be_returned, githubDetails);

          //looking for trello puid among the integrations obtained
          var trelloPuid = obtainTrelloPuidFromIntegrationsToBeReturned(integrations_to_be_returned);

          sequelize.query('SELECT "TI".id as "TIid", "TI".name as "TIname", "TI".token as "TItoken" ,' +
                        ' "TI"."ChannelId" as "TIChannelId", "TI".active as "TIactive", ' +
                        ' "TI"."createdAt" as "TIcreatedAt", "TI"."updatedAt" as "TIupdatedAt", ' +
                        ' "TI"."ProjectIntegrationUid" as "TIProjectIntegrationUid" ' +
                        ' FROM "TrelloIntegrations" AS "TI" ' +
                        ' WHERE "TI"."ProjectIntegrationUid" = ?' +
                        ' AND "TI".active = true',
                          { type: sequelize.QueryTypes.SELECT,
                            replacements: [trelloPuid]})
          .then(function(trelloDetails) {

            //adding configurations details to Trello integration
            addTrelloDetailsToIntegrationsToBeReturned(integrations_to_be_returned, trelloDetails);

            result.code = 200;
            result.message = { integrations: integrations_to_be_returned };
            return callback(result);
          });
        });
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

          switch (integrations[0].name) {
            case 'Github': {
              integrations[0].ProjectIntegration.getGithubIntegrations().then(function(github_integrations){
                result.code = 200;
                result.message = { integration: formatIntegrationForProjects(integrations[0], github_integrations) };
                return callback(result);
              });
              break;
            }
            case 'Trello': {
              integrations[0].ProjectIntegration.getTrelloIntegrations().then(function(trello_integrations){
                result.code = 200;
                result.message = { integration: formatIntegrationForProjects(integrations[0], trello_integrations) };
                return callback(result);
              });
              break;
            }
            case 'PingDom': {
              result.code = 200;
              result.message = { integration: formatIntegrationForProjects(integrations[0]) };
              return callback(result);
            }
          }
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
module.exports.createInstanceOfProjectIntegration = function(project_id, integration_id, user, request_body, callback) {
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
                //Checking if Tuple Project-Integration-Channel does not exist already.
                models.TrelloIntegration.findAll({ where: ['"TrelloIntegration"."ProjectIntegrationUid" = ? AND "TrelloIntegration"."ChannelId" = ?',
                                                  integration_id, request_body.channelId ] }).then(function(project_integrations){

                  if(project_integrations !== undefined && project_integrations.length > 0){
                    result.code = 401;
                    result.message = { errors: { all: 'Ya hay una configuracion para el Proyecto, Integración y Canal provistos.'}};
                    return callback(result);
                  }

                  //New TrelloIntegration instance.
                  var trelloIntegration = models.TrelloIntegration.build({
                    name: request_body.name,
                    token: request_body.token,
                    active: true
                  });

                  //Adding Channel to TrelloIntegration instance.
                  trelloIntegration.ChannelId = channels[0].id;

                  //Adding ProjectIntegration to TrelloIntegration instance.
                  trelloIntegration.ProjectIntegrationUid = integration_id;

                  //Saving GithubIntegration instance.
                  trelloIntegration.save().then(function(){
                    result.code = 200;
                    result.message = { trelloIntegration: {
                                                            id: trelloIntegration.id,
                                                            name: trelloIntegration.name,
                                                            active: trelloIntegration.active,
                                                            token: trelloIntegration.token,
                                                            channelId: trelloIntegration.ChannelId,
                                                            ProjectIntegrationId: trelloIntegration.ProjectIntegrationUid
                                                          }
                                    };
                    return callback(result);
                  });

                });
                break;
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
* Disable a specific XXX_Integration for ProjectId by ProjectIntegrationId.
* @projectId
* @projectIntegrationId
* @channelId
* @name
* @token
*
*/
module.exports.disableInstanceOfProjectIntegration = function(project_id, integration_id, user, request_body, callback) {
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
              case 'Github': {
                //Checking if Tuple Project-Integration-Channel does not exist already.
                models.GithubIntegration.findAll({ where: ['"GithubIntegration"."ProjectIntegrationUid" = ? AND "GithubIntegration"."ChannelId" = ?',
                                                  integration_id, request_body.channelId ] }).then(function(project_integrations){

                  if(project_integrations === undefined || project_integrations.length === 0){
                    result.code = 401;
                    result.message = { errors: { all: 'No se encontró una configuracion para el Proyecto, Integración y Canal provistos.'}};
                    return callback(result);
                  }

                  project_integrations[0].active = false;

                  //Saving GithubIntegration instance.
                  project_integrations[0].save().then(function(){
                    result.code = 200;
                    result.message = { githubIntegration: {
                                                            id: project_integrations[0].id,
                                                            name: project_integrations[0].name,
                                                            active: project_integrations[0].active,
                                                            token: project_integrations[0].token,
                                                            channelId: project_integrations[0].ChannelId,
                                                            ProjectIntegrationId: project_integrations[0].ProjectIntegrationUid
                                                          }
                                    };
                    return callback(result);
                  });
                });
                break;
              }
              case 'Trello': {
                //Checking if Tuple Project-Integration-Channel does not exist already.
                models.TrelloIntegration.findAll({ where: ['"TrelloIntegration"."ProjectIntegrationUid" = ? AND "TrelloIntegration"."ChannelId" = ?',
                                                  integration_id, request_body.channelId ] }).then(function(project_integrations){

                  if(project_integrations === undefined || project_integrations.length === 0){
                    result.code = 401;
                    result.message = { errors: { all: 'No se encontró una configuracion para el Proyecto, Integración y Canal provistos.'}};
                    return callback(result);
                  }

                  project_integrations[0].active = false;

                  //Saving TrelloIntegration instance.
                  project_integrations[0].save().then(function(){
                    result.code = 200;
                    result.message = { trelloIntegration: {
                                                            id: project_integrations[0].id,
                                                            name: project_integrations[0].name,
                                                            active: project_integrations[0].active,
                                                            token: project_integrations[0].token,
                                                            channelId: project_integrations[0].ChannelId,
                                                            ProjectIntegrationId: project_integrations[0].ProjectIntegrationUid
                                                          }
                                    };
                    return callback(result);
                  });
                });
                break;
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
* Update a specific XXX_Integration for ProjectId by ProjectIntegrationId.
* @projectId
* @projectIntegrationId
* @channelId
* @name
* @token
*
*/
module.exports.updateInstanceOfProjectIntegration = function(project_id, integration_id, user, request_body, callback) {
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
              case 'Github': {
                //Checking if Tuple Project-Integration-Channel does not exist already.
                models.GithubIntegration.findAll({ where: ['"GithubIntegration"."ProjectIntegrationUid" = ? AND "GithubIntegration"."ChannelId" = ?',
                                                  integration_id, request_body.channelId ] }).then(function(project_integrations){

                  if(project_integrations === undefined || project_integrations.length === 0){
                    result.code = 401;
                    result.message = { errors: { all: 'No se encontró una configuracion para el Proyecto, Integración y Canal provistos.'}};
                    return callback(result);
                  }

                  //Updating name
                  if(request_body.name &&
                    request_body.name.length > 0){
                        project_integrations[0].name = request_body.name;
                  }

                  //Updating token
                  if(request_body.token &&
                    request_body.token.length > 0){
                        project_integrations[0].token = request_body.token;
                  }

                  //Updating active
                  if(request_body.active){
                        project_integrations[0].active = request_body.active;
                  }

                  //Updating Channel
                  if(request_body.newChannelId){
                    project_integrations[0].ChannelId = request_body.newChannelId;
                  }


                  //Saving GithubIntegration instance.
                  project_integrations[0].save().then(function(){
                    result.code = 200;
                    result.message = { githubIntegration: {
                                                            id: project_integrations[0].id,
                                                            name: project_integrations[0].name,
                                                            active: project_integrations[0].active,
                                                            token: project_integrations[0].token,
                                                            channelId: project_integrations[0].ChannelId,
                                                            ProjectIntegrationId: project_integrations[0].ProjectIntegrationUid
                                                          }
                                    };
                    return callback(result);
                  });
                });
                break;
              }
              case 'Trello': {
                //Checking if Tuple Project-Integration-Channel does not exist already.
                models.TrelloIntegration.findAll({ where: ['"TrelloIntegration"."ProjectIntegrationUid" = ? AND "TrelloIntegration"."ChannelId" = ?',
                                                  integration_id, request_body.channelId ] }).then(function(project_integrations){

                  if(project_integrations === undefined || project_integrations.length === 0){
                    result.code = 401;
                    result.message = { errors: { all: 'No se encontró una configuracion para el Proyecto, Integración y Canal provistos.'}};
                    return callback(result);
                  }

                  //Updating name
                  if(request_body.name &&
                    request_body.name.length > 0){
                        project_integrations[0].name = request_body.name;
                  }

                  //Updating token
                  if(request_body.token &&
                    request_body.token.length > 0){
                        project_integrations[0].token = request_body.token;
                  }

                  //Updating active
                  if(request_body.active){
                        project_integrations[0].active = request_body.active;
                  }

                  //Updating Channel
                  if(request_body.newChannelId){
                    project_integrations[0].ChannelId = request_body.newChannelId;
                  }


                  //Saving TrelloIntegration instance.
                  project_integrations[0].save().then(function(){
                    result.code = 200;
                    result.message = { trelloIntegration: {
                                                            id: project_integrations[0].id,
                                                            name: project_integrations[0].name,
                                                            active: project_integrations[0].active,
                                                            token: project_integrations[0].token,
                                                            channelId: project_integrations[0].ChannelId,
                                                            ProjectIntegrationId: project_integrations[0].ProjectIntegrationUid
                                                          }
                                    };
                    return callback(result);
                  });
                });
                break;
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
function formatIntegrationForProjects(raw_integration, collection){
  var response = {
    projectIntegrationId: raw_integration.ProjectIntegration.uid,
    integrationId: raw_integration.id,
    name: raw_integration.name,
    description: raw_integration.description,
    active: raw_integration.ProjectIntegration.active
  };

  if(collection !== null &&
    collection !== undefined &&
    collection.length > 0){
      var configurations = [];
      for(var x in collection ){
        configurations.push(JSON.parse(JSON.stringify(collection[x])));
      }
      response.configurations = configurations;
  }

  return response;
}

function formatIntegrationForProjectsFromQuery(raw_row){
  var response = {
    projectIntegrationId: raw_row.PIuid,
    integrationId: raw_row.IntegrationId,
    name: raw_row.Iname,
    description: raw_row.Idescription,
    active: raw_row.Iactive
  };
  return response;
}

/*
* Retrieve Github Puid from integrations found.
*/
function obtainGithubPuidFromIntegrationsToBeReturned(integrations_to_be_returned){
  for(var x in integrations_to_be_returned){
    if(integrations_to_be_returned[x].name === "Github"){
      return integrations_to_be_returned[x].projectIntegrationId;
    }
  }
}

/*
* Retrieve Trello Puid from integrations found.
*/
function obtainTrelloPuidFromIntegrationsToBeReturned(integrations_to_be_returned){
  for(var x in integrations_to_be_returned){
    if(integrations_to_be_returned[x].name === "Trello"){
      return integrations_to_be_returned[x].projectIntegrationId;
    }
  }
}


function addGithubDetailsToIntegrationsToBeReturned(integrations_to_be_returned, githubDetails){
  var configurations = [];

  for(var x in githubDetails){
    configurations.push({
      id: githubDetails[x].GIid,
      name: githubDetails[x].GIname,
      token: githubDetails[x].GItoken,
      active: githubDetails[x].GIactive,
      createdAt: githubDetails[x].GIcreatedAt,
      updatedAt: githubDetails[x].GIupdatedAt,
      ProjectIntegrationUid: githubDetails[x].PIuid,
      ChannelId: githubDetails[x].GIChannelId,
    });
  }

  for(var y in integrations_to_be_returned){
    if(integrations_to_be_returned[y].name === "Github"){
      integrations_to_be_returned[y].configurations = configurations;
      break;
    }
  }
}

function addTrelloDetailsToIntegrationsToBeReturned(integrations_to_be_returned, trelloDetails){
  var configurations = [];

  for(var x in trelloDetails){
    configurations.push({
      id: trelloDetails[x].TIid,
      name: trelloDetails[x].TIname,
      token: trelloDetails[x].TItoken,
      active: trelloDetails[x].TIactive,
      createdAt: trelloDetails[x].TIcreatedAt,
      updatedAt: trelloDetails[x].TIupdatedAt,
      ProjectIntegrationUid: trelloDetails[x].TIuid,
      ChannelId: trelloDetails[x].TIChannelId,
    });
  }

  for(var y in integrations_to_be_returned){
    if(integrations_to_be_returned[y].name === "Trello"){
      integrations_to_be_returned[y].configurations = configurations;
      break;
    }
  }
}

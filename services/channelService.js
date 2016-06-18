"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "development";
var config    = require(__dirname + '/../config/sequelize.json')[env];
var socket = require('../lib/socket');
var async = require('async');

/*
* Create new Channel and and associates project members if provided.
*
* @user
* @project_id
* @channel_name
* @channel_description
* @channel_type
*
*/

module.exports.createChannel = function(user, req, res) {
  if(!user.confirmed){
    return res.status(403).json({ errors: { all: 'El usuario debe confirmar su cuenta para realizar la acción solicitada.'}});
  } else {
    user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', req.primaryParams.project_id, "B"], include: [{ model: models.User}] }).then(function(projects){
      if (projects === undefined || projects.length === 0) {
        return res.status(404).json({ errors: { all: 'No se puede encontrar ningun proyecto con el id provisto.'}});
      }

      if(projects[0].state === 'C'){
        return res.status(403).json({ errors: { all: 'No pueden crearse canales en proyectos cerrados.'}});
      }else{
        if(projects[0].ProjectUser.active === false){
          return res.status(403).json({ errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}});
        } else {
          // create new Channel instance
          var channel = models.Channel.build({
            name: req.body.name,
            description: req.body.description,
            type: req.body.type,
            ProjectId: req.primaryParams.project_id,
            lastActivity: new Date()
          });

          channel.save().then(function(channelCreated) {
            user.addChannel(channel, {active: true}).then(function(){
              user.save().then(function() {
                // Channel created successfully

                //associating members if provided
                associateMembers(req.body.members, channel, projects[0].Users, function(){
                  //look for members
                  channel.getUsers().then(function(users){

                    var data = {
                      type: 1,
                      date: new Date().getTime(),
                      projectId: projects[0].id,
                      projectName: projects[0].name,
                      userId: user.id,
                      alias: (user.alias === null || user.alias === undefined) ? '' : user.alias,
                      channelId:channel.id,
                      channelName: channel.name
                    };

                    socket.systemEmit(projects[0].id, data);

                    return res.json(getChannelFromHash(channelCreated, users));
                  });
                });
              });
            });
          });
        }
      }
    });
  }
};

/*
* Get Channel information by id
*
* @user
* @req
* @res
*
*/
module.exports.getChannel = function(req, res, user) {
  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', req.primaryParams.project_id, "B"] }).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      return res.status(404).json({ errors: { all: 'No se puede encontrar ningun proyecto con el id provisto.'}});
    }

    if(projects[0].ProjectUser.active === false){
      return res.status(403).json({ errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}});
    } else {
      models.Channel.findAll({ where: ['"Channel"."id" = ? AND "Channel"."ProjectId" = ? AND "Channel"."state" != ?', req.params.id ,req.primaryParams.project_id, "B"],
                              include: [{ model: models.User}]}).then(function(channels){
        if (channels === undefined || channels.length === 0) {
          return res.status(404).json({ errors: { all: 'No se puede encontrar ningun canal con el id provisto.'}});
        }

        var channelUser = findChannelUser(channels[0].Users, user.id);

        if(channels[0].type === 'S' || (channelUser && channelUser.ChannelUser.active === true)){
          var response = getChannelFromHash(channels[0], channels[0].Users);

          //default 'disconnectedAt'
          response.disconnectedAt = null;

          //in case of 'shared' channel, 'channelUser' could not exist.
          if(channelUser !== undefined){
            response.disconnectedAt = channelUser.ChannelUser.disconnectedAt;
          }

          return res.json(response);
        } else {
          return res.status(403).json({ errors: { all: 'El usuario no puede acceder al canal solicitado.'}});
        }
      });
    }
  });
};

/*
* Get Project's channels information
*
* @user
* @req
* @res
*
*/
module.exports.getChannels = function(req, res, user) {
  var channels_to_be_returned = [];
  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', req.primaryParams.project_id, "B"] }).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      return res.status(404).json({ errors: { all: 'No se puede encontrar ningun proyecto con el id provisto.'}});
    }

    if(projects[0].ProjectUser.active === false){
      return res.status(403).json({ errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}});
    } else {
      models.Channel.findAll({ where: ['"Channel"."ProjectId" = ? AND "Channel"."state" != ?', req.primaryParams.project_id, "B"],
                              include: [{ model: models.User}],
                              order: [['createdAt', 'DESC']]}).then(function(channels){
        //creating response
        var x;
        for (x in channels) {
          //filtering channels user is not assigned anymore
          if(channels[x].type === 'S') {
              channels_to_be_returned.push(getChannelFromHash(channels[x], channels[x].Users));
          } else {
            var channel_members_ids = getActiveUsersIds(channels[x].Users);
            if((channel_members_ids.indexOf(user.id)) > -1){
              channels_to_be_returned.push(getChannelFromHash(channels[x], channels[x].Users));
            }
          }
        }
        return res.json(channels_to_be_returned);
      });
    }
  });
};

/*
*
* Adds new Channel members basing on provided ids.
* @members
* @project_id
* @channel_id
* @user
* @callback
*
*/
module.exports.addMembersBulk = function(members, project_id, channel_id, user, callback) {
  var result = {};
  models.Channel.findAll({ where: ['"Channel"."id" = ? AND "Channel"."ProjectId" = ? AND "Channel"."state" != ?', channel_id , project_id, "B"],
                          include: [{ model: models.User}]}).then(function(channels){
                            if (channels === undefined || channels.length === 0) {
                              result.code = 404;
                              result.message = { errors: { all: 'No se puede encontrar ningun canal con el id provisto.'}};
                              return callback(result);
                            }

                            var channel_members_ids = getActiveUsersIds(channels[0].Users);

                            //checking that current logged user can perform this action.
                            if((channel_members_ids.indexOf(user.id) === -1) && (user.id !== parseInt(members[0].id))){
                              result.code = 403;
                              result.message = { errors: { all: 'El usuario no puede acceder al canal solicitado.'}};
                              return callback(result);
                            } else {

                              //associating members if provided
                              models.Project.findById(project_id, {include: [{ model: models.User}] }).then(function(project){
                                associateMembers(members, channels[0], project.Users, function(){
                                  //look for members again to get new ones
                                  channels[0].getUsers().then(function(users){
                                    result.code = 200;
                                    result.message = getChannelFromHash(channels[0], users);
                                    return callback(result);
                                  });
                                });
                              });
                            }
                          });
};

/*
* Removes a member from a Private Channel.
* @project_id
* @channel_id
* @member_id
* @user
* @callback
*
*/
module.exports.removeChannelMember = function(project_id, channel_id, member_id, user, callback) {
  var result = {};
  models.Channel.findAll({ where: ['"Channel"."id" = ? AND "Channel"."ProjectId" = ? AND "Channel"."state" != ?', channel_id , project_id, "B"],
                          include: [{ model: models.User}]}).then(function(channels){
                            if (channels === undefined || channels.length === 0) {
                              result.code = 404;
                              result.message = { errors: { all: 'No se puede encontrar ningun canal con el id provisto.'}};
                              return callback(result);
                            }

                            var channel_members_ids = getActiveUsersIds(channels[0].Users);

                            //checking that current logged user can perform this action.
                            if(channel_members_ids.indexOf(user.id) === -1){
                              result.code = 403;
                              result.message = { errors: { all: 'El usuario no puede acceder al canal solicitado.'}};
                              return callback(result);
                            } else {
                              var user_to_remove = findChannelUser(channels[0].Users, parseInt(member_id));
                              if(user_to_remove && user_to_remove.ChannelUser.active === true) {
                                user_to_remove.ChannelUser.active = false;
                                user_to_remove.ChannelUser.severedAt = new Date().getTime();
                                user_to_remove.ChannelUser.save().then(function(){
                                  result.code = 200;
                                  result.message = { all: 'El miembro ha sido eliminado exitosamente del canal.' };
                                  return callback(result);
                                });
                              } else {
                                result.code = 404;
                                result.message = { errors: { all: 'El miembro que desea eliminar no forma parte del canal o ha sido eliminado previamente.'}};
                                return callback(result);
                              }
                            }
                          });
};

/*
*
* Deletes a Project's Channel
* @project_id
* @channel_id
* @user
* @callback
*
*/
module.exports.deleteChannel = function(project_id, channel_id, user, callback) {
  var result = {};
  user.getChannels({ where: ['"ChannelUser"."ChannelId" = ? AND "Channel"."state" != ? AND "Channel"."ProjectId" = ?', channel_id, "B", project_id] }).then(function(channels){
    if (channels === undefined || channels.length === 0) {
      result.code = 404;
      result.message = { errors: { all: 'No se puede encontrar ningun canal con el id provisto.'}};
      return callback(result);
    }

    if(channels[0].ChannelUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al canal solicitado.'}};
      return callback(result);
    } else {
      //deleting channel
      channels[0].block(user.id);

      //deactivating channel's integrations (async)
      deactivateIntegrations(channels[0].id);

      channels[0].save().then(function(){
        result.code = 200;
        result.message = {};
        return callback(result);
      });
    }
  });
};

/*
*
* Closes a Project's Channel
* @project_id
* @channel_id
* @user
* @callback
*
*/
module.exports.closeChannel = function(project_id, channel_id, user, callback) {
  var result = {};
  user.getChannels({ where: ['"ChannelUser"."ChannelId" = ? AND "Channel"."state" != ? AND "Channel"."ProjectId" = ?', channel_id, "B", project_id], include: [{ model: models.Project }] }).then(function(channels){
    if (channels === undefined || channels.length === 0) {
      result.code = 404;
      result.message = { errors: { all: 'No se puede encontrar ningun canal con el id provisto.'}};
      return callback(result);
    }

    if(channels[0].ChannelUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al canal solicitado.'}};
      return callback(result);
    } else {
      //deleting channel
      channels[0].close(user.id);

      //deactivating channel's integrations (async)
      deactivateIntegrations(channels[0].id);

      channels[0].save().then(function(){

        var data = {
          type: 2,
          date: new Date().getTime(),
          projectId: project_id,
          projectName: channels[0].Project.name,
          userId: user.id,
          alias: (user.alias === null || user.alias === undefined) ? '' : user.alias,
          channelId: channels[0].id,
          channelName: channels[0].name
        };

        socket.systemEmit(project_id, data);

        result.code = 200;
        result.message = {};
        return callback(result);
      });
    }
  });
};

function deactivateIntegrations(channelId){

  //deactivating GithubIntegrations
  models.GithubIntegration.findAll({ where: ['"ChannelId" = ?', channelId]}).then(function(github_integrations){
    if (github_integrations !== undefined || github_integrations.length > 0) {

      //for each user, call saveUserToCache function.
      async.each(github_integrations, deactivateIntegration, function(err){
        if(err)
          throw new Error(err);
      });
    }
  });


  //deactivating TrelloIntegrations
  models.TrelloIntegration.findAll({ where: ['"ChannelId" = ?', channelId]}).then(function(trello_integrations){
    if (trello_integrations !== undefined || trello_integrations.length > 0) {

      //for each user, call saveUserToCache function.
      async.each(trello_integrations, deactivateIntegration, function(err){
        if(err)
          throw new Error(err);
      });
    }
  });
  //deactivating StatusCake
  models.StatusCakeIntegration.findAll({ where: ['"ChannelId" = ?', channelId]}).then(function(statuscake_integrations){
    if (statuscake_integrations !== undefined || statuscake_integrations.length > 0) {

      //for each user, call saveUserToCache function.
      async.each(statuscake_integrations, deactivateIntegration, function(err){
        if(err)
          throw new Error(err);
      });
    }
  });
}

/**
 * deactivate provided integration
 * @param  integration
 * @param  Function callback
 * @return Function callback
 */
function deactivateIntegration(integration, callback){
  integration.active = false;
  integration.save(function(){
    callback();
  });
}

/*
* Allows Channel's Member to update Channel's properties.
* @project_id
* @id
* @name
* @type
* @description
*
*/
module.exports.updateChannel = function(body, project_id, channel_id, user, callback) {
  var result = {};
  user.getChannels({ where: ['"ChannelUser"."ChannelId" = ? AND "Channel"."state" != ?', channel_id, "B"], include: [{ model: models.User }, { model: models.Project }] }).then(function(channels){
    if (channels === undefined || channels.length === 0) {
      result.code = 404;
      result.message = { errors: { all: 'No se puede encontrar ningun canal con el id provisto.'}};
      return callback(result);
    }

    if(channels[0].ChannelUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al canal solicitado.'}};
      return callback(result);
    } else {
      //updating channel
        if (body.name) {
          channels[0].name = body.name;
        }
        if (body.description) {
          channels[0].description = body.description;
        }
        if (body.type) {
          channels[0].type = body.type;
        }

        channels[0].save().then(function(){

          //sending 'system' notifications.
          var data = {
            type: 6,
            date: new Date().getTime(),
            projectId: channels[0].Project.id,
            channelId: channels[0].id,
            channelName: channels[0].name,
            channelDescription: channels[0].description,
            channelType: channels[0].type,
            userId: user.id,
            alias: (user.alias === null || user.alias === undefined) ? '' : user.alias
          };

          socket.systemEmit(channels[0].Project.id, data);

          result.code = 200;
          result.message = getChannelFromHash(channels[0], channels[0].Users);
          return callback(result);
        });
    }
});
};

/*
* Given a channel id, returns a list of channel's active members
* @id
*
*/
module.exports.getChannelActiveMembers = function(channel_id, callback) {
  var members = {};
  models.Channel.findAll({ where: ['"Channel"."id" = ? AND "Channel"."state" != ?', channel_id, "B"],
                          include: [{ model: models.User}]}).then(function(channels){
                            if (channels === undefined || channels.length === 0) {
                              return callback(members);
                            }

                            members = getActiveUsersIds(channels[0].Users);
                            return callback(members);
                          });
};

/*
* Given a set of Users of a Channel, returns those which are active in a certain format.
* @users
*
*/
function getChannelMembers(users){
  var users_to_be_returned = [];
  var y;
  for (y in users) {
    if(users[y].ChannelUser.active === true){
      users_to_be_returned.push({
                                id: users[y].id,
                                email: users[y].email,
                                profilePicture: users[y].profilePicture,
                                firstName: users[y].firstName,
                                lastName: users[y].lastName,
                                fullName: users[y].firstName + ' ' + users[y].lastName,
                                alias: users[y].alias,
                                createdAt:users[y].createdAt
                              });
    }
  }
  return users_to_be_returned;
}

/*
* Given a set of User IDs, associates them to channel if they exist in project
* @members
* @channel
* @project
*
*/
function associateMembers(members, channel, projectUsers, callback){
  var inactive_users = getInactiveUsersIds(channel.Users);

  //adding new users to the channel and updating once exitent ones.
  if(members){
    var x;
    var project_users_ids = getUsersIds(projectUsers);
    var channel_users_to_create = [];

    var sequelize = new Sequelize(config.database, config.username, config.password, config);

    for(x in members){
      if(project_users_ids.indexOf(parseInt(members[x].id)) > -1){
        //memeber existed once. must update row
        if(inactive_users.indexOf(parseInt(members[x].id)) > -1){
          sequelize.query('UPDATE "ChannelUsers" SET active = TRUE WHERE "UserId" = ? and "ChannelId" = ?',
                          { replacements: [members[x].id, channel.id], type: sequelize.QueryTypes.SELECT } ).spread();
        } else {
          channel_users_to_create.push({ active: 'true', ChannelId: channel.id, UserId: parseInt(members[x].id) });
        }
      }
    }
    sequelize = null;

    if(channel_users_to_create.length > 0){
      models.ChannelUser.bulkCreate(channel_users_to_create).then(function() {
        return true;
      });
    }
  }
  callback();
}

/*
*Given a set of Users, returns an array containing its ids.
*
*/
function getUsersIds(projectUsers){
    var ids_to_be_returned = [];
    if(projectUsers){
      var y;
      for(y in projectUsers){
        ids_to_be_returned.push(projectUsers[y].id);
      }
    }
    return ids_to_be_returned;
}

/*
*Given a set of Users, returns an array containing its ids if they're active for the channel.
*
*/
function getActiveUsersIds(channel_members){
  var ids_to_be_returned = [];
  if(channel_members){
    var y;
    for(y in channel_members){
      if(channel_members[y].ChannelUser.active === true){
        ids_to_be_returned.push(channel_members[y].id);
      }
    }
  }
  return ids_to_be_returned;
}

/*
*Given a set of Users, returns an array containing its ids if they're inactive for the channel.
*
*/
function getInactiveUsersIds(channel_members){
  var ids_to_be_returned = [];
  if(channel_members){
    var y;
    for(y in channel_members){
      if(channel_members[y].ChannelUser.active === false){
        ids_to_be_returned.push(channel_members[y].id);
      }
    }
  }
  return ids_to_be_returned;
}

/*
*Given a set of Users, returns the one whose id is equal to the provided one
*
*/
function findChannelUser(channel_users, current_user_id){
  if(channel_users){
    var y;
    for(y in channel_users){
      if(channel_users[y].id === current_user_id){
        return channel_users[y];
      }
    }
  }else{
    return null;
  }
}

/*
* Given a channel hash and a set of users, returns a hash for the service response.
* @channel_hash
* @users
*
*/
function getChannelFromHash(channel_hash, users){
  var channel = {};
  if(channel_hash !== undefined){
    channel = {
                    id: channel_hash.id,
                    name: channel_hash.name,
                    description: channel_hash.description,
                    createdAt: channel_hash.createdAt,
                    closedAt: channel_hash.closedAt,
                    type: channel_hash.type,
                    state: channel_hash.state,
                    members: getChannelMembers(users),
                    integrations: [],
                    lastActivity: channel_hash.lastActivity
              };
  }
  return channel;
}

"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');

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
  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', req.primaryParams.project_id, "B"], include: [{ model: models.User}] }).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      return res.status(404).json({ errors: { all: 'No se puede encontrar ningun proyecto con el id provisto.'}});
    }

    if(projects[0].ProjectUser.active === false){
      return res.status(403).json({ errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}});
    } else {
      // create new Channel instance
      var channel = models.Channel.build({
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        ProjectId: req.primaryParams.project_id
      });

      channel.save().then(function(channelCreated) {
        user.addChannel(channel, {active: true}).then(function(){
          user.save().then(function() {
            // Channel created successfully

            //associating members if provided
            associateMembers(req.body.members, channel, projects[0].Users, function(){
              //look for members
              channel.getUsers().then(function(users){

                return res.json({
                                  id: channelCreated.id,
                                  name: channelCreated.name,
                                  description: channelCreated.description,
                                  createdAt: channelCreated.createdAt,
                                  type: channelCreated.type,
                                  state: channelCreated.state,
                                  members:  getChannelMembers(users),
                                  integrations: []
                                });
              });
            });
          });
        });
      });
    }
  });
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

                                if(channels[0].type === 'S'){

                                  return res.json({
                                                    id: channels[0].id,
                                                    name: channels[0].name,
                                                    description: channels[0].description,
                                                    createdAt: channels[0].createdAt,
                                                    type: channels[0].type,
                                                    state: channels[0].state,
                                                    members: getChannelMembers(channels[0].Users),
                                                    integrations: []
                                                });
                                } else {
                                  var channelUser = findChannelUser(channels[0].Users, user.id);
                                  if(!channelUser || channelUser.active === false){
                                    return res.status(403).json({ errors: { all: 'El usuario no puede acceder al canal solicitado.'}});
                                  }

                                  return res.json({
                                                    id: channels[0].id,
                                                    name: channels[0].name,
                                                    description: channels[0].description,
                                                    createdAt: channels[0].createdAt,
                                                    type: channels[0].type,
                                                    state: channels[0].state,
                                                    members: getChannelMembers(channels[0].Users),
                                                    integrations: []
                                                });
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
              channels_to_be_returned.push({
                id: channels[x].id,
                name: channels[x].name,
                description: channels[x].description,
                createdAt: channels[x].createdAt,
                type: channels[x].type,
                state: channels[x].state,
                members: getChannelMembers(channels[x].Users),
                integrations: []
              });
          } else {
            var channel_members_ids = getActiveUsersIds(channels[x].Users);
            if((channel_members_ids.indexOf(user.id)) > -1){
              channels_to_be_returned.push({
                id: channels[x].id,
                name: channels[x].name,
                description: channels[x].description,
                createdAt: channels[x].createdAt,
                type: channels[x].type,
                state: channels[x].state,
                members: getChannelMembers(channels[x].Users),
                integrations: []
              });
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
* Adds new Project's members basing on provided ids.
* @members
* @project_id
* @channel_id
* @user
* @callback
*
*/
module.exports.getAddMembersBulk = function(members, project_id, channel_id, user, callback) {
  var result = {};
  models.Channel.findAll({ where: ['"Channel"."id" = ? AND "Channel"."ProjectId" = ? AND "Channel"."state" != ?', channel_id , project_id, "B"],
                          include: [{ model: models.User}]}).then(function(channels){
                            if (channels === undefined || channels.length === 0) {
                              result.code = 404;
                              result.message = { errors: { all: 'No se puede encontrar ningun canal con el id provisto.'}};
                              return callback(result);
                            }

                            var channel_members_ids = getActiveUsersIds(channels[0].Users);

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
                                    result.message = {
                                                      id: channels[0].id,
                                                      name: channels[0].name,
                                                      description: channels[0].description,
                                                      createdAt: channels[0].createdAt,
                                                      type: channels[0].type,
                                                      state: channels[0].state,
                                                      members: getChannelMembers(users),
                                                      integrations: []
                                                    };
                                    return callback(result);
                                  });
                                });
                              });
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
      channels[0].close(user.id);
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
* Removes currently logged User from Project's channel
* @project_id
* @channel_id
* @user
* @callback
*
*/
module.exports.removeMember = function(project_id, channel_id, user, member_id, callback) {
  var result = {};
  if(user.id !== parseInt(member_id)){
    result.code = 403;
    result.message = { errors: { all: 'No se puede eliminar el usuario con el id provisto.'}};
    return callback(result);
  }else{
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
        //deleting user from channel
        channels[0].ChannelUser.active = false;

        channels[0].ChannelUser.save().then(function(){
          result.code = 200;
          result.message = {};
          return callback(result);
        });
      }
    });
  }
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
  if(members){
    var x;
    var project_users_ids = getUsersIds(projectUsers);
    var channel_users_to_create = [];
    for(x in members){
      if(project_users_ids.indexOf(parseInt(members[x].id)) > -1){
        channel_users_to_create.push({ active: 'true', ChannelId: channel.id, UserId: parseInt(members[x].id) });
      }
    }
    models.ChannelUser.bulkCreate(channel_users_to_create).then(function() {
      return true;
    });
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

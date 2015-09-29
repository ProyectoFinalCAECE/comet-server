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
  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', req.primaryParams.project_id, "B"] }).then(function(projects){
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
        user.addChannel(channel, {active: true});
        user.save().then(function(user) {
          // Channel created successfully

          //associating members if provided
          //ASOCIAR USUSARIOS

          return res.json({
                            id: channelCreated.id,
                            name: channelCreated.name,
                            description: channelCreated.description,
                            createdAt: channelCreated.createdAt,
                            type: channelCreated.type,
                            state: channelCreated.state,
                            members:  [{
                                        id: user.id,
                                        email: user.email,
                                        profilePicture: user.profilePicture,
                                        alias: user.alias
                                      }],
                            integrations: []
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
  user.getChannels({ where: ['"ChannelUser"."ChannelId" = ? AND "Channel"."state" != ? AND "Channel"."ProjectId" = ?', req.params.id, "B", req.primaryParams.project_id] }).then(function(channels){
    if (channels === undefined || channels.length === 0) {
      return res.status(404).json({ errors: { all: 'No se puede encontrar ningun canal con el id provisto.'}});
    }

    if(channels[0].ChannelUser.active === false){
      return res.status(403).json({ errors: { all: 'El usuario no puede acceder al canal solicitado.'}});
    } else {

      //look for members
      channels[0].getUsers().then(function(users){

      return res.json({
                        id: channels[0].id,
                        name: channels[0].name,
                        description: channels[0].description,
                        createdAt: channels[0].createdAt,
                        state: channels[0].state,
                        members: getChannelMembers(users),
                        integrations: []
                    });

      });
    }
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
                                alias: users[y].alias,
                                createdAt:users[y].createdAt
                              });
    }
  }
  return users_to_be_returned;
}

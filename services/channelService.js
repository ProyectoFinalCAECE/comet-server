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
                                      }]
                          });
        });
      });
    }
  });
};

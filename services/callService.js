"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');
var messagingService = require('../services/messagingService');
var socket = require('../lib/socket');

/**
 * Function to store a new call record at the database
 * @param  {integer}   project_id
 * @param  {integer}   channel_id
 * @param  {User}   user
 * @param  {json}   req_body
 * @param  {Function} callback
 * @return callback
 */
module.exports.createNewCall = function(project_id, channel_id, user, req_body, callback) {
  var result = {};

  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', project_id, "B"] }).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      result.code = 404;
      result.message = { errors: { all: 'No se puede encontrar ningún proyecto con el id provisto.'}};
      return callback(result);
    }

    if(projects[0].ProjectUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}};
      return callback(result);
    } else {

      //Looking for Channel among retrieved Project's Channels.
      projects[0].getChannels({ where: ['"Channel"."id" = ?', channel_id ] }).then(function(channels){

        if (channels === undefined || channels.length === 0) {
          result.code = 404;
          result.message = { errors: { all: 'No se puede encontrar ningun Canal con el id provisto.'}};
          return callback(result);
        }

        // create new Call instance
        var call = models.Call.build({
          summary: req_body.summary,
          startHour: req_body.start_hour,
          endHour: req_body.end_hour,
          ChannelId: channels[0].id,
          UserId: user.id
        });

        //saving new call
        call.save().then(function() {

              if(!req_body.members){
                req_body.members = [];
              }

              //Adding current user to Call Members array.
              req_body.members.push(user.id);

              //Removing duplicates
              req_body.members = req_body.members.filter( onlyUnique );

              // Save Members
              // (must do it this way in order to return members within the service response)
              associateCallMembers(req_body.members, call.id, function(){

                call.getMembers().then(function(members){
                  if(!members){
                    members = [];
                  }

                  var data = {
                      id: call.id,
                      summary: call.summary,
                      startHour: call.startHour,
                      endHour: call.endHour,
                      createdAt: call.createdAt,
                      updatedAt: call.updatedAt,
                      ChannelId: call.ChannelId,
                      OwnerId: call.UserId,
                      members: members
                  };

                  var data_to_store = {
                    id: data.id,
                    summary: data.summary,
                    ChannelId: data.ChannelId
                  };

                  // Saving message
                  messagingService.storeVideocallMessage(JSON.stringify(data_to_store), call.ChannelId, call.UserId);

                  // broadcast message
                  var message = {
                                  message: {
                                      text: JSON.stringify(data),
                                      type: 9,
                                      date: new Date().getTime()
                                  }
                                };

                  //broadcast
                  socket.broadcastVideocallMessage('Project_' + projects[0].id, call.ChannelId, message);

                  result.code = 200;
                  result.message = data;
                  return callback(result);

                });
              });
        });
      });
    }
  });
};

module.exports.updateCall = function(project_id, channel_id, user, call_id, req_body, callback) {
  var result = {};

  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', project_id, "B"] }).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      result.code = 404;
      result.message = { errors: { all: 'No se puede encontrar ningún proyecto con el id provisto.'}};
      return callback(result);
    }

    if(projects[0].ProjectUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}};
      return callback(result);
    } else {

      //Looking for Channel among retrieved Project's Channels.
      projects[0].getChannels({ where: ['"Channel"."id" = ?', channel_id ] }).then(function(channels){

        if (channels === undefined || channels.length === 0) {
          result.code = 404;
          result.message = { errors: { all: 'No se puede encontrar ningun Canal con el id provisto.'}};
          return callback(result);
        }

        channels[0].getCalls({ where: ['"Call"."id" = ?', call_id ] }).then(function(calls){
          if (calls === undefined || calls.length === 0) {
            result.code = 404;
            result.message = { errors: { all: 'No se puede encontrar ninguna Videollamada con el id provisto.'}};
            return callback(result);
          }

          calls[0].summary = req_body.summary;
          calls[0].startHour = req_body.start_hour;
          calls[0].endHour = req_body.end_hour;

          //saving updated call
          calls[0].save().then(function(){
            // UPDATE MEMBERS  -- > REPLACE OLD MEMBERS WITH NEW ONES

            if(!req_body.members){
              req_body.members = [];
            }

            //Adding current user to Call Members array.
            req_body.members.push(user.id);

            //Removing duplicates
            req_body.members = req_body.members.filter( onlyUnique );

            // Save Members
            // (must do it this way in order to return members within the service response)
            associateCallMembers(req_body.members, calls[0].id, function() {

              calls[0].getMembers().then(function(members){
                if(!members){
                  members = [];
                }

                var data = {
                    id: calls[0].id,
                    summary: calls[0].summary,
                    startHour: calls[0].startHour,
                    endHour: calls[0].endHour,
                    createdAt: calls[0].createdAt,
                    updatedAt: calls[0].updatedAt,
                    ChannelId: calls[0].ChannelId,
                    OwnerId: calls[0].UserId,
                    members: members
                };

                var data_to_store = {
                  id: data.id,
                  summary: data.summary,
                  ChannelId: data.ChannelId
                };

                // UPDATE MESSAGE
                // Updating message
              //  messagingService.updateVideocallMessage(JSON.stringify(data_to_store), calls[0].ChannelId, calls[0].UserId);

                result.code = 200;
                result.message = calls[0];
                return callback(result);
              });
            });
          });
        });
      });
    }
  });
};

/**
 * Save Call Members
 * @param  {array}   members
 * @param  {integer}   call_id
 * @param  {Function} callback
 */
function associateCallMembers(members, call_id, callback) {
  if(members){
    removePreexistentMembers(call_id, function(){
      models.User.findAll({where: { id: { in: members } } }).then(function(users){
        if(users && users.length > 0){
          console.log('users is: ', users);
          console.log('users.length is: ', users.length);
          var x;
          var call_users_to_create = [];

          for(x in members){
            console.log('in for, members[x] is: ', members[x]);
            var user = findById(users, members[x]);
            console.log('found user!: ', user);
            if(user !== null){
              // store new Call Member instance into array
              call_users_to_create.push({ alias: user.alias, profilePicture: user.profilePicture, UserId: user.id, CallId: call_id });
            }
          }

          if(call_users_to_create.length > 0){
            console.log('call_users_to_create is: ', call_users_to_create);
            models.CallMember.bulkCreate(call_users_to_create).then(function(){
              return callback();
            });
          }else{
            return callback();
          }
        } else {
          return callback();
        }
      });
    });
  } else {
    return callback();
  }
}

/**
 * Given a call id, retrieves the Call object and removes the members it could have.
 * @param  {[type]}   call_id  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function removePreexistentMembers(call_id, callback) {
  models.Call.findById(call_id).then(function(call){
    if(call){
      call.getMembers().then(function(members){
        if(members){
          var x;
          for(x in members){
            members[x].destroy();
          }
        } else {
          return callback();
        }
      });
    } else {
      return callback();
    }
  });
}
/**
 * Given a set of Users, returns the one that matches provided id.
 * @param  {array} users
 * @param  {integer} user_id
 * @return {User}
 */
function findById(users, user_id) {
  var x;
  for(x in users){
    if(users[x].id === user_id){
      return users[x];
    }
  }
  return null;
}

/**
 * Removes duplicates from provided array
 */
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

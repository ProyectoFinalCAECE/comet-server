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
          startHour: new Date().getTime(),
          ChannelId: channels[0].id,
          UserId: user.id,
          frontendId: req_body.frontendId
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

                call.getCallMembers().then(function(members){
                  if(!members){
                    members = [];
                  }

                  var data = {
                      id: call.id,
                      summary: call.summary,
                      startHour: call.startHour,
                      endHour: call.endHour,
                      frontendId: call.frontendId,
                      createdAt: call.createdAt,
                      updatedAt: call.updatedAt,
                      ChannelId: call.ChannelId,
                      OwnerId: call.UserId,
                      members: members
                  };

                  var data_to_store = {
                    callId: data.id,
                    frontendId: call.frontendId
                  };

                  // Saving message
                  messagingService.storeVideocallMessage(JSON.stringify(data_to_store), call.ChannelId, call.UserId);

                  // broadcast message
                  var message = {
                                  message: {
                                      text: JSON.stringify(data),
                                      type: 10,
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


          if (req_body.summary)
            calls[0].summary = req_body.summary;

          if (req_body.start_hour)
            calls[0].startHour = req_body.start_hour;

          if (req_body.end_hour)
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
            removePreexistentMembers(call_id, associateCallMembers(req_body.members, calls[0].id, function() {

                calls[0].getCallMembers().then(function(members){
                  if(!members){
                    members = [];
                  }

                  var data = {
                      id: calls[0].id,
                      summary: calls[0].summary,
                      startHour: calls[0].startHour,
                      endHour: calls[0].endHour,
                      frontendId: calls[0].frontendId,
                      createdAt: calls[0].createdAt,
                      updatedAt: calls[0].updatedAt,
                      ChannelId: calls[0].ChannelId,
                      OwnerId: calls[0].UserId,
                      members: members
                  };

                  var data_to_store = {
                    callId: data.id,
                    frontendId: calls[0].frontendId
                  };

                  // UPDATE MESSAGE
                  // Updating message
                //  messagingService.updateVideocallMessage(JSON.stringify(data_to_store), calls[0].ChannelId, calls[0].UserId);

                  result.code = 200;
                  result.message = data;
                  return callback(result);
                });
              })
            );
          });
        });
      });
    }
  });
};

/**
 * Add currently logged user as a member of a call
 * @param  {integer}   project_id
 * @param  {integer}   channel_id
 * @param  {User}   user
 * @param  {integer}   call_id
 * @param  {integer}   member
 * @param  {Function} callback
 */
module.exports.addCallMember = function(project_id, channel_id, user, call_id, callback) {
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

          calls[0].getCallMembers().then(function(members){

            var members_to_add = [];

            //preventing currently logged user from being inserted more than one time.
            if(members){
              var found = findByUserId(members, user.id);
              if(!found){
                members_to_add.push(user.id);
              }
            } else {
              members_to_add.push(user.id);
            }

            associateCallMembers(members_to_add, calls[0].id, function() {

                calls[0].getCallMembers().then(function(members){
                  if(!members){
                    members = [];
                  }

                  var data = {
                      id: calls[0].id,
                      summary: calls[0].summary,
                      startHour: calls[0].startHour,
                      endHour: calls[0].endHour,
                      frontendId: calls[0].frontendId,
                      createdAt: calls[0].createdAt,
                      updatedAt: calls[0].updatedAt,
                      ChannelId: calls[0].ChannelId,
                      OwnerId: calls[0].UserId,
                      members: members
                  };

                  result.code = 200;
                  result.message = data;
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
 * Add a summary to a call
 * @param  {integer}   project_id
 * @param  {integer}   channel_id
 * @param  {User}   user
 * @param  {integer}   call_id
 * @param  {string}   summary
 * @param  {integer}   member
 * @param  {Function} callback
 */
module.exports.addCallSummary = function(project_id, channel_id, user, call_id, summary, callback) {
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
          } else {
            if(parseInt(calls[0].UserId) !== user.id){
              result.code = 403;
              result.message = { errors: { all: 'El usuario no puede modificar la llamada solicitada.'}};
              return callback(result);
            } else {

              calls[0].summary = summary;
              calls[0].endHour = new Date().getTime();

              //saving updated call
              calls[0].save().then(function(){
                calls[0].getCallMembers().then(function(members){
                  if(!members){
                    members = [];
                  }

                  var data = {
                      id: calls[0].id,
                      summary: calls[0].summary,
                      startHour: calls[0].startHour,
                      endHour: calls[0].endHour,
                      frontendId: calls[0].frontendId,
                      createdAt: calls[0].createdAt,
                      updatedAt: calls[0].updatedAt,
                      ChannelId: calls[0].ChannelId,
                      OwnerId: calls[0].UserId,
                      members: members
                  };

                  // UPDATE MESSAGE
                  // Updating message
                  //  messagingService.updateVideocallMessage(JSON.stringify(data_to_store), calls[0].ChannelId, calls[0].UserId);

                  result.code = 200;
                  result.message = data;
                  return callback(result);
                });
              });
            }
          }
        });
      });
    }
  });
};

/**
 * Returns all the calls of a channel, and the members of each one.
 * @param  {integer}   project_id
 * @param  {integer}   channel_id
 * @param  {User}   user
 * @param  {Function} callback
 */
module.exports.retrieveCalls = function(project_id, channel_id, user, callback) {
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

        models.Call.findAll({ where: ['"ChannelId" = ?', channel_id], include: [models.CallMember] }).then(function(calls){
          if (calls === undefined) {
            result.code = 404;
            result.message = { errors: { all: 'No se puede encontrar ninguna Videollamada para el canal provisto.'}};
            return callback(result);
          }

          formatCallSet(calls, function(formattedCalls){
            result.code = 200;
            result.message = formattedCalls;
            return callback(result);
          });
        });
      });
    }
  });
};

/**
 * Retrieve a call and its members by id.
 * @param  {integer}   project_id
 * @param  {integer}   channel_id
 * @param  {User}   user
 * @param  {integer}   call_id
 * @param  {Function} callback
 */
module.exports.retrieveCallById = function(project_id, channel_id, user, call_id, callback) {
  var result = {};
  if (isNaN(call_id)) {
    result.code = 404;
    result.message = { errors: { all: 'Por favor ingrese un id válido.'}};
    return callback(result);
  } else {
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

      models.Call.find({ where: ['"id" = ? AND "ChannelId" = ?', call_id, channel_id], include: [models.CallMember] }).then(function(call){
        if (call === undefined || call === null) {
          result.code = 404;
          result.message = { errors: { all: 'No se puede encontrar ninguna Videollamada para el id provisto.'}};
          return callback(result);
        }
        
        var response = {
                        id: call.id,
                        summary: call.summary,
                        startHour: call.startHour,
                        endHour: call.endHour,
                        frontendId: call.frontendId,
                        createdAt: call.createdAt,
                        updatedAt: call.updatedAt,
                        ChannelId: call.ChannelId,
                        OwnerId: call.UserId,
                        members: call.CallMembers
                      };

        result.code = 200;
        result.message = response;
        return callback(result);
      });
    }
  });
  }
};

/**
 * Given a set of calls, formats them to match the expected output.
 * @param  {array}   calls
 * @param  {Function} callback
 */
function formatCallSet(calls, callback){
  var formattedCalls = [];
  var x;
  for(x in calls){
    formattedCalls.push({
                          id: calls[x].id,
                          summary: calls[x].summary,
                          startHour: calls[x].startHour,
                          endHour: calls[x].endHour,
                          frontendId: calls[x].frontendId,
                          createdAt: calls[x].createdAt,
                          updatedAt: calls[x].updatedAt,
                          ChannelId: calls[x].ChannelId,
                          OwnerId: calls[x].UserId,
                          members: calls[x].CallMembers
                      });
  }

  //Ordering calls
  formattedCalls.sort(compare);

  return callback(formattedCalls);
}

/**
 * Compares two calls and returns them ordered
 * @param  {[type]} a [description]
 * @param  {[type]} b [description]
 * @return {[type]}   [description]
 */
function compare(a,b) {
  if (a.createdAt < b.createdAt)
    return -1;
  else if (a.createdAt > b.createdAt)
    return 1;
  else
    return 0;
}

/**
 * Save Call Members
 * @param  {array}   members
 * @param  {integer}   call_id
 * @param  {Function} callback
 */
function associateCallMembers(members, call_id, callback) {
  if(members){
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
      call.getCallMembers().then(function(members){
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
 * Given a set of Call Members, returns the one whose user id matches provided id.
 * @param  {array} Call members
 * @param  {integer} user_id
 * @return {User}
 */
function findByUserId(call_members, user_id) {
  var x;
  for(x in call_members){
    if(call_members[x].UserId === user_id){
      return call_members[x];
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

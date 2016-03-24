"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');

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
              // SAVE MEMBERS

              // SAVE MESSAGE

              result.code = 200;
              result.message = call;
              return callback(result);
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
            // SAVE MEMBERS

            // SAVE MESSAGE

            result.code = 200;
            result.message = calls[0];
            return callback(result);

          });
        });
      });
    }
  });
};

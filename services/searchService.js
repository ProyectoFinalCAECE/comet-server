"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');

var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "development";
var config    = require(__dirname + '/../config/sequelize.json')[env];
var sequelize = new Sequelize(config.database, config.username, config.password, { "username": "postgres",
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

/**
 * query to search for Project's Users
 * @type {String}
 */
var user_search_query = 'SELECT "U".id, "U".alias, "U"."firstName", "U"."lastName", "U".email, "U"."profilePicture"' +
                        ' FROM "Users" AS "U"' +
                        ' WHERE "U".id IN (' +
	                      '  SELECT "PU"."UserId" FROM "ProjectUsers" AS "PU" WHERE "PU"."ProjectId"= ? AND "PU".active = true' +
	                      ' )' +
                        ' AND "U".active = true' +
                        ' AND to_tsvector("searchable_text") @@ to_tsquery(?)';

/**
 * query to search for messages at common Channels for requests with :last_id paramater.
 * @type {String}
 */
var messages_search_common_channel_query = 'SELECT "M".id, "M".content, "M"."sentDateTimeUTC", "M"."UserId", "M"."MessageTypeId", "M"."ChannelId"' +
                            ' FROM "Messages" AS "M"' +
                            ' WHERE "M"."ChannelId" IN (:channel_ids) ' +
                            ' AND "M"."MessageTypeId" = 1 ' +
                            ' AND to_tsvector(\'spanish\', content) @@ to_tsquery(\'spanish\', :text) ' +
                            ' AND "M"."sentDateTimeUTC" < (SELECT "ME"."sentDateTimeUTC" FROM "Messages" AS "ME" WHERE "ME".id = :last_id) ' +
                            ' ORDER BY "M"."sentDateTimeUTC" DESC' +
                            ' LIMIT :limit;';

/**
 * query to search for messages at common Channels for requests without :last_id paramater.
 * @type {String}
 */
 var messages_search_common_channel_query_first = 'SELECT "M".id, "M".content, "M"."sentDateTimeUTC", "M"."UserId", "M"."MessageTypeId", "M"."ChannelId"' +
                            ' FROM "Messages" AS "M"' +
                            ' WHERE "M"."ChannelId" IN (:channel_ids) ' +
                            ' AND "M"."MessageTypeId" = 1 ' +
                            ' AND to_tsvector(\'spanish\', content) @@ to_tsquery(\'spanish\', :text) ' +
                            ' AND "M"."sentDateTimeUTC" < (SELECT "ME"."sentDateTimeUTC" FROM "Messages" AS "ME" WHERE "ME".id = ' +
                            ' (SELECT MAX("MES".ID) FROM "Messages" AS "MES" WHERE "MES"."ChannelId" IN (:channel_ids)))' +
                            ' ORDER BY "M"."sentDateTimeUTC" DESC' +
                            ' LIMIT :limit;';

/**
 * query to search for messages at direct Channels for requests with :last_id paramater.
 * @type {String}
 */
var messages_search_direct_channel_query = 'SELECT "PM".id, "PM".content, "PM".channel, "PM"."sentDateTimeUTC", "PM"."ProjectId", ' +
                            '"PM"."OriginUserId", "PM"."DestinationUserId", "PM"."MessageTypeId"' +
                            ' FROM "PrivateMessages" AS "PM"' +
                            ' WHERE "PM"."MessageTypeId" = 1' +
                            ' AND "PM"."ProjectId" = :project_id' +
                            ' AND ("PM"."OriginUserId" = :origin_user_id OR "PM"."DestinationUserId" = :destination_user_id)' +
                            ' AND to_tsvector(\'spanish\', content) @@ to_tsquery(\'spanish\', :text)' +
                            ' AND "PM"."sentDateTimeUTC" < (SELECT "PME"."sentDateTimeUTC" FROM "PrivateMessages" AS "PME" WHERE "PME".id = :last_id)' +
                            ' ORDER BY "PM"."sentDateTimeUTC" DESC' +
                            ' LIMIT :limit;';

/**
* query to search for messages at direct Channels for requests without :last_id paramater.
* @type {String}
*/
var messages_search_direct_channel_query_first = 'SELECT "PM".id, "PM".content, "PM".channel, "PM"."sentDateTimeUTC", "PM"."ProjectId", ' +
                            '"PM"."OriginUserId", "PM"."DestinationUserId", "PM"."MessageTypeId"' +
                            ' FROM "PrivateMessages" AS "PM"' +
                            ' WHERE "PM"."MessageTypeId" = 1' +
                            ' AND "PM"."ProjectId" = :project_id' +
                            ' AND ("PM"."OriginUserId" = :origin_user_id OR "PM"."DestinationUserId" = :destination_user_id)' +
                            ' AND to_tsvector(\'spanish\', content) @@ to_tsquery(\'spanish\', :text)' +
                            ' AND "PM"."sentDateTimeUTC" < (SELECT "PME"."sentDateTimeUTC" FROM "PrivateMessages" AS "PME" WHERE "PME".id = ' +
                            ' (SELECT MAX("PMES".ID) FROM "PrivateMessages" AS "PMES" WHERE "PMES"."ProjectId" = :project_id AND ("PMES"."OriginUserId" = :origin_user_id OR "PMES"."DestinationUserId" = :destination_user_id)))' +
                            ' ORDER BY "PM"."sentDateTimeUTC" DESC' +
                            ' LIMIT :limit;';

/**
 * query to search for messages at a single direct Channels for requests with :last_id paramater.
 * @type {String}
 */
var messages_search_direct_single_channel_query = 'SELECT "PM".id, "PM".content, "PM".channel, "PM"."sentDateTimeUTC", "PM"."ProjectId", ' +
                            ' "PM"."OriginUserId", "PM"."DestinationUserId", "PM"."MessageTypeId" ' +
                            ' FROM "PrivateMessages" AS "PM" ' +
                            ' WHERE "PM"."MessageTypeId" = 1 ' +
                            ' AND "PM"."ProjectId" = :project_id ' +
                            ' AND "PM".channel = :channel_name ' +
                            ' AND to_tsvector(\'spanish\', content) @@ to_tsquery(\'spanish\', :text) ' +
                            ' AND "PM"."sentDateTimeUTC" < (SELECT "PME"."sentDateTimeUTC" FROM "PrivateMessages" AS "PME" WHERE "PME".id = :last_id)' +
                            ' ORDER BY "PM"."sentDateTimeUTC" DESC ' +
                            ' LIMIT :limit;';

/**
* query to search for messages at a single direct Channels for requests without :last_id paramater.
* @type {String}
*/
var messages_search_direct_single_channel_query_first = 'SELECT "PM".id, "PM".content, "PM".channel, "PM"."sentDateTimeUTC", "PM"."ProjectId", ' +
                            ' "PM"."OriginUserId", "PM"."DestinationUserId", "PM"."MessageTypeId" ' +
                            ' FROM "PrivateMessages" AS "PM" ' +
                            ' WHERE "PM"."MessageTypeId" = 1 ' +
                            ' AND "PM"."ProjectId" = :project_id ' +
                            ' AND "PM".channel = :channel_name ' +
                            ' AND to_tsvector(\'spanish\', content) @@ to_tsquery(\'spanish\', :text) ' +
                            ' AND "PM"."sentDateTimeUTC" < (SELECT "PME"."sentDateTimeUTC" FROM "PrivateMessages" AS "PME" WHERE "PME".id = ' +
                            ' (SELECT MAX("PMES".ID) FROM "PrivateMessages" AS "PMES" WHERE "PMES"."ProjectId" = :project_id AND "PMES".channel = :channel_name))' +
                            ' ORDER BY "PM"."sentDateTimeUTC" DESC ' +
                            ' LIMIT :limit;';
/**
 * searchs messages that contain provided text in db.
 * @param  {integer}   project_id
 * @param  {string}   text_to_search
 * @param  {User}    user
 * @param  {Function}   callback
 * @param  {integer}    channel_id
 * @return {list}   messages list
 */
module.exports.searchMessage = function(project_id, text_to_search, user, limit, last_id, callback, channel_id) {
  var result = {};

  result.message = {
    project: {
      channels: {

      }
    }
  };

  //Initialize limit
  if(!limit || isNaN(limit) || limit < 1){
    limit = 25;
  }

  var first_query = false;

  //Initialize last_id
  if(!last_id || isNaN(last_id) || last_id < 1){
    first_query = true;
  }

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

      //If parameter is not a number (and exists), it's a direct channel's name.
      if(channel_id && isNaN(channel_id)){

        if (!userBelongsToDirectChannel(user.id, channel_id)){
          result.code = 404;
          result.message = { errors: { all: 'No se puede encontrar ningún canal con el id provisto.'}};
          return callback(result);
        }
        if(first_query){
          //look for a single direct channel's messages that match the search parameter
          sequelize.query(messages_search_direct_single_channel_query_first,
                          {
                            type: sequelize.QueryTypes.SELECT,
                            replacements: {
                              project_id: project_id,
                              channel_name: channel_id,
                              text: text_to_search,
                              limit: limit
                            },
                              escapeValues: false
                          })
          .then(function(textSearchResultDirect) {

            result.code = 200;

            //Adding search results to service response.
            result.message.project.channels['direct'] = getDirectChannelBodyForTextSearchResult(textSearchResultDirect);

            return callback(result);
          });
        }else{
          //look for a single direct channel's messages that match the search parameter
          sequelize.query(messages_search_direct_single_channel_query,
                          {
                            type: sequelize.QueryTypes.SELECT,
                            replacements: {
                              project_id: project_id,
                              channel_name: channel_id,
                              text: text_to_search,
                              limit: limit,
                              last_id: last_id
                            },
                              escapeValues: false
                          })
          .then(function(textSearchResultDirect) {

            result.code = 200;

            //Adding search results to service response.
            result.message.project.channels['direct'] = getDirectChannelBodyForTextSearchResult(textSearchResultDirect);

            return callback(result);
          });
        }
      } else {
        getChannelsIdsToScan(projects[0], user, function(channels_ids){

          if (channels_ids.length === 0){
            result.code = 404;
            result.message = { errors: { all: 'No se puede encontrar ningún canal con el id provisto.'}};
            return callback(result);
          }

          if(first_query){
            //look for channel's messages that match the search parameter.
            sequelize.query(messages_search_common_channel_query_first,
                            {
                              type: sequelize.QueryTypes.SELECT,
                              replacements: {
                                channel_ids: channels_ids,
                                text: text_to_search,
                                limit: limit
                              },
                                escapeValues: false
                            })
            .then(function(textSearchResult) {

                result.code = 200;
                //Adding search results to service response.
                result.message.project.channels['common'] = getChannelBodyForTextSearchResult(textSearchResult);

                if(channels_ids.length > 1){

                  //Must look for messages that match the search parameter in direct channels too.
                  sequelize.query(messages_search_direct_channel_query_first,
                                  {
                                    type: sequelize.QueryTypes.SELECT,
                                    replacements: {
                                      project_id: project_id,
                                      origin_user_id: user.id,
                                      destination_user_id: user.id,
                                      text: text_to_search,
                                      limit: limit
                                    },
                                      escapeValues: false
                                  })
                  .then(function(textSearchResultDirect) {

                    //Adding search results to service response.
                    result.message.project.channels['direct'] = getDirectChannelBodyForTextSearchResult(textSearchResultDirect);

                    return callback(result);
                  });
                } else {
                  return callback(result);
                }
              });
          } else {
            //look for channel's messages that match the search parameter.
            sequelize.query(messages_search_common_channel_query,
                            {
                              type: sequelize.QueryTypes.SELECT,
                              replacements: {
                                channel_ids: channels_ids,
                                text: text_to_search,
                                limit: limit,
                                last_id: last_id
                              },
                                escapeValues: false
                            })
            .then(function(textSearchResult) {

                result.code = 200;
                //Adding search results to service response.
                result.message.project.channels['common'] = getChannelBodyForTextSearchResult(textSearchResult);

                if(channels_ids.length > 1){

                  //Must look for messages that match the search parameter in direct channels too.
                  sequelize.query(messages_search_direct_channel_query,
                                  {
                                    type: sequelize.QueryTypes.SELECT,
                                    replacements: {
                                      project_id: project_id,
                                      origin_user_id: user.id,
                                      destination_user_id: user.id,
                                      text: text_to_search,
                                      limit: limit,
                                      last_id: last_id
                                    },
                                      escapeValues: false
                                  })
                  .then(function(textSearchResultDirect) {

                    //Adding search results to service response.
                    result.message.project.channels['direct'] = getDirectChannelBodyForTextSearchResult(textSearchResultDirect);

                    return callback(result);
                  });
                } else {
                  return callback(result);
                }
              });
          }
        }, channel_id);
      }
    }
  });
};

/**
 * searchs Users whose email, username, firstname or last name matches that contain provided text in db.
 * @param  {[type]}   project_id [description]
 * @param  {[type]}   user_text  [description]
 * @param  {[type]}   user       [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
module.exports.searchUserInProject = function(project_id, user_text, user, callback) {
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

      //look for active users in project, that match the search parameter.
      sequelize.query(user_search_query,
                      { type: sequelize.QueryTypes.SELECT,
                        replacements: [project_id, user_text]})
      .then(function(usersSearchResult) {
          result.code = 200;
          result.message = { users: usersSearchResult };
          return callback(result);
        });
    }
  });
};

/**
 * Determines if a user belongs to a provided Direct channel
 * @param  {Integer} user_id
 * @param  {String} channel_name
 * @return {Boolean}
 */
function userBelongsToDirectChannel(user_id, channel_name){
  return (channel_name.split("_").indexOf(user_id.toString()) > -1);
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

/**
 * Given a set of Users, returns the one whose id is equal to the provided one
 * @param  {list} channel_users
 * @param  {User} current_user_id
 * @return {User}
 */
function findChannelUser(channel_users, current_user_id){
  if(channel_users){
    var y;
    for(y in channel_users){
      if(channel_users[y].id === current_user_id){
        return channel_users[y];
      }
    }
  }
  return null;
}

/**
 * Given a set of Users, returns an array containing its ids if they're active for the channel.
 * @param  {list} channel_members
 * @return {array}
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

/**
 * Returns the set of channels ids over which the text search will be performed
 * @param  {Project}   project
 * @param  {User}   user
 * @param  {Function} callback
 * @param  {Integer}   channel_id
 * @return {Array}
 */
function getChannelsIdsToScan(project, user, callback, channel_id){

  var channels_ids = [];

  //If request includes channelId parameter
  if(channel_id !== undefined){
    models.Channel.findAll({ where: ['"Channel"."id" = ? AND "Channel"."ProjectId" = ? AND "Channel"."state" != ?', channel_id, project.id, "B"]}).then(function(channels){

      //Channel does not exist.
      if (channels === undefined || channels.length === 0) {
        return callback(channels_ids);
      }

      //Shared or private Channel
      if(channels[0].type === 'S'){
        channels_ids.push(channels[0].id);
        return callback(channels_ids);
      } else {
        var channelUser = findChannelUser(channels[0].Users, user.id);
        if(!channelUser || !channelUser.active){
          return callback(channels_ids);
        }
        channels_ids.push(channels[0].id);
        return callback(channels_ids);
      }
    });
  } else {
    //Must look for all Project's Channels.
    project.getChannels().then(function(project_channels){

      var x;
      for (x in project_channels) {
        //filtering channels user is not assigned anymore
        if(project_channels[x].type === 'S') {
            channels_ids.push(project_channels[x].id);
        } else {
          var channel_members_ids = getActiveUsersIds(project_channels[x].Users);
          if((channel_members_ids.indexOf(user.id)) > -1){
            channels_ids.push(project_channels[x].id);
          }
        }
      }
      return callback(channels_ids);
    });
  }
}

/**
 * Create common channels collection for text search service response body.
 * @param  {Array} resultsSet
 * @return {Json}
 */
function getChannelBodyForTextSearchResult(resultsSet){
  var channels = [];
  if(resultsSet.length > 0){
    for(var x in resultsSet){
      var current_channel = retrieveCommonChannelFromArray(channels, resultsSet[x].ChannelId);
      current_channel.messages.push({
                                      id: resultsSet[x].id,
                                      text: resultsSet[x].content,
                                      user: resultsSet[x].UserId,
                                      type: resultsSet[x].MessageTypeId,
                                      date: resultsSet[x].sentDateTimeUTC
                                    });

      channels.push(current_channel);
    }
  }
  return channels;
}

/**
 * Create direct channels collection for text search service response body.
 * @param  {Array} resultsSet
 * @return {Json}
 */
function getDirectChannelBodyForTextSearchResult(resultsSet){
  var directs = [];
  if(resultsSet.length > 0){
    for(var x in resultsSet){
      var current_direct = retrieveDirectChannelFromArray(directs, resultsSet[x].channel);
      current_direct.messages.push({
                                      id: resultsSet[x].id,
                                      content: resultsSet[x].content,
                                      OriginUserId: resultsSet[x].OriginUserId,
                                      DestinationUserId: resultsSet[x].DestinationUserId,
                                      ProjectId: resultsSet[x].ProjectId,
                                      MessageTypeId: resultsSet[x].MessageTypeId,
                                      channel: resultsSet[x].channel,
                                      sentDateTimeUTC: resultsSet[x].sentDateTimeUTC
                                    });

      directs.push(current_direct);
    }
  }
  return directs;
}

/**
 * Looks for channel with provided ID among already existent common channels in array.
 * If not found, creates a new structure for the channel id.
 * @param  {Array} channels
 * @param  {Integer} channelId
 * @return {Hash}
 */
function retrieveCommonChannelFromArray(channels, channelId){
    var index = arrayObjectIndexOf(channels, channelId, "id");
    if(index > -1){
      return channels.splice(index, 1)[0];
    } else {
      return {
        id: channelId,
        messages: []
      };
    }
}

/**
 * Looks for channel with provided name among already existent direct channels in array.
 * If not found, creates a new structure for the channel name.
 * @param  {Array} channels
 * @param  {String} channelName
 * @return {Hash}
 */
function retrieveDirectChannelFromArray(channels, channelName){
  var index = arrayObjectIndexOf(channels, channelName, "id");
  if(index > -1){
    return channels.splice(index, 1)[0];
  } else {
    return {
      id: channelName,
      messages: []
    };
  }
}

/**
 * Given an array, looks for the index of an object with certain value within its keys.
 * @param  {Array} myArray
 * @param  {String} searchTerm
 * @param  {String} property
 * @return {Integer}
 */
function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

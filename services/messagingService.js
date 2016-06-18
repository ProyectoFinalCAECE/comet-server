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
var winston = require('winston');
var async = require('async');

/**
 * query to retrieve forwards messages from message with provided id on a common channel
 * @type {String}
 */
var common_channel_messages_forwards = ' SELECT "M".* ' +
                                        ' FROM "Messages" AS "M"' +
                                        ' WHERE "M".id > :message_id' +
                                        ' AND "M"."ChannelId" = :channel_id' +
                                        ' ORDER BY "M"."sentDateTimeUTC" ASC' +
                                        ' LIMIT :limit;';

/**
* query to retrieve backwards messages from message with provided id on a common channel
* @type {String}
*/
var common_channel_messages_backwards = ' SELECT "M".* ' +
                                        ' FROM "Messages" AS "M"' +
                                        ' WHERE "M".id < :message_id' +
                                        ' AND "M"."ChannelId" = :channel_id' +
                                        ' ORDER BY "M"."sentDateTimeUTC" DESC' +
                                        ' LIMIT :limit;';

/**
 * query to retrieve forwards messages from message with provided id on a direct channel
 * @type {String}
 */
var direct_channel_messages_forwards = 'SELECT "PM".*' +
                                        ' FROM "PrivateMessages" AS "PM"' +
                                        ' WHERE "PM".id > :message_id' +
                                        ' AND "PM".channel = :channel_id' +
                                        ' AND "PM"."ProjectId" = :project_id' +
                                        ' ORDER BY "PM"."sentDateTimeUTC" ASC' +
                                        ' LIMIT :limit;';

/**
* query to retrieve forwards messages from message with provided id on a direct channel
* @type {String}
*/
var direct_channel_messages_backwards = 'SELECT "PM".*' +
                                        ' FROM "PrivateMessages" AS "PM"' +
                                        ' WHERE "PM".id < :message_id' +
                                        ' AND "PM".channel = :channel_id' +
                                        ' AND "PM"."ProjectId" = :project_id' +
                                        ' ORDER BY "PM"."sentDateTimeUTC" ASC' +
                                        ' LIMIT :limit;';

//Max project name and description text lengths
//should be consts but it's use is not allowed under strict mode... yet.
//var NameLenght = 40;
//var DescLength = 2000;

/*
* Store message in db
*
*
*/
module.exports.storeMessage = function(data) {
  //VALIDAR CON TOKEN EL ENVIO DE MENSAJES
      // create new Message instance
      var message;
      if(data.message.message.destinationUser === undefined ||
          data.message.message.destinationUser === 0){
        message = models.Message.build({
          content: data.message.message.text,
          UserId: data.message.message.user,
          MessageTypeId: parseInt(data.message.message.type),
          ChannelId: data.room,
          sentDateTimeUTC: new Date().getTime()
        });
      } else {
        message = models.PrivateMessage.build({
          content: data.message.message.text,
          OriginUserId: parseInt(data.message.message.user),
          DestinationUserId: parseInt(data.message.message.destinationUser),
          ProjectId: parseInt(data.message.message.projectId),
          MessageTypeId: parseInt(data.message.message.type),
          channel: data.room,
          sentDateTimeUTC: new Date().getTime()
        });
      }
      //saving message
      message.save();
};

/*
* Retrieve messages from db by channelId. Allows pagination.
*
*
*/
module.exports.retrieveMessages = function(channelId, offset, limit, isDirect, requesterId, callback) {

  if(offset === undefined){
    offset = 0;
  }

  if(limit === undefined){
    limit = 10;
  }

  var result = {};

  if(isDirect){
    var channel_identifier = 'Direct_' + requesterId + '_' + channelId;

    if(parseInt(channelId) < parseInt(requesterId)){
      channel_identifier = 'Direct_' + channelId + '_' + requesterId;
    }

    models.PrivateMessage.findAll({ where: ['"channel" = ?', channel_identifier], order: [['sentDateTimeUTC', 'DESC']], offset: offset, limit: limit, include: [{ model: models.MessageType}] }).then(function(messages){
      result.code = 200;
      result.message = {
                        messages: formatMessages(messages),
                        next_offset: parseInt(offset)+parseInt(limit)
                      };
      return callback(result);
    });
  } else {
    models.Message.findAll({ where: ['"ChannelId" = ?', channelId], order: [['sentDateTimeUTC', 'DESC']], offset: offset, limit: limit, include: [{ model: models.MessageType}] }).then(function(messages){
      result.code = 200;
      result.message = {
                        messages: formatMessages(messages),
                        next_offset: parseInt(offset)+parseInt(limit)
                      };
      return callback(result);
    });
  }
};

/*
* Store disconnection date of an user from a project
*
*/
module.exports.storeDisconnectionDate = function(data) {
  sequelize.query('UPDATE "ProjectUsers" ' +
                  ' SET "disconnectedAt" = ? ' +
                  ' WHERE "UserId" = ? AND "ProjectId" = ?;',
                  {
                    type : sequelize.QueryTypes.UPDATE,
                    replacements: [ new Date(), data.userId, data.projectId ]
                  }
                );
};

/*
* Store disconnection date of an user from a channel
*
*/
module.exports.storeChannelDisconnectionDate = function(data) {
  sequelize.query('UPDATE "ChannelUsers" ' +
                  ' SET "disconnectedAt" = ? ' +
                  ' WHERE "UserId" = ? AND "ChannelId" = ?;',
                  {
                    type : sequelize.QueryTypes.UPDATE,
                    replacements: [ new Date(), data.userId, data.channelId ]
                  }
                );
};

/*
* Returns a hash containing the amount of 'unseen' messages for each channel of
* provided project to which provided user belongs.
*/
module.exports.getProjectChannelsUpdates = function(projectId, userId, callback) {

  var response = {
                  channels_with_updates: [],
                  users_with_updates: []
                };

  if(projectId === undefined || userId === undefined){
      return callback(response);
  }

  sequelize.query('SELECT CU."ChannelId", CU."disconnectedAt" ' +
                  'FROM "ProjectUsers" PU ' +
                  'JOIN "ChannelUsers" CU ' +
                  'ON PU."UserId" = CU."UserId" ' +
                  'WHERE PU."ProjectId" = ? ' +
                  'AND PU."UserId" = ? ' +
                  'AND PU.active = true ' +
                  'AND CU."UserId" = ? ' +
                  'AND CU.active = true ' +
                  'AND CU."ChannelId" IN ( ' +
                  'SELECT id FROM "Channels" WHERE "ProjectId" = ?); ',
                  {
                    type: sequelize.QueryTypes.SELECT,
                    replacements: [projectId, userId, userId, projectId]
                  }).
  then(function(resultSet){

    //for each row in resultSet, call retrieveUpdatesForChannel function.
    async.each(resultSet, retrieveUpdatesForChannel.bind(
      null, userId, response), function(err){

      if(err){
        winston.error(err);
      }

      //looking for last connection date to this project.
      sequelize.query('SELECT "disconnectedAt" ' +
                      'FROM "ProjectUsers" ' +
                      'WHERE "ProjectId" = ? ' +
                      'AND "UserId" = ? ' +
                      'AND active = true;',
                      { type: sequelize.QueryTypes.SELECT,
                        replacements: [projectId, userId]})
      .then(function(disconnectedAt) {

        if(disconnectedAt[0].disconnectedAt === undefined || disconnectedAt[0].disconnectedAt === null){
          var d = new Date();
          d.setDate(d.getDate() - 365*100);
          disconnectedAt = d;
        } else {
          disconnectedAt = disconnectedAt[0].disconnectedAt;
        }

        //looking for direct messages sent to project's users after last connection date.
        sequelize.query('SELECT DISTINCT "OriginUserId" ' +
                        ' FROM "PrivateMessages" ' +
                        ' WHERE "DestinationUserId" = ? ' +
                        ' AND "ProjectId" = ? ' +
                        ' AND "sentDateTimeUTC" > ?',
                        {
                          type: sequelize.QueryTypes.SELECT,
                          replacements: [userId, projectId, disconnectedAt]
                        })
        .then(function(users_with_updates) {
          winston.info("users_with_updates is: " + JSON.stringify(users_with_updates));
          var x;
          for(x in users_with_updates){
            response.users_with_updates.push(
              {
                'id' : users_with_updates[x].OriginUserId
              }
            );
          }
          winston.info("response finally is: " + JSON.stringify(response));
          return callback(response);
        });
      });
    });
  });
};

/**
 * Store Github message in db
 * @param  {string} message_content
 * @param  {integer} channelId
 * @param  {integer} integrationId
 * @return void
 */
module.exports.storeGithubMessage = function(message_content, channelId, integrationId) {

      // create new Message instance
      models.Message.build({
        content: message_content,
        integrationId: integrationId,
        MessageTypeId: 6,
        ChannelId: channelId,
        sentDateTimeUTC: new Date().getTime()
      }).save();
};

/**
 * Store Trello message in db
 * @param  {string} message_content
 * @param  {integer} channelId
 * @param  {integer} integrationId
 * @return void
 */
module.exports.storeTrelloMessage = function(message_content, channelId, integrationId) {

      // create new Message instance
      models.Message.build({
        content: message_content,
        integrationId: integrationId,
        MessageTypeId: 7,
        ChannelId: channelId,
        sentDateTimeUTC: new Date().getTime()
      }).save();
};

/**
 * Store StatusCake message in db
 * @param  {string} message_content
 * @param  {integer} channelId
 * @param  {integer} integrationId
 * @return void
 */
module.exports.storeStatusCakeMessage = function(message_content, channelId, integrationId) {

      // create new Message instance
      models.Message.build({
        content: message_content,
        integrationId: integrationId,
        MessageTypeId: 8,
        ChannelId: channelId,
        sentDateTimeUTC: new Date().getTime()
      }).save();
};

module.exports.retrieveMessagesById = function(message_id, limit, direction,
  channel_id, project_id, isDirect, requesterId, callback) {

  var result = {};

  //Setting default limit.
  if(!limit || isNaN(limit) || limit < 1){
    limit = 10;
  }

  if(!direction || (direction !== "forwards" && direction !== "backwards")){
    direction = "forwards";
  }

  if(isDirect){
    var channel_identifier = 'Direct_' + requesterId + '_' + channel_id;

    if(parseInt(channel_id) < parseInt(requesterId)){
      channel_identifier = 'Direct_' + channel_id + '_' + requesterId;
    }

    if(direction === "forwards"){
      sequelize.query(direct_channel_messages_forwards,
                      {
                        type: sequelize.QueryTypes.SELECT,
                        replacements: {
                          message_id: message_id,
                          limit: limit,
                          channel_id: channel_identifier,
                          project_id: project_id
                        },
                          escapeValues: false
                      })
      .then(function(messagesResult) {
        result.code = 200;
        result.message = {
                          messages: formatMessagesForRetrievalById(messagesResult)
                        };
        return callback(result);
      });
    } else {
      sequelize.query(direct_channel_messages_backwards,
                      {
                        type: sequelize.QueryTypes.SELECT,
                        replacements: {
                          message_id: message_id,
                          limit: limit,
                          channel_id: channel_identifier,
                          project_id: project_id
                        },
                          escapeValues: false
                      })
      .then(function(messagesResult) {
        result.code = 200;
        result.message = {
                          messages: formatMessagesForRetrievalById(messagesResult)
                        };
        return callback(result);
      });
    }
  } else {
      if(direction === "forwards"){

        sequelize.query(common_channel_messages_forwards,
                        {
                          type: sequelize.QueryTypes.SELECT,
                          replacements: {
                            message_id: message_id,
                            limit: limit,
                            channel_id: channel_id
                          },
                            escapeValues: false
                        })
        .then(function(messagesResult) {
          result.code = 200;
          result.message = {
                            messages: formatMessagesForRetrievalById(messagesResult)
                          };
          return callback(result);
        });
      } else {
        sequelize.query(common_channel_messages_backwards,
                        {
                          type: sequelize.QueryTypes.SELECT,
                          replacements: {
                            message_id: message_id,
                            limit: limit,
                            channel_id: channel_id
                          },
                            escapeValues: false
                        })
        .then(function(messagesResult) {
          result.code = 200;
          result.message = {
                            messages: formatMessagesForRetrievalById(messagesResult)
                          };
          return callback(result);
        });
      }
    }
};
/*
* Formats and orders messages to be returned by the service
*
*/
function formatMessages(messages){
  var messages_to_be_returned = [];
  if (messages === undefined || messages.length === 0) {
    return messages_to_be_returned;
  }

  var y;
  for (y in messages) {
    var message = {};
    if(messages[y].link !== undefined){
      message = { message: {
                                  id: messages[y].id,
                                  text: messages[y].content,
                                  link: messages[y].link || "",
                                  user: messages[y].UserId,
                                  type: messages[y].MessageType.id,
                                  date: messages[y].sentDateTimeUTC,
                                  integrationId: messages[y].integrationId
                                }
                              };
    }else{
      message = { message: {
                                  id: messages[y].id,
                                  text: messages[y].content,
                                  user: messages[y].OriginUserId,
                                  destinationUser: messages[y].DestinationUserId,
                                  type: messages[y].MessageType.id,
                                  date: messages[y].sentDateTimeUTC,
                                  integrationId: messages[y].integrationId
                                }
                              };
    }
    messages_to_be_returned.push(message);
  }
  return messages_to_be_returned;
}

/*
* Formats and orders messages to be returned by the service
*
*/
function formatMessagesForRetrievalById(messages){
  var messages_to_be_returned = [];
  if (messages === undefined || messages.length === 0) {
    return messages_to_be_returned;
  }

  var y;
  for (y in messages) {
    var message = {};
    if(messages[y].link !== undefined){
      message = { message: {
                                  id: messages[y].id,
                                  text: messages[y].content,
                                  link: messages[y].link || "",
                                  user: messages[y].UserId,
                                  type: messages[y].MessageTypeId,
                                  date: messages[y].sentDateTimeUTC,
                                  integrationId: messages[y].integrationId
                                }
                              };
    }else{
      message = { message: {
                                  id: messages[y].id,
                                  text: messages[y].content,
                                  user: messages[y].OriginUserId,
                                  destinationUser: messages[y].DestinationUserId,
                                  type: messages[y].MessageTypeId,
                                  date: messages[y].sentDateTimeUTC,
                                  integrationId: messages[y].integrationId
                                }
                              };
    }
    messages_to_be_returned.push(message);
  }
  return messages_to_be_returned;
}

/*
* Returns count of unseen messages for provided user at provided channel
*/
function retrieveUpdatesForChannel(user_id, response, channel_row, callback){

  var disconnectedAt = channel_row.disconnectedAt;

  if(disconnectedAt === undefined || disconnectedAt === null){
    console.log('era undefined')
    disconnectedAt = new Date().setDate(new Date().getDate() - 365 * 100);
  }

  //looking for messages sent to channel after disconnectedAt.
  sequelize.query('SELECT COUNT(M.*) ' +
                  'FROM "Messages" M ' +
                  'WHERE M."ChannelId" = ? ' +
                  'AND M."sentDateTimeUTC" > ?;',
                  {
                    type: sequelize.QueryTypes.SELECT,
                    replacements: [channel_row.ChannelId, disconnectedAt]
                  }).
  then(function(result) {
    winston.info("count for channel " + channel_row.ChannelId + " is: " + JSON.stringify(result[0].count));
    if(parseInt(result[0].count) > 0){
      response.channels_with_updates.push(
        {
          'id' : channel_row.ChannelId,
          'count' : parseInt(result[0].count)
        }
      );
    }
    callback();
  });
}

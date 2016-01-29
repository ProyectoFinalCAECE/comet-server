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

      //looking for last connection date to this project.
      var last_seen_at = new Date();
      sequelize.query('UPDATE "ProjectUsers" ' +
                      ' SET "disconnectedAt" = ? ' +
                      ' WHERE "UserId" = ? AND "ProjectId" = ?;',
                      { type: sequelize.QueryTypes.UPDATE, replacements: [ last_seen_at, data.userId, data.projectId]});
};


/*
* Retrieve messages from db by channelId. Allows pagination.
*
*/
module.exports.getProjectChannelsUpdates = function(projectId, userId, callback) {
  var result = {
                  channels_with_updates: [],
                  users_with_updates: []
                };

  if(projectId === undefined || userId === undefined){
      return callback(result);
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

    //looking for messages sent to project's channels after last connection date.
    sequelize.query('SELECT DISTINCT "ChannelId" ' +
                      ' FROM "Messages" ' +
                      ' WHERE "ChannelId" IN ( ' +
                      	' SELECT "ChannelId" ' +
                      	' FROM "ChannelUsers" ' +
                      	'WHERE "ChannelUsers"."UserId" = ? ' +
                      	' AND "ChannelUsers".active = true ' +
                      	' AND "ChannelUsers"."ChannelId" IN ( ' +
                      		' SELECT id ' +
                      		' FROM "Channels" ' +
                      		' WHERE "ProjectId" = ? ' +
                      		' AND state = \'O\' ' +
                      	' ) ' +
                      ') ' +
                      ' AND "sentDateTimeUTC" > ?;',
                    { type: sequelize.QueryTypes.SELECT,
                      replacements: [userId, projectId, disconnectedAt]})
    .then(function(channel_with_updates) {
      console.log("channel_with_updates is: " + JSON.stringify(channel_with_updates));
      var x;
      for(x in channel_with_updates){
        result.channels_with_updates.push({'id':channel_with_updates[x].ChannelId});
      }
      console.log("result is: " + JSON.stringify(result));

      //looking for direct messages sent to project's users after last connection date.
      sequelize.query('SELECT DISTINCT "OriginUserId" ' +
                        ' FROM "PrivateMessages" ' +
                        ' WHERE "DestinationUserId" = ? ' +
                        ' AND "ProjectId" = ? ' +
                        ' AND "sentDateTimeUTC" > ?',
                      { type: sequelize.QueryTypes.SELECT,
                        replacements: [userId, projectId, disconnectedAt]})
      .then(function(users_with_updates) {
        console.log("users_with_updates is: " + JSON.stringify(users_with_updates));
        var x;
        for(x in users_with_updates){
          result.users_with_updates.push({'id':users_with_updates[x].OriginUserId});
        }
        console.log("result is: " + JSON.stringify(result));
        return callback(result);
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
  channel_id, project_id, callback) {

  var result = {};

  //Setting default limit.
  if(!limit){
    limit = 10;
  }

  if(!direction){
    direction = "forwards";
  }

  if(isNaN(channel_id)){

    if(direction === "forwards"){
      sequelize.query(direct_channel_messages_forwards,
                      {
                        type: sequelize.QueryTypes.SELECT,
                        replacements: {
                          message_id: message_id,
                          limit: limit,
                          channel_id: channel_id,
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
                          channel_id: channel_id,
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

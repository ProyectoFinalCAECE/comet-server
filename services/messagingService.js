"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');

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
          MessageTypeId: 1,
          ChannelId: data.room,
          sentDateTimeUTC: new Date().getTime()
        });
      } else {
        message = models.PrivateMessage.build({
          content: data.message.message.text,
          OriginUserId: parseInt(data.message.message.user),
          DestinationUserId: parseInt(data.message.message.destinationUser),
          MessageTypeId: 1,
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

    models.PrivateMessage.findAll({ where: ['"channel" = ?', channel_identifier], order: [['sentDateTimeUTC', 'DESC']], offset: offset, limit: limit }).then(function(messages){
      result.code = 200;
      result.message = {
                        messages: formatMessages(messages),
                        next_offset: parseInt(offset)+parseInt(limit)
                      };
      return callback(result);
    });
  } else {
    models.Message.findAll({ where: ['"ChannelId" = ?', channelId], order: [['sentDateTimeUTC', 'DESC']], offset: offset, limit: limit }).then(function(messages){
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
                                  type: 'T',
                                  date: messages[y].sentDateTimeUTC
                                }
                              };
    }else{
      message = { message: {
                                  id: messages[y].id,
                                  text: messages[y].content,
                                  user: messages[y].OriginUserId,
                                  destinationUser: messages[y].DestinationUserId,
                                  type: 'T',
                                  date: messages[y].sentDateTimeUTC
                                }
                              };
    }
    messages_to_be_returned.push(message);
  }
  return messages_to_be_returned;
}

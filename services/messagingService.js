"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');
var validator = require('validator');

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
      var message = models.Message.build({
        content: data.message.message.text,
        UserId: data.message.message.user,
        MessageTypeId: 1,
        ChannelId: data.room,
        sentDateTimeUTC: new Date()
      });
      message.save();
};

/*
* Retrieve messages from db by channelId. Allows pagination.
*
*
*/
module.exports.retrieveMessages = function(channelId, offset, limit, callback) {

  if(offset === undefined){
    offset = 0;
  }

  if(limit === undefined){
    limit = 10;
  }

  var result = {};

  models.Message.findAll({ where: ['"ChannelId" = ?', channelId], order: [['sentDateTimeUTC', 'DESC']], offset: offset, limit: limit }).then(function(messages){
    result.code = 200;
    result.message = {
                      messages: formatMessages(messages),
                      next_offset: parseInt(offset)+parseInt(limit)
                    };
    return callback(result);
  });
};


function formatMessages(messages){
  var messages_to_be_returned = [];
  if (messages === undefined || messages.length === 0) {
    return messages_to_be_returned;
  }

  var y;
  for (y in messages) {
      messages_to_be_returned.push({
                                id: messages[y].id,
                                text: messages[y].content,
                                link: messages[y].link || "",
                                user: messages[y].UserId,
                                type: 'T',
                                date: messages[y].sentDateTimeUTC
                              });
  }
  return messages_to_be_returned;
}

"use strict";

/**

 * Module dependencies

 */

var socketio = require('socket.io');
var messagingService  = require('../services/messagingService');
var models  = require('../models');
var socketioJwt = require('socketio-jwt');

module.exports.listen = function(app){

    var io = socketio.listen(app);

    var message_socket = io.of('/messages');

    var notification_socket = io.of('/notification');

    notification_socket.use(socketioJwt.authorize({
      secret: 'mySecretPassword',
      handshake: true
    }));

    message_socket.use(socketioJwt.authorize({
      secret: 'mySecretPassword',
      handshake: true
    }));

    //namespace to handle notifications
    notification_socket.on('connection', function(socket){

      socket.join('SELF_' + socket.decoded_token._id);

      socket.on('join-room', function(data){
        socket.join(data.room);
        messagingService.getProjectChannelsUpdates(data.projectId, data.userId, function(updates){
            socket.emit('channels-updates', updates);
        });
      });

      //on ping save last activity date
      socket.on("ping", function(data) {
          messagingService.storeDisconnectionDate(data);
          console.log("pong");
      });

      //on typing, broadcast everyone but typer
      socket.on("typing", function(data) {
          socket.broadcast.emit("typing", {typing: data.typing, msg: data.who + ' is typing..'});
      });
    });

    //namespace to handle channel rooms and messages
    message_socket.on('connection', function(socket){
      socket.on('join-room', function(data){
        socket.join(data.room);
      });

      //on chat message, broadcast to everyone but sender
      socket.on('message', function(data){
        if(data.message.message.text.length <= models.Message.contentLength()){
          socket.broadcast.to(data.room).emit('message', data.message);
          if(data.message.message.destinationUser === undefined ||
            data.message.message.destinationUser === null ||
            data.message.message.destinationUser === 0){
            notification_socket.to(data.project_room).emit("transient-notification", {type:"channel", id: data.room});
          } else {
            //QUE PASA CON CANALES PRIVADOS DEL PROYECTO?
            //DIRECT MESSAGES. USER SHOULD JOIN SELF ROOM TO BE NOTIFIED OF PRIVATE MESSAGES
            notification_socket.to('SELF_' + data.message.message.destinationUser).emit("transient-notification", {type:"direct", id: data.message.message.user});
          }
          messagingService.storeMessage(data);
        } else {
          socket.emit('message-error', "message too long.");
        }
      });

      socket.on('leave-room', function(data){
        console.log('hello message_socket sockets on leave! ', socket.decoded_token);
        socket.leave(data.room);
      });

      socket.on('disconnect', function(){
        console.log('hello message_socket sockets on disconnect! ', socket.decoded_token);
      });
    });

    /*notification_socket.on('connection', function(socket){
      //on connection broadcast message to other connected users
      socket.broadcast.emit('connection', {connected: true, user: socket.handshake.query.user, namespace: schoolSocket.name +' namespace'});


      //add user to online users
      online_users_school.push(socket.handshake.query.user);

      socket.on('ready', function() {
          online_users_school.forEach(function(user, index) {
          socket.emit('connection', {connected: true, user: user, namespace: schoolSocket.name +' namespace'});
        });
      });

      //on disconnect event broadcast message to other connected users
      socket.on('disconnect', function(){
        //remove user from online users
        socket.broadcast.emit('connection', {connected: false, user: socket.handshake.query.user});
        online_users_school.splice(online_users_school.indexOf(socket.handshake.query.user), 1);
      });
    });*/

    return io;
};

"use strict";

/**

 * Module dependencies

 */

var socketio = require('socket.io');
var messagingService  = require('../services/messagingService');
var channelService  = require('../services/channelService');
var models  = require('../models');
var socketioJwt = require('socketio-jwt');

module.exports.listen = function(app){

    var io = socketio.listen(app);

    var message_socket = io.of('/messages');

    var notification_socket = io.of('/notification');

    var connected_clients = {};

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

        //To this new online, send all the previously existent ones
        console.log("connected_clients[data.room] is: ", connected_clients[data.room]);
        if(connected_clients[data.room] !== undefined){
          var x;
          for(x in connected_clients[data.room][x]){
            console.log("connected_clients[data.room][x] is: ", connected_clients[data.room][x]);
            socket.emit("online-users", {type:"add", id: connected_clients[data.room][x].id});
          }
        } else {
          console.log("la room todavia es undefined");
        }
        //console.log("emitiendo");
        addToOnlineUsers(data.room, socket.decoded_token, function(){
          //Emit online user to all users in room
          notification_socket.to(data.room).emit("online-users", {type:"add", id: socket.decoded_token._id});
          //console.log("broadcasteee");
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

      socket.on('leave-room', function(data){
        socket.leave(data.room);
        removeFromOnlineUsers(data.room, socket.decoded_token, function(){
          //Emit online user to all users in room
          notification_socket.to(data.room).emit("online-users", {type:"remove", id: socket.decoded_token._id});
        });
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
          if(isNaN(data.room)){
            //Direct channel
            notification_socket.to('SELF_' + data.message.message.destinationUser).emit("transient-notification", {type:"direct", id: data.message.message.user});
          } else {
            if(data.channel_type === 'P'){
              //Group and private channel

              //send notifications to each active member of the groupal private channel
              channelService.getChannelActiveMembers(data.room, function(members){
                  var x;
                  for(x in members){
                    notification_socket.to('SELF_' + members[x]).emit("transient-notification", {type:"private-channel", id: data.room});
                  }
              });
            } else {
              //Group and shared channel
              notification_socket.to(data.project_room).emit("transient-notification", {type:"channel", id: data.room});
            }
          }
          messagingService.storeMessage(data);
        } else {
          socket.emit('message-error', "message too long.");
        }
      });

      socket.on('leave-room', function(data){
        console.log('bye message_socket sockets on leave! ', socket.decoded_token);
        socket.leave(data.room);
      });

      socket.on('disconnect', function(){
      });
    });

    // Given a socket token, stores it at a room structure to keep track of online users.
    function addToOnlineUsers(room, decoded_token, callback){
      console.log("addToOnlineUsers");
      if(connected_clients[room] === undefined){
        connected_clients[room] = [];
        console.log("cree el array");
      }
      //delete if existed
      connected_clients[room] = connected_clients[room]
             .filter(function (el) {
                      return el.id !== decoded_token._id;
                     });
      //add again
      connected_clients[room].push({id: decoded_token._id});
      console.log("now connected_clients is: ", connected_clients);
      callback();
    }

    function removeFromOnlineUsers(room, decoded_token, callback){
      console.log("removeFromOnlineUsers");
      if(connected_clients[room] !== undefined){
        console.log("no era undefined");

        connected_clients[room] = connected_clients[room]
               .filter(function (el) {
                        return el.id !== decoded_token._id;
                       });
      }
      console.log("now connected_clients is: ", connected_clients);
      callback();
    }
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

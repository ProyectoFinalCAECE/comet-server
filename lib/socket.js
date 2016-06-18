"use strict";

/**

 * Module dependencies

 */

var socketio = require('socket.io');
var messagingService  = require('../services/messagingService');
var channelService  = require('../services/channelService');
var projectService  = require('../services/projectService');
var models  = require('../models');
var socketioJwt = require('socketio-jwt');

var redis = require('socket.io-redis');
var outside_io = require("socket.io-emitter")({ host: '127.0.0.1', port: 6379 });
var winston = require('winston');


module.exports.listen = function(app){

    var io = socketio.listen(app);

    io.adapter(redis({ host: 'localhost', port: 6379 }));

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
        if(connected_clients[data.room] !== undefined){
          var x;
          for(x in connected_clients[data.room]){
            socket.emit("online-users", {type:"add", id: connected_clients[data.room][x].id});
          }
        }

        addToOnlineUsers(data.room, socket.decoded_token, function(){
          //Emit online user to all users in room
          notification_socket.to(data.room).emit("online-users", {type:"add", id: socket.decoded_token._id});
        });
      });

      //on ping save last activity date
      socket.on("ping", function(data) {
          messagingService.storeDisconnectionDate(data);
      });

      socket.on('leave-room', function(data){
        socket.leave(data.room);
        removeFromOnlineUsers(data.room, socket.decoded_token, function(){
          //Emit online user to all users in room
          notification_socket.to(data.room).emit("online-users", {type:"remove", id: socket.decoded_token._id});

          //save last activity date
          messagingService.storeDisconnectionDate(data);
        });
      });

      socket.on('system', function(data){
        winston.info('data: ', data);
        /*
          data={
            projectId: projectId,
            userId: userId,
            content: content,

              }
        */

        projectService.getProjectMembers(data.projectId, function(member_ids){
            if(member_ids !== null && member_ids !== undefined){
              var memberId;
              for(memberId in member_ids){
                  socket.to('SELF_' + memberId).emit("system", { data : data });
                  winston.info("emiti al id: ", memberId);
              }
            }
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
          //set UTC +00 date before broadcast.
          data.message.message.date = new Date().getTime();
          //broadcast message to provided room.
          socket.broadcast.to(data.room).emit('message', data.message);
          if(isNaN(data.room)){
            //Direct channel
            notification_socket.to('SELF_' + data.message.message.destinationUser).emit("transient-notification", {type:"direct", id: data.message.message.user, projectId: data.message.message.projectId});
          } else {
            if(data.channel_type === 'P'){
              //Group and private channel

              //send notifications to each active member of the groupal private channel
              channelService.getChannelActiveMembers(data.room, function(members){
                  var x;
                  for(x in members){
                    notification_socket.to('SELF_' + members[x]).emit("transient-notification", {type:"private-channel", id: data.room, projectId: data.message.message.projectId, source_user_id: data.message.message.user});
                  }
              });
            } else {
              //Group and shared channel
              notification_socket.to(data.project_room).emit("transient-notification", {type:"channel", id: data.room, source_user_id: data.message.message.user});
            }
          }
          messagingService.storeMessage(data);
        } else {
          socket.emit('message-error', "message too long.");
        }
      });

      //on typing, broadcast everyone but typer
      socket.on("typing", function(data) {
        socket.broadcast.to(data.room).emit( "typing", { typing: data.typing, msg: data.who + ' is typing..' } );
      });

      //on ping save last activity date
      socket.on("ping", function(data) {
          messagingService.storeChannelDisconnectionDate(data);
      });

      socket.on('leave-room', function(data){
        socket.leave(data.room);
        messagingService.storeChannelDisconnectionDate(data);
      });

      socket.on('disconnect', function(){
      });
    });

    // Given a socket token, stores it at a room structure to keep track of online users.
    function addToOnlineUsers(room, decoded_token, callback){
      if(connected_clients[room] === undefined){
        connected_clients[room] = [];
      }

      //delete if existed
      connected_clients[room] = connected_clients[room]
             .filter(function (el) {
                      return el.id !== decoded_token._id;
                     });

      //add again
      connected_clients[room].push({id: decoded_token._id});
      callback();
    }

    function removeFromOnlineUsers(room, decoded_token, callback){
      if(connected_clients[room] !== undefined){

        connected_clients[room] = connected_clients[room]
               .filter(function (el) {
                        return el.id !== decoded_token._id;
                       });
      }

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


module.exports.systemEmit = function(projectId, data){

  projectService.getProjectMembers(projectId, function(member_ids){
      if(member_ids !== null && member_ids !== undefined){
        /*
          data={
            projectId: projectId,
            userId: userId,
            content: content,

              }
        */
        var x;
        for(x in member_ids){
            outside_io.of('/notification').to('SELF_' + member_ids[x].id).emit("system", { data : data });
        }
      }
  });

};

module.exports.broadcastIntegrationMessage = function (project_room, room, message){
  outside_io.of('/messages').to(room).emit('message', message);
  outside_io.of('/notification').to(project_room).emit('transient-notification', {type:"channel", id: room});
};

module.exports.broadcastVideocallMessage = function (project_room, room, message){
  outside_io.of('/messages').to(room).emit('message', message);
  outside_io.of('/notification').to(project_room).emit('transient-notification', {type:"channel", id: room});
};

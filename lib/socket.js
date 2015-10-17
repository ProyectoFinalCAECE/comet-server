"use strict";

/**

 * Module dependencies

 */

var socketio = require('socket.io');

module.exports.listen = function(app){
    var io = socketio.listen(app);

    var message_socket = io.of('/messages');
    //var notification_socket = io.of('/notification');

    //var online_users_chat = [];
    //var online_users_school = [];


    message_socket.on('connection', function(socket){
      console.log('se conecto uno');
      console.log('socket: ' + socket);

      socket.on('join-room', function(data){
        console.log('data.room: ' + data.room);
        socket.join(data.room);
      });

      //on chat message, broadcast to everyone but sender
      socket.on('message', function(data){
        console.log('data: ' + data.message);
        socket.broadcast.to(data.room).emit('message', data.message);
      });

      socket.on('leave-room', function(data){
        console.log('data.room: ' + data.room);
        socket.leave(data.room);
      });

      //on typing, broadcast everyone but typer
      socket.on("typing", function(data) {
          socket.broadcast.emit("typing", {typing: data.typing, msg: data.who + ' is typing..'});
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
    });*

    return io;
};

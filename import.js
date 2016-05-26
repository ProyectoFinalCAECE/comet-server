"use strict";
var async = require('async');
var express = require('express');
var logger = require('morgan');
var Q = require('q');
require('./config/passport');
var models  = require('./models');

(function () {
    
    var maxUsers = 100,
        maxProjects = 110,              // para 1 millon de msj
        //maxProjects = 310,              // para 3 millones de msj
        //maxProjects = 510,              // para 5 millones de msj
        channelsPerProject = 100,
        messagesPerChannel = 100,
        startDate = new Date();
    
    batchImport();
    

    //____________________________________________________________________________________

    function batchImport () {
        
        console.log('## Import - Start');
        console.log('## Users:', maxUsers);
        console.log('## Projects:', maxProjects);
        
        cleanTables()
            .then(batchCreateUsers)
            .then(batchCreateProjects)
            .then(function () {
                console.log('## Import - End'); 
            });
    }

    //____________________________________________________________________________________

    function cleanTables() {
        return models.sequelize.query('TRUNCATE TABLE "Users" RESTART IDENTITY CASCADE;' +  
                                    ' TRUNCATE TABLE "Projects" RESTART IDENTITY CASCADE', 
                            { type: models.sequelize.QueryTypes.RAW});
    }
    
    //____________________________________________________________________________________

    function batchCreateUsers() {
        
        return asyncIterarion(function (i) {
            return createUser(i);
        }, maxUsers);
        
    }
    //____________________________________________________________________________________

    function batchCreateProjects() {
        
        var calls =  [];
        
        for (var i = 0; i < maxProjects; i++) {
            calls.push(i+1);
        }
        
        return calls.reduce(function (soFar, index) {
            return soFar.then(function() {
                console.log('------------------------------------------');
                return createProject(index);
            });
        }, Q());
    }

    //____________________________________________________________________________________

    function createProject(index) {
        
        console.log('createProject', index);
        
        var project = models.Project.build({
            name: 'Proyecto ' + index,
            description: 'Proyecto de prueba de stress - ' + index
        });
            
        return project.save()
            .then(addProjectIntegrations)
            .then(addProjectUsers)
            .then(addProjectChannels)
            .then(function () {
                return index;
            })
            .catch(function (err) {
                console.log("createProject error", index, err)
                return index;
            });;
    }
    
    //____________________________________________________________________________________
    
    function addProjectIntegrations (project) {
        
        var query = 'INSERT INTO "ProjectIntegrations"(active, "createdAt", "updatedAt", "IntegrationId", "ProjectId") ' +
                     'VALUES (true, NOW(), NOW(), 1, :projectId);';
                     
        query += 'INSERT INTO "ProjectIntegrations"(active, "createdAt", "updatedAt", "IntegrationId", "ProjectId") ' +
                    'VALUES (true, NOW(), NOW(), 2, :projectId);';
                    
        query += 'INSERT INTO "ProjectIntegrations"(active, "createdAt", "updatedAt", "IntegrationId", "ProjectId") ' +
                    'VALUES (true, NOW(), NOW(), 3, :projectId);' 
        
        return models.sequelize.query(query,{ 
                replacements: { 
                    projectId: project.id 
                }, 
                type: models.sequelize.QueryTypes.INSERT
            }).then(function () {
                return project;
            });
    }
    
    //____________________________________________________________________________________
    
    function addProjectUsers(project) {
        
        var totalUsers = getRandomInt(1, 5),
            projectUsers = [],
            query = '';
            
        console.log('addProjectUsers - project ', project.id, 'totalUsers', totalUsers);
        
        for (var i = 0; i < totalUsers; i++) {
            
            var user = getRandomInt(1, maxUsers);
            if (i === 0) {
                user = 1;
            }
            
            projectUsers.push(user);
            
            query += 'INSERT INTO "ProjectUsers"' + 
                    '("isOwner", active, "severedAt", "createdAt", "updatedAt", "UserId", "ProjectId", "disconnectedAt") ' +
                    'VALUES (false, true, NULL, NOW(), NOW(),' + user +  ',' + project.id + ', NULL);';
        }
        
        return models.sequelize
                     .query(query, { type: models.sequelize.QueryTypes.INSERT})
                     .then(function () {
                         return { 
                            project: project, 
                            projectUsers: projectUsers
                        }
                     });
    }
    
    //____________________________________________________________________________________
    
    function asyncIterarion(promiseFunction, totalIterations) {
        
        var deferred = Q.defer(),
            totalFinished = 0;
        
        for (var i = 1; i <= totalIterations; i++) {
            
            promiseFunction(i)
                .finally(function () {
                    totalFinished++;
                    if (totalFinished === totalIterations) {
                        deferred.resolve();
                    }
                });
        }
            
        return deferred.promise;
    }
    
    //____________________________________________________________________________________
    
    function addProjectChannels (params) {
        
        console.log('addProjectChannels');
        
        return asyncIterarion(function (i) {
            return createChannel(params.project.id, i, params.projectUsers);
        }, channelsPerProject);
        
    }
    
    //____________________________________________________________________________________
    
    function createChannel(projectId, index, projectUsers) {
        
        var channel = models.Channel.build({
            name: 'Test channel ' + projectId + ' - ' + index,
            description: 'Canal ' + projectId + ' - ' + index + ' para prueba de stress',
            type: 'S',
            ProjectId: projectId
          });

         return channel.save()
         .then(function (createdChannel) {
            //console.log('channel created', createdChannel.id);
            return addUsersToChannel(createdChannel, projectUsers)
         })
         .then(createMessagesForChannel);
    }
    
    //____________________________________________________________________________________
    
    function addUsersToChannel(channel, projectUsers) {
        
        var query = '',
            totalUsers = getRandomInt(1, projectUsers.length);
        
        for (var i = 0; i < totalUsers; i++) {
            query += 'INSERT INTO "ChannelUsers"(active, "severedAt", "createdAt", "updatedAt", "UserId", "ChannelId") ' +  
                     'VALUES (true, NULL, NOW(), NOW(), ' + projectUsers[i] + ',' + channel.id + ');';
        }
        
        return models.sequelize
                    .query(query, { type: models.sequelize.QueryTypes.INSERT})
                    .then(function () {
                        //console.log('addUsersToChannel:', channel.id, ' totalUsers', totalUsers, 'Ok');
                        return {
                            channel: channel,
                            projectUsers: projectUsers
                        }
                    });
    }
    
    //____________________________________________________________________________________
    
    function createMessagesForChannel(params) {
        
        var deferred = Q.defer(),
            totalFinished = 0,
            query = '',
            totalMessages = messagesPerChannel;
        
        // query the message_model table looking for random content
        return models.sequelize
            .query('select content from "messages_model" where random() < 0.01 limit ?',
            { 
                replacements: [totalMessages], 
                type:  models.sequelize.QueryTypes.SELECT 
            }
        ).then(function(contenidos) {
            
            // create a batch insert sql statement
            for (var i = 0; i < totalMessages; i++) {
                query += createMessage(params.channel.id, i, params.projectUsers, contenidos[i].content); 
            }
        
            return models.sequelize
                    .query(query, { type: models.sequelize.QueryTypes.INSERT});      
        })
    }
    
    //____________________________________________________________________________________
    
    function createMessage(channelId, index, projectUsers, content) {
        
        // takes one random user from the project
        var userId = projectUsers[getRandomInt(0, projectUsers.length)];
        // the userId = 1 has bias
        if (index == 0) {
            userId = 1;
        }
        
        // add seconds
        startDate.setSeconds(startDate.getSeconds() + getRandomInt(1, 20));
        
        var link = '\'\'',
            sentDate = startDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');
        
        // build the SQL sentence
        return 'INSERT INTO "Messages" ("id","content","link","sentDateTimeUTC","ChannelId","UserId",' + 
                 '"MessageTypeId","updatedAt","createdAt")' +
                 ' VALUES (DEFAULT,\'' + content + '\',' + link + ',\'' + sentDate + '\',' + channelId + ',' + 
                  userId + ',1,\'' + sentDate + '\',\'' + sentDate + '\');';
    }

    //____________________________________________________________________________________

    function createUser (index) {
        
        // create new User instance
        var user = models.User.build({
            email: 'testuser' + index + '@test.com',
            firstName: 'Test',
            lastName: 'User ' + index
        });

        //populating other user record fields
        user.setPassword('Test123');
        user.profilePicture = '../../images/404.png';
        user.alias = user.firstName.toLowerCase() + user.lastName.toLowerCase();
        user.searchable_text =
            user.firstName+' '+
            user.lastName+' '+
            user.alias+' '+
            user.email.slice(0, user.email.indexOf('@'));

        // save User
        return user.save()
            .then(function(createdUser) {
                // User created successfully
                console.info('created ok - [' + index + ']')
            }).catch(function(err) {
                // error while saving
                console.error('cant create user', user);
            });
    }    

    //____________________________________________________________________________________

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    
    //____________________________________________________________________________________
})();
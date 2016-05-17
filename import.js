"use strict";

var express = require('express');
var logger = require('morgan');
var Q = require('q');
require('./config/passport');
var models  = require('./models');

(function () {
    
    var maxUsers = 100,
        maxProjects = 5,
        channelsPerProject = 10,
        messagesPerChannel = 20;
    
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

    function batchCreateProjects() {
        
        return asyncIterarion(function (i) {
            return createProject(i);
        }, maxProjects);
        
        // var deferred = Q.defer(),
        //     totalFinished = 0;
            
        // for (var i = 1; i <= total; i++) {
        //     createProject(i).finally(function (params) {
        //         totalFinished++;
        //         if (totalFinished === total) {
        //             deferred.resolve();
        //         }
        //     });
        // }
        
        // return deferred.promise;
    }

    //____________________________________________________________________________________

    function batchCreateUsers() {
        
        return asyncIterarion(function (i) {
            return createUser(i);
        }, maxUsers);
        
        
        // var deferred = Q.defer(),
        //     totalFinished = 0;
        
        // for (var i = 1; i <= total; i++) {
        //     createUser(i).finally(function () {
        //         totalFinished++;
        //         if (totalFinished === total) {
        //             deferred.resolve();
        //         }
        //     });
        // }
        
        // return deferred.promise;
    }

    //____________________________________________________________________________________

    function createProject(index) {
        
        var project = models.Project.build({
            name: 'Proyecto ' + index,
            description: 'Proyecto de prueba de stress - ' + index
        });
            
        return project.save()
            .then(addProjectIntegrations)
            .then(addProjectUsers)
            .then(addProjectChannels);
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
        
        var deferred = Q.defer(),
            totalFinished = 0,
            totalUsers = getRandomInt(1, 5),
            projectUsers = [],
            query = 'INSERT INTO "ProjectUsers"' + 
                    '("isOwner", active, "severedAt", "createdAt", "updatedAt", "UserId", "ProjectId", "disconnectedAt") ' +
                    'VALUES (false, true, NULL, NOW(), NOW(), :userId, :projectId, NULL);';
        
        for (var i = 0; i < totalUsers; i++) {
            
            var user = getRandomInt(1, maxUsers);
            if (i === 0) {
                user = 1;
            }
            
            projectUsers.push(user);
            
            models.sequelize.query(query, { 
                replacements: { 
                    userId: user, 
                    projectId: project.id 
                }, 
                type: models.sequelize.QueryTypes.INSERT
            })
            .finally(function () {
                totalFinished++;
                if (totalFinished === totalUsers) {
                    deferred.resolve( { 
                        project: project, 
                        projectUsers: projectUsers
                    });
                }
            });
        }
        
        return deferred.promise;
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
       
        
        return asyncIterarion(function (i) {
            return createChannel(params.project.id, i, params.projectUsers);
        }, channelsPerProject);
        
        // var deferred = Q.defer(),
        //     totalFinished = 0;
        
        // for (var i = 1; i <= channelsPerProject ; i++) {
        //     createChannel(project.id, i).finally(function () {
        //         totalFinished++;
        //         if (totalFinished === channelsPerProject) {
        //             deferred.resolve();
        //         }
        //     });
        // }
        
        // return deferred.promise;
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
            return addUsersToChannel(createdChannel, projectUsers)
         })
         .then(createMessagesForChannel);
    }
    
    //____________________________________________________________________________________
    
    function addUsersToChannel(channel, projectUsers) {
        
        var query = 'INSERT INTO "ChannelUsers"(active, "severedAt", "createdAt", "updatedAt", "UserId", "ChannelId") ' +  
                    'VALUES (true, NULL, NOW(), NOW(), :userId, :channelId);';
        
        var deferred = Q.defer(),
            totalFinished = 0,
            totalUsers = projectUsers.length;
        
        for (var i = 0; i < totalUsers; i++) {
            models.sequelize.query(query,
                    { replacements: { 
                        userId: projectUsers[i], 
                        channelId: channel.id 
                    }, 
                    type: models.sequelize.QueryTypes.INSERT
                })
                .finally(function () {
                    totalFinished++;
                    if (totalFinished === totalUsers) {
                        deferred.resolve({
                            channel: channel,
                            projectUsers: projectUsers
                        });
                    }
                })
        }
        
        return deferred.promise;
    }
    
    //____________________________________________________________________________________
    
    function createMessagesForChannel(params) {
        
        var deferred = Q.defer(),
            totalFinished = 0,
            totalMessages = messagesPerChannel;
            
        for (var i = 0; i < totalMessages; i++) {
            createMessage(params.channel.id, i, params.projectUsers)
                .finally(function () {
                    totalFinished++;
                    if (totalFinished === totalMessages) {
                        deferred.resolve();
                    }
                })
        }
        
        return deferred.promise;
    
        // var bulk = [];
                
        // for (var i = 1; i <= totalMessages; i++) {
        //     var msg = createMessage(channel.id, i);
        //     //bulk.push(createMessage(channel.id, i));
        // }
        
        // return models.Message.bulkCreate(bulk);
    }
    
    //____________________________________________________________________________________
    
    function createMessage(channelId, index, projectUsers) {
        
        // takes one random user from the project
        var userId = projectUsers[getRandomInt(0, projectUsers.length)];
        // the userId = 1 has bias
        if (index == 0) {
            userId = 1;
        }
        
        var message = models.Message.build({
          content: 'TEXTO - ' + channelId + ' - ' + (index + 1) ,
          link: '',
          ChannelId: channelId,
          UserId: userId,
          MessageTypeId: 1,
          sentDateTimeUTC: new Date().getTime()
        });
        
        //return message;
        return message.save();
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
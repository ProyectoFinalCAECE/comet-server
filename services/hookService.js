"use strict";

/**

 * Module dependencies

 */

var models  = require('../models');
var messagingService = require('../services/messagingService');
var socket = require('../lib/socket');

/*
* webhook request processing
*/
module.exports.processHook = function(req, token, integrationId, callback) {
  switch (integrationId) {
    case 1:
      processGitHubHook(req, token, callback);
      break;
    case 2:
      processTrelloHook(req, token, callback);
      break;
  }
};

/*
* Github webhook request processing
*/
function processGitHubHook(req, token, callback) {
  var result = {};
  result.status = 500;

  var eventType = req.headers['x-github-event'];

  // search the project integration table by token
  models.GithubIntegration.findOne({ where: { token: token } }).then(function(integrationProject) {
    if(integrationProject === null || integrationProject === undefined){
      return callback(result);
    }

    // merge the project integration config with the github event

    // build the event message
    var eventMessage = parseGitHubEvent(eventType, req.body);

    // save
    messagingService.storeGithubMessage(JSON.stringify(eventMessage), integrationProject.ChannelId, integrationProject.id);

    // broadcast
    var message = {
                    message: {
                        text: JSON.stringify(eventMessage),
                        type: 6,
                        date: new Date().getTime(),
                        integrationId: integrationProject.id
                    }
                  };

    //looking for ProjectId of channel to broadcast notifications.
    models.Channel.findById(integrationProject.ChannelId).then(function(channel){

      //broadcast
      socket.broadcastIntegrationMessage('Project_' + channel.ProjectId , integrationProject.ChannelId, message);

      result.status = 200;
      return callback(result);
    });
  });
}

/*
* Trello webhook request processing
*/
function processTrelloHook(req, token, callback) {
  var result = {};
  result.status = 200;
  return callback(result);
  //var eventType = req.headers['x-github-event'];

  // search the project integration table by token
  /*models.GithubIntegration.findOne({ where: { token: token } }).then(function(integrationProject) {
    if(integrationProject === null || integrationProject === undefined){
      return callback(result);
    }

    // merge the project integration config with the github event

    // build the event message
    var eventMessage = parseGitHubEvent(eventType, req.body);

    // save
    messagingService.storeGithubMessage(JSON.stringify(eventMessage), integrationProject.ChannelId, integrationProject.id);

    // broadcast
    var message = {
                    message: {
                        text: JSON.stringify(eventMessage),
                        type: 6,
                        date: new Date().getTime(),
                        integrationId: integrationProject.id
                    }
                  };

    //looking for ProjectId of channel to broadcast notifications.
    models.Channel.findById(integrationProject.ChannelId).then(function(channel){

      //broadcast
      socket.broadcastIntegrationMessage('Project_' + channel.ProjectId , integrationProject.ChannelId, message);

      result.status = 200;
      return callback(result);
    });
  });*/
}

/*
* Github event parsing
*/
function parseGitHubEvent(type, payload) {

  // supported events:
  // push
  // commit_comment
  // pull_request
  // issues
  // issue_comment

  var message = null;

  switch (type) {
    case 'push': {
      var commits = [];
      for (var i = 0; i < payload.commits.length; i++) {
        var githubCommit = payload.commits[i];
        commits.push({
          id: githubCommit.id,
          url: githubCommit.url,
          message: githubCommit.message,
          username: githubCommit.committer.username
        });
      }

      message = {
        type: type,
        repository: payload.repository.full_name,
        user: payload.sender.login,
        commits: commits
      };
      break;
    }
    case 'commit_comment': {
      message = {
        type: type,
        repository: payload.repository.full_name,
        user: payload.sender.login,
        commit_id: payload.comment.commit_id,
        comment: payload.comment.body,
        url: payload.comment.html_url
      };
      break;
    }
    case 'pull_request': {
      if (payload.action === 'opened') {
        message = {
          type: type,
          action: payload.action,
          repository: payload.repository.full_name,
          url: payload.pull_request.html_url,
          title: payload.pull_request.title,
          user: payload.pull_request.user.login
        };
      }

      break;
    }
    case 'issues': {
      if (payload.action === 'opened') {
        message = {
          type: type,
          repository: payload.repository.full_name,
          user: payload.sender.login,
          issue: payload.issue.title,
          issue_number: payload.issue.number,
          issue_url: payload.issue.html_url
        };
      }
      break;
    }
    case 'issue_comment': {
      message = {
        type: type,
        repository: payload.repository.full_name,
        user: payload.sender.login,
        issue: payload.issue.title,
        issue_number: payload.issue.number,
        issue_url: payload.issue.html_url,
        comment: payload.comment.body
      };
      break;
    }
  }

  return message;
}

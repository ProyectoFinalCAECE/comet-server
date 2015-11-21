"use strict";

/**

 * Module dependencies

 */
var models  = require('../models');
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "development";
var config    = require(__dirname + '/../config/sequelize.json')[env];
var socket = require('../lib/socket');

/*
* webhook request processing
*/
module.exports.processHook = function(req, token, integrationId) {

  switch (integrationId) {
    case 2:
      processsGitHubHook(req, token);
      break;
  }

};

/*
* Github webhook request processing
*/
function processsGitHubHook(req, token) {

  console.log('####### processsGitHubHook', token);
  var eventType = req.headers['x-github-event'];

  // search the project integration table by token
  //models.integrationDropbox.findOne({ where: { token: token } }).then(function(integrationProject) {
  //  console.log('processsHookGitHub - registro', integrationProject);
  //});

  // merge the project integration config with the github event

  // build the event message
  var eventMessage = parseGitHubEvent(eventType, req.body);
  console.log('##### integration message', eventMessage);

  // save

  // broadcast


  console.log('####### processsGitHubHook - FIN #####');
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

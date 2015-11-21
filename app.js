"use strict";

/**

 * Module dependencies

 */

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

/**

 * Custom dependencies

 */

require('./config/passport');

var routes = require('./routes/index');
var users  = require('./routes/users');
var accounts  = require('./routes/accounts');
var projects  = require('./routes/projects');
var channels  = require('./routes/channels');
var messages  = require('./routes/messages');
var integrations  = require('./routes/integrations');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//declare a function that will pass primary router's params to the request
var passPrimaryParams = function(req, res, next) {
    req.primaryParams = req.params;
    next();
};

// routes
app.use('/', routes);
app.use('/users/', users);
app.use('/accounts/', accounts);
app.use('/projects/', projects);
app.use('/projects/:project_id/channels', passPrimaryParams);
app.use('/projects/:project_id/channels', channels);
app.use('/projects/:project_id/channels/:channel_id/messages', passPrimaryParams);
app.use('/projects/:project_id/channels/:channel_id/messages', messages);
app.use('/integrations', integrations);

//static route to serve account profile images
app.use('/static', express.static('avatar_images'));

/**
 * Development Settings
 */
if (app.get('env') === 'development') {
    // This will change in production since we'll be using the dist folder
    app.use(express.static(path.join(__dirname, '../comet-client')));
    // This covers serving up the index page
    app.use(express.static(path.join(__dirname, '../comet-client/.tmp')));
    app.use(express.static(path.join(__dirname, '../comet-client/app')));

    // Handle 404
    app.use(function(req, res) {
        res.status(404);
        res.sendfile(path.join(__dirname, '../comet-client/app/') + '404.html');
    });

    // Error Handling
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        if (req.xhr) {
            res.json(err);
        }
        else {
            res.render('error', {
                message: err.message,
                error: err
            });
        }
    });
}

/**
 * Production Settings
 */
if (app.get('env') === 'production') {

    // changes it to use the optimized version for production
    app.use(express.static(path.join(__dirname, '/dist')));

    // Handle 404
    app.use(function(req, res) {
        res.status(404);
        res.sendfile(path.join(__dirname, '/dist/') + '404.html');
    });

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        if (req.xhr) {
            res.json(err);
        }
        else {
            res.render('error', {
                message: err.message,
                error: {}
            });
        }
    });
}

module.exports = app;

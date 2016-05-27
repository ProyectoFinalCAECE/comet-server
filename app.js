"use strict";

/**

 * Module dependencies

 */
//require('newrelic');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var winston = require('winston');
// Added helmet to force use of SSL/HTTPS
var helmet = require('helmet');

winston.add(winston.transports.File, {
                                        filename: 'comet.log',
                                        colorize: true,
                                        timestamp: true,
                                      });

/**

 * Custom dependencies

 */

require('./config/passport');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());

//declare a function that will pass primary router's params to the request
var passPrimaryParams = function(req, res, next) {
    req.primaryParams = req.params;
    next();
};

/**
 * routes
 */

//Users routes
app.use('/', require('./routes/index'));
app.use('/users/', require('./routes/users'));
app.use('/accounts/', require('./routes/accounts'));

//Projects routes
app.use('/projects/', require('./routes/projects'));

//Channels routes
app.use('/projects/:project_id/channels', passPrimaryParams);
app.use('/projects/:project_id/channels', require('./routes/channels'));

//Messages routes
app.use('/projects/:project_id/channels/:channel_id/messages', passPrimaryParams);
app.use('/projects/:project_id/channels/:channel_id/messages', require('./routes/messages'));

//Integrations routes
var integrations  = require('./routes/integrations');
app.use('/projects/:project_id/integrations', passPrimaryParams);
app.use('/projects/:project_id/integrations', integrations);
app.use('/integrations', integrations);

//Hook routes
app.use('/hooks/', require('./routes/hooks'));

//Search routes
app.use('/search/projects/:project_id', passPrimaryParams);
app.use('/search/projects/:project_id/messages/channels/:channel_id', passPrimaryParams);
app.use('/search/projects/:project_id', require('./routes/search'));

//Calls routes
app.use('/projects/:project_id/channels/:channel_id/calls', passPrimaryParams);
app.use('/projects/:project_id/channels/:channel_id/calls', require('./routes/calls'));

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
    app.use(express.static('/var/www/dist'));

    // Handle 404
    app.use(function(req, res) {
        res.status(404);
        res.sendfile('/var/www/dist/404.html');
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

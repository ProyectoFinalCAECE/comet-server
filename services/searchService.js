"use strict";

/**

 * Module dependencies

 */

var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "development";
var config    = require(__dirname + '/../config/sequelize.json')[env];
var sequelize = new Sequelize(config.database, config.username, config.password, { "username": "postgres",
   "password": "123456789",
   "database": "comet",
   "host": "127.0.0.1",
   "dialect": "postgres",
   "define": {
     "updatedAt": "updatedAt",
     "createdAt": "createdAt"},
     "pool": {
        "max": 10,
        "min": 1,
        "idle": 10000
      }
    });

/**
 * searchs messages that contain provided text in db.
 * @param  {integer}   project_id
 * @param  {string}   text_to_search
 * @param  {User}   user
 * @param  {Function} callback
 * @param  {integer}   channel_id
 * @return {list}                  messages list
 */
module.exports.searchMessage = function(project_id, text_to_search, user, callback, channel_id) {

};

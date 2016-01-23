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

var user_search_query = 'SELECT "U".id, "U".alias, "U"."firstName", "U"."lastName", "U".email' +
                        ' FROM "Users" AS "U"' +
                        ' WHERE "U".id IN (' +
	                      '  SELECT "PU"."UserId" FROM "ProjectUsers" AS "PU" WHERE "PU"."ProjectId"= ? AND "PU".active = true' +
	                      ' )' +
                        ' AND "U".active = true' +
                        ' AND to_tsvector("firstName"||\' \'||"email"||\' \'||"alias"||\' \'||"lastName") @@ to_tsquery(?)';

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

/**
 * searchs Users whose email, username, firstname or last name matches that contain provided text in db.
 * @param  {[type]}   project_id [description]
 * @param  {[type]}   user_text  [description]
 * @param  {[type]}   user       [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
module.exports.searchUserInProject = function(project_id, user_text, user, callback) {
  var result = {};

  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', project_id, "B"] }).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      result.code = 404;
      result.message = { errors: { all: 'No se puede encontrar ningún proyecto con el id provisto.'}};
      return callback(result);
    }

    if(projects[0].ProjectUser.active === false){
      result.code = 403;
      result.message = { errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}};
      return callback(result);
    } else {

      //look for active users in project, that match the search parameter.
      sequelize.query(user_search_query,
                      { type: sequelize.QueryTypes.SELECT,
                        replacements: [project_id, user_text]})
      .then(function(usersSearchResult) {
          result.code = 200;
          result.message = { users: usersSearchResult };
          return callback(result);
        });
    }
  });
};

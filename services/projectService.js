"use strict";

/**

 * Module dependencies

 */

var projectMailerService = require('../services/mailers/projectMailer');
var models  = require('../models');
var validator = require('validator');
var jwt = require('jsonwebtoken');

/*
* Create new Project and send invitations if members provided.
*
* @name
* @description
* @owner
*
*/
module.exports.createProject = function(req, res) {
  models.User.findById(parseInt(req.payload._id)).then(function(user) {
    if(!user){
      return res.status(404).json({ errors: { all: 'No se encontró usuario asociado al token provisto.'}});
    }

    if(user.confirmed){
      // create new Project instance
      var project = models.Project.build({
        name: req.body.name,
        description: req.body.description
      });

      project.save().then(function(projectCreated) {
        user.addProject(project, { isOwner: true });
        user.save().then(function(user) {
          // Project created successfully

          //sending invitations
          sendInvitations(req.body.members, project.name, project.id, user.alias);

          return res.json({
                          project: {
                            id: project.id,
                            name: project.name,
                            description: project.description,
                            createdAt: project.createdAt,
                            isOwner: true
                          }
                        });
        });
      });
    } else {
      return res.status(403).json({ errors: { all: 'El usuario debe confirmar su cuenta para llevar adelante la acción solicitada.'}});
    }
  });
};

/*
* Get Project information
*
* @id
*
*/
module.exports.getProject = function(req, res, user) {
  user.getProjects({ where: ['"ProjectUser"."ProjectId" = ? AND "Project"."state" != ?', req.params.id, "B"] }).then(function(projects){
    if (projects === undefined || projects.length === 0) {
      return res.status(404).json({ errors: { all: 'No se puede encontrar ningun proyecto con el id provisto.'}});
    }

    if(projects[0].ProjectUser.active == false){
      return res.status(403).json({ errors: { all: 'El usuario no puede acceder al proyecto solicitado.'}});
    } else {
      return res.json({
                      project: {
                        id: projects[0].id,
                        name: projects[0].name,
                        description: projects[0].description,
                        createdAt: projects[0].createdAt,
                        isOwner: projects[0].ProjectUser.isOwner
                      }
                    });
    }
  });
};

/*
* Generates an expirable project invitation token for provided email.
*
* @email_address
* @project_id
*
*/
function generateProjectInvitationToken(email_address, project_id){
  // expirates in 1 day
  var now = new Date();
  now.setDate(now.getDate() + 1);

  return jwt.sign({
                    project_id: project_id,
                    email_address: email_address,
                    action: 'accept_project',
                    exp: parseInt(now.getTime() / 1000)
                  },
                  'mySecretPassword');
}

/*
*
* Sends emails to provided email addresses
*
* @addresses
*
*/
function sendInvitations(addresses, project_name, project_id, owner_name){
  if(addresses){
    var x;
    for (x in addresses) {
      if(validator.isEmail(addresses[x].address)){
        projectMailerService.sendInvitationEmail(addresses[x].address,
                                                  project_name,
                                                  owner_name,
                                                  generateProjectInvitationToken(addresses[x].address,
                                                                                  project_id)
                                                );
      } else {
        console.log('discarding: ' + addresses[x].address);
      }
    }
  }
}

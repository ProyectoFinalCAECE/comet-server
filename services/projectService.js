"use strict";

/**

 * Module dependencies

 */

var projectMailerService = require('../services/mailers/projectMailer');


/*
* Create new Project and send invitations if members provided.
*
* @name
* @description
* @owner
*
*/
module.exports.createProject = function(req) {
  // create new Project instance
  var project = models.Project.build({
    name: req.body.name,
    description: req.body.description,
    owner: parseInt(req.payload._id)
  });





  // save Project
  project.save()
          .then(function(projectCreated) {
            // Project created successfully
            if(req.body.members){
              projectMailerService.sendInvitationMails(req.body.members);
            }

            return projectCreated;
          }).catch(function(err) {
              // error while saving
              return next (err);
          });
}

/*
* Get Project information
*
* @project_id
* @requester_id
*
*/
module.exports.getProject = function(project_id, user) {
  models.Project.findById(parseInt(project_id)).then(function(project) {
    if (!project) {
      console.log("Error capo 2");
  //    return NEW ERROR PROJECT NOT FOUND//res.status(401).json({ message: 'No se encontro usuario asociado al token provisto.' });
    }

    if(project.canSee(user)){
      return res.json({
                      project: {
                      id: project.id,
                      name: project.name,
                      description: project.description,
                      alias: user.alias,
                      email: user.email,
                      profilePicture: user.profilePicture,
                      confirmed: user.confirmed
                      }
                    });
    } else {
      console.log("Error capo");
      //      CANT SEE ERROR
    }
  })
}

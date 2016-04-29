"use strict";

/**

 * Module dependencies

 */
var path = require('path');
var mailGateway = require('../mailers/mailGateway');
var project_invitation_mailer_template_dir = path.join(__dirname, '../..', '/views/templates/project_invitation_email');
var EmailTemplate = require('email-templates').EmailTemplate;
var winston = require('winston');

 /*
 * Sends Invitation to Project mail to provided email accounts.
 *
 * @receivers
 *
 */
 module.exports.sendInvitationEmail = function(receiver, projectName, projectOwner, token, fullUrl) {

   var project_invitation_mailer_template = new EmailTemplate(project_invitation_mailer_template_dir);

   project_invitation_mailer_template.render({project:{name: projectName, owner: projectOwner, link: fullUrl + '/#/projects/invitations/accept?token=' + token}}, function (err, results) {
     if (err) {
       winston.info(err);
       return err;
     }

     mailGateway.genericMailer(receiver,
                   'Nueva invitacion a Proyecto en Comet',
                   results.text,
                   results.html
                 );
    });
 };

"use strict";

/**

 * Module dependencies

 */
var path = require('path');
var mailGateway = require('../mailers/mailGateway');
var project_invitation_mailer_template_dir = path.join(__dirname, '..', '/views/templates/project_invitation_email');

 /*
 * Sends Invitation to Project mail to provided email accounts.
 *
 * @receivers
 *
 */
 module.exports.sendInvitationMails = function(receivers) {
   var project_invitation_mailer_template = new EmailTemplate(project_invitation_mailer_template_dir);

   var locals = {};

   project_invitation_mailer_template.render(locals, function (err, results) {
     if (err) {
       console.log(err);
       return err;
     }

     mailGateway.genericMailer(receiver,
                   'Nueva invitacion a Proyecto en Comet',
                   results.text,
                   results.html
                 );
    });
 }

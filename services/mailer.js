"use strict";

/**

 * Module dependencies

 */

var nodemailer = require('nodemailer');
var mailer_config = require('../config/mailer.json');
var site_config = require('../config/site_config.json');

var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');

var account_confirmation_mailer_template_dir = path.join(__dirname, '..', '/views/templates/account_confirm_email');
var welcome_mailer_template_dir = path.join(__dirname, '..', '/views/templates/welcome_email');
var goodbye_mailer_template_dir = path.join(__dirname, '..', '/views/templates/goodbye_email');
var password_recovery_mailer_template_dir = path.join(__dirname, '..', '/views/templates/password_recovery_email');

/*
* Sends Welcome mail to provided email account.
*
* @receiver
*
*/
module.exports.sendWelcomeMail = function(receiver) {
  var welcome_mailer_template = new EmailTemplate(welcome_mailer_template_dir);

  var locals = {};

  welcome_mailer_template.render(locals, function (err, results) {
    if (err) {
      console.log(err);
      return err;
    }

    genericMailer(receiver,
                  'Bienvenido a tu nueva cuenta Comet!',
                  results.text,
                  results.html
                );
    });
}

/*
* Sends goodbye mail to provided email account.
*
* @receiver
*
*/
module.exports.sendGoodbyeMail = function(receiver) {
  var goodbye_mailer_template = new EmailTemplate(goodbye_mailer_template_dir);

  var locals = {};

  goodbye_mailer_template.render(locals, function (err, results) {
    if (err) {
      console.log(err);
      return err;
    }

    genericMailer(receiver,
                  'Nos vemos :(',
                  results.text,
                  results.html
                );
    });
}

/*
* Sends password recovery email with expirable token to provided email account.
*
* @receiver
* @token
*
*/
module.exports.sendPasswordRecoveryMail = function(receiver, token) {
  var password_recovery_mailer_template = new EmailTemplate(password_recovery_mailer_template_dir);

  var locals = {message:{link: 'http://localhost:4000/#/account/recover?token=' + token + '&email=' + receiver}};

  password_recovery_mailer_template.render(locals, function (err, results) {
    if (err) {
      console.log(err);
      return err;
    }

    genericMailer(receiver,
                  'Recuperacion de Contraseña en Comet',
                  results.text,
                  results.html
                );
    });
}

/*
* Sends account confirmation email with expirable token to provided email account.
*
* @receiver
* @token
*
*/
module.exports.sendAccountConfirmationMail = function(receiver, token) {
  var account_confirmation_mailer_template = new EmailTemplate(account_confirmation_mailer_template_dir);

  var locals = {message:{link: 'http://localhost:4000/#/account/confirm?token=' + token}};

  account_confirmation_mailer_template.render(locals, function (err, results) {
    if (err) {
      console.log(err);
      return err;
    }

    genericMailer(receiver,
                  'Confirmacion de cuenta Comet',
                  results.text,
                  results.html
                );
  });
}

/*
* Sends mail basing on the options retrieved from the mailer_config file (config/mailer.json) and the provided parameters.
* Uses Gmail as email proxy.
*
* @receiver
* @subject
* @text
* @html
*
*/
function genericMailer(receiver, subject, text, html){

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: mailer_config.user,
            pass: mailer_config.password
        }
    });

    if(site_config.enable_emails == "true"){
        var mailOptions = {
            from: 'Equipo Comet ✔ <'+mailer_config.user+'>', // sender address
            to: receiver, // list of receivers
            subject: subject, // Subject line
            text: text, // plaintext body
            html: html // html body
        };
        transporter.sendMail(mailOptions, function(error, info){
          if(error){
            return console.log(error);
          }
          console.log('Message sent: ' + info.response);
        });
    } else {
      console.log('Mails not enabled by config file.');
    }
}

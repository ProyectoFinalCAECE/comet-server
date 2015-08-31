"use strict";

/**

 * Module dependencies

 */

var nodemailer = require('nodemailer');
var mailer_config = require('../config/mailer.json');
var site_config = require('../config/site_config.json');

var EmailTemplate = require('email-templates').EmailTemplate
var path = require('path')

var templateDir = path.join(__dirname, '..', '/views/templates/account_confirm_email');

/*
* Sends Welcome mail to provided email account.
*
* @receiver
*
*/
module.exports.sendWelcomeMail = function(receiver) {
  genericMailer(receiver,
                'Bienvenido a tu nueva cuenta Comet!',
                'Esperamos que disfrutes trabajar con nosotros!',
                ''
              );
}

/*
* Sends goodbye mail to provided email account.
*
* @receiver
*
*/
module.exports.sendGoodbyeMail = function(receiver) {
  genericMailer(receiver,
                'Nos vemos :(',
                'Lamentamos verte ir :(',
                ''
              );
}

/*
* Sends password recovery email with expirable token to provided email account.
*
* @receiver
* @token
*
*/
module.exports.sendPasswordRecoveryMail = function(receiver, token) {
  genericMailer(receiver,
                'Recuperacion de Contraseña en Comet',
                'Por favor ingresa al siguiente link para recuperar tu contraseña: http://localhost:4000/#/account/recover?token=' + token,
                ''
              );
}

/*
* Sends account confirmation email with expirable token to provided email account.
*
* @receiver
* @token
*
*/
module.exports.sendAccountConfirmationMail = function(receiver, token) {
  genericMailer(receiver,
                'Confirmacion de cuenta Comet',
                'Por favor ingresa al siguiente link para confirmar tu cuenta: http://localhost:4000/#/account/confirm?token=' + token,
                ''
              );
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

    var newsletter = new EmailTemplate(templateDir);
    var user = {name: 'Joe', pasta: 'spaghetti'};

    newsletter.render(user, function (err, results) {
      // result.html
      // result.text
      if (err) {
        console.log(err);
        return err;
      }
      var mailOptions = {
          from: 'Equipo Comet ✔ <'+mailer_config.user+'>', // sender address
          to: receiver, // list of receivers
          subject: subject, // Subject line
          text: result.text, // plaintext body
          html: result.html // html body
      };
      transporter.sendMail(mailOptions, function(error, info){
        if(error){
          return console.log(error);
        }
        console.log('Message sent: ' + info.response);
      });
    })
    } else {
      console.log('Mails not enabled by config file.');
    }

  /*  if(site_config.enable_emails == "true"){
      var account_confirm_email_template = new EmailTemplate(account_confirm_email_dir);
      var user = {name: 'Joe', pasta: 'spaghetti'};
      account_confirm_email_template.render(user, function (err, results) {

        if(err){
          console.log('render error: ' + err);
          return err;
        } else {
          console.log(result.html)
        }

        // result.html
        // result.text
        var mailOptions = {
            from: 'Equipo Comet ✔ <'+mailer_config.user+'>', // sender address
            to: receiver, // list of receivers
            subject: subject, // Subject line
            text: text, // plaintext body
            html: account_confirm_email_template // html body
        };

        transporter.sendMail(mailOptions, function(error, info){
          if(error){
            return console.log(error);
          }
          console.log('Message sent: ' + info.response);
        });
      })
    } else {
      console.log('Mails not enabled by config file.');
    }*/
}

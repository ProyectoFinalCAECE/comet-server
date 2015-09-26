"use strict";

/**

 * Module dependencies

 */

var nodemailer = require('nodemailer');
var mailer_config = require('../../config/mailer.json');
var site_config = require('../../config/site_config.json');

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
module.exports.genericMailer = function(receiver, subject, text, html){
  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: mailer_config.user,
      pass: mailer_config.password
    }
  });

  if(site_config.enable_emails === true){
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
};

"use strict";

/**

 * Module dependencies

 */

var nodemailer = require('nodemailer');
var config = require('../config/mailer.json');

/*
* Sends welcome mail
*/
module.exports.sendWelcomeMail = function(receiver) {
      genericMailer(receiver, 'Welcome to your new Comet account!', 'We expect you enjoy working with us!', '');
}

/*
* Sends goodbye mail
*
*/
module.exports.sendGoodbyeMail = function(receiver) {
      genericMailer(receiver, 'Goodbye :(', 'We\'re really sorry to see you go :(', '');
}

/*
* Sends password recovery mail with expirable token
*
*/
module.exports.sendPasswordRecoveryMail = function(receiver, token) {
      genericMailer(receiver, 'Comet Password Recovery', 'Please click on the next link to recover your Comet password: http://localhost:4000/#/account/recover?token=' + token, '');
}

/*
* Sends account confirmation email with expirable token
*
*/
module.exports.sendAccountConfirmationMail = function(receiver, token) {
      genericMailer(receiver, 'Comet Account Confirmation', 'Please click on the next link to confirm your Comet account: http://localhost:4000/#/account/confirm?token=' + token, '');
}

/*
* Sends mail basing on the options retrieved from the config file.
*
*/
function genericMailer(receiver, subject, text, html){

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: config.user,
            pass: config.password
        }
    });

    var mailOptions = {
        from: 'Comet Team ✔ <'+config.user+'>', // sender address
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
}

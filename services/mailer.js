"use strict";

/**

 * Module dependencies

 */

var nodemailer = require('nodemailer');
var config = require('../config/mailer.json');

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
* Sends mail basing on the options retrieved from the config file (config/mailer.json) and the provided parameters.
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
            user: config.user,
            pass: config.password
        }
    });

    var mailOptions = {
        from: 'Equipo Comet ✔ <'+config.user+'>', // sender address
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

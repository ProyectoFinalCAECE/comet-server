"use strict";

var crypto = require('crypto');
var jwt = require('jsonwebtoken');

module.exports = function(sequelize, DataTypes) {
  var Usuario = sequelize.define("Usuario", {
    // id lo agrega por default sequelize
    email: { type: DataTypes.STRING, unique: true, validate: { isEmail: true } },
    hash: { type: DataTypes.STRING },
    salt: { type: DataTypes.STRING },
    apellido: { type: DataTypes.STRING },
    nombre: { type: DataTypes.STRING },
    alias: { type: DataTypes.STRING },
    fotoPerfil: { type: DataTypes.STRING, allowNull: true },
    confirmado:  { type: DataTypes.BOOLEAN, defaultValue: false },
    esAdministrador:  { type: DataTypes.BOOLEAN, defaultValue: false },
    habilitado: { type: DataTypes.BOOLEAN, defaultValue: true },
    fechaBaja: { type: DataTypes.DATE, allowNull: true }
  }, {
    instanceMethods: {
      setPassword: function(password){
        this.setDataValue('salt', crypto.randomBytes(16).toString('hex'));
        this.setDataValue('hash', crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex'));
      },
      validarPassword: function(password)
      {
           var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
           return this.hash === hash;
      },
      generateJWT: function() {
        // 30 dias de duracion
        var today = new Date();
        var expiration = new Date(today);
        expiration.setDate(today.getDate() + 30);

        return jwt.sign({
            _id: this.id,
            email: this.email,
            alias: this.alias,
            exp: parseInt(expiration.getTime() / 1000)}, 'mySecretPassword');
      }
    }
  });

  return Usuario;
};
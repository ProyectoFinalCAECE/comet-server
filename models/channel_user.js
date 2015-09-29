"use strict";

/**

 * Module dependencies

 */

module.exports = function(sequelize, DataTypes) {
  var ChannelUser = sequelize.define("ChannelUser", {
    // id autogenerated by sequelize
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    severedAt: { type: DataTypes.DATE, allowNull: true }
  });

  return ChannelUser;
};
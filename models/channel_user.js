"use strict";

/**

 * Module dependencies

 */

module.exports = function(sequelize, DataTypes) {
  var ChannelUser = sequelize.define("ChannelUser", {
    // id autogenerated by sequelize
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    severedAt: { type: DataTypes.DATE, allowNull: true },
    disconnectedAt: { type: DataTypes.DATE, allowNull: true }
  },{
    indexes:[{
      name: 'channel_user_idx',
      method: 'BTREE',
      fields: ['ChannelId']
    }]
  });

  return ChannelUser;
};

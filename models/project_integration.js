"use strict";

/**

 * Module dependencies

 */

module.exports = function(sequelize, DataTypes) {
  var ProjectIntegration = sequelize.define("ProjectIntegration", {
    uid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    active: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, {
      instanceMethods: {

      },
        classMethods:{

        },
        indexes:[{
          name: 'project_integration_idx',
          method: 'BTREE',
          fields: ['ProjectId']
        }]
      }
  );

  return ProjectIntegration;
};

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
          fixtures: {
              import_default_data: {
                  src: ['config/seeds/database_seed.json'],
                  models: function () {
                      return require('./models');
                  }
              }
          }
  });

  // Load the plugin that provides the "sequelize-fixtures" task.
  grunt.loadNpmTasks('sequelize-fixtures');

  // Default task(s).
  grunt.registerTask('default', ['fixtures']);
};

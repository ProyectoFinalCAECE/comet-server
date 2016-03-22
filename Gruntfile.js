"use strict";

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    run: {
      create_db: {
        exec: './scripts/create_database.sh',
      },
      advance_sq: {
        exec: './scripts/advance_sequences.sh',
      },
      insert_project_integration_records:{
        exec: './scripts/insert_projectintegration_records.sh'
      },
      create_searcheable_text_for_users:{
        exec: './scripts/create_searcheable_text_for_users.sh'
      }
    },
    fixtures: {
      import_default_data: {
        src: ['config/seeds/database_seed.json'],
        models: function () {
          return require('./models');
        }
      },
      import_test_data: {
          src: ['config/seeds/database_seed_test.json'],
          models: function () {
              return require('./models');
          }
      }
    }
  });

  // Load the plugin that provides the "sequelize-fixtures" task.
  grunt.loadNpmTasks('sequelize-fixtures');

  // Load the plugin that provides the "grunt run" task.
  grunt.loadNpmTasks('grunt-run');

  // Default task(s).
  grunt.registerTask('default', ['fixtures:import_default_data']);
};

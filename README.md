# comet-server

## Installation

1) Run `sudo apt-get install imagemagick`.

2) Run `npm install` to install dependencies.

3) Run `npm install -g grunt-cli` to install globally grunt's command line interface.

4) Add execute permission to scripts/create_databse.sh, run `chmod a+rwx scripts/create_database.sh`.

5) Run `grunt run:create_db` to create the database.

## Build & development

1) Add execute permission to scripts/start.sh, run `chmod a+x scripts/start.sh`.

2) Run `npm start` to start application. This will also create the database structure for the first time.

## Testing

1) Running `npm test` will run the unit tests and integration tests.

## Database seeds

Gruntfile includes a task to populate database tables basing located at /config/seeds/database_seed.json file.

To add new records to the db:

0) Make sure you've run `npm start` at least once to create the database structure. Other way next steps will fail.

1) Run `npm install -g grunt-cli` to install grunt's command line interface. (if you didn't do it before).

2) Add content to database_seed.json providing a valid json.

3) Truncate db tables if neccessary, as seed does not remove anything. Just adds missing records.

4) Move to Gruntfile directory.

5) Run `grunt fixtures:import_default_data`.

6) Add execute permission to scripts/advance_sequences.sh, run `chmod a+x scripts/advance_sequences.sh`

7) Run `grunt run:advance_sq`.

## Seeds with test data

0) Make sure you've run `npm start` at least once to create the database structure. Other way next steps will fail.

1) Move to Gruntfile directory.

2) Run `grunt fixtures:import_test_data`.

3) Add execute permission to scripts/insert_projectintegration_records.sh, run `chmod a+x scripts/insert_projectintegration_records.sh`

4) Run `grunt run:insert_project_integration_records`.

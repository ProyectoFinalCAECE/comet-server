# comet-server

## Installation

Run `sudo apt-get install imagemagick`

Run `npm install` to install dependencies.

## Build & development

Add execute permission to scripts/start.sh `chmod a+x scripts/start.sh`
Run `npm start` to start application.

## Testing

Running `npm test` will run the unit tests and integration tests.

## Database seeds

Gruntfile includes a task to populate database tables basing on /config/seeds/database_seed.json file.

To add new records to the db:

1) Run `npm install -g grunt-cli` to install grunt's command line interface.<br />
2) Add content to database_seed.json providing a valid json.<br />
3) Truncate db tables if neccessary, as seed does not remove anything. Just adds missing records.<br />
4) Move to Gruntfile directory.<br />
5) Run `grunt`.

6) Para llenar la base con los datos de prueba ejecutar: grunt --gruntfile Gruntfile_testdata.js
Si tira error hay que vaciar las tablas que afecta previamente. 

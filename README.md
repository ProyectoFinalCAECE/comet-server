# comet-server

## Installation

Run `sudo apt-get install imagemagick`

Run `npm install` to install dependencies.

## Build & development

Run `npm start` to start application.

## Testing

Running `npm test` will run the unit tests and integration tests.

## Database seeds

Gruntfile includes a task to populate database tables basing on /config/seeds/database_seed.json file.

To add new records to the db:

1) Add content to database_seed.json providing a valid json.<br />
2) Truncate db tables if neccessary, as seed does not remove anything. Just adds missing records.<br />
3) Move to Gruntfile directory.<br />
4) Run 'grunt'.

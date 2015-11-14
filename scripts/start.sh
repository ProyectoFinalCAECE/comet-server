#!/bin/bash

echo '1 - starting redis-server'
redis-server&
echo 'redis-server started'

echo '2 - starting nodemon'
NODE_ENV=development nodemon ./bin/www
echo 'nodemon started'

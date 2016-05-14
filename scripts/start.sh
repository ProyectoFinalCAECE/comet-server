#!/bin/bash

echo "   ______                     __                                   ";
echo "  / ____/___  ____ ___  ___  / /_   ________  ______   _____  _____";
echo " / /   / __ \/ __ \`__ \/ _ \/ __/  / ___/ _ \/ ___/ | / / _ \/ ___/";
echo "/ /___/ /_/ / / / / / /  __/ /_   (__  )  __/ /   | |/ /  __/ /    ";
echo "\____/\____/_/ /_/ /_/\___/\__/  /____/\___/_/    |___/\___/_/     ";
echo "                                                                   ";                                                                     

echo '1 - starting redis-server'
redis-server&
echo 'redis-server started'

echo '2 - starting signalmaster'
cd ../comet-signalmaster/ && node server.js&
echo 'signalmaster started'

echo '3 - starting nodemon'
NODE_ENV=development nodemon ./bin/www
echo "   ______                     __                                   ";
echo "  / ____/___  ____ ___  ___  / /_   ________  ______   _____  _____";
echo " / /   / __ \/ __ \`__ \/ _ \/ __/  / ___/ _ \/ ___/ | / / _ \/ ___/";
echo "/ /___/ /_/ / / / / / /  __/ /_   (__  )  __/ /   | |/ /  __/ /    ";
echo "\____/\____/_/ /_/ /_/\___/\__/  /____/\___/_/    |___/\___/_/     ";
echo "                                                                   ";                                                                     


echo 'nodemon started'
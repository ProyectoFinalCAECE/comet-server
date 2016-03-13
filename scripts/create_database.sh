#!/bin/bash

echo '1 - creating database'
psql -U postgres postgres -c "CREATE DATABASE comet"
echo '2 - database created'

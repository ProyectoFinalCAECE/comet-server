#!/bin/bash

echo '1 - advancing sequences'
psql -U postgres postgres -d comet -c "ALTER SEQUENCE \"Channels_id_seq\" RESTART 2000;ALTER SEQUENCE \"Projects_id_seq\" RESTART 2000;ALTER SEQUENCE \"Users_id_seq\" RESTART 2000;ALTER SEQUENCE \"Integrations_id_seq\" RESTART 2000;ALTER SEQUENCE \"MessageTypes_id_seq\" RESTART 2000;"
echo '2 - sequences advanced'

#!/bin/bash

echo '1 - inserting project integration records'
psql -U postgres postgres -d comet -c "DO
\$do\$
DECLARE
   i int;
   p int;
BEGIN
   FOR i IN select id from \"Integrations\" LOOP
	FOR p IN select id from \"Projects\" LOOP
		INSERT INTO \"ProjectIntegrations\"(active, \"createdAt\", \"updatedAt\", \"IntegrationId\", \"ProjectId\") VALUES (true, now(), now(), i, p);
	END LOOP;
   END LOOP;
   RETURN;
END
\$do\$;"
echo '2 - project integration records inserted.'

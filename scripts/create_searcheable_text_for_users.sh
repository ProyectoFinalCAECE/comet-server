#!/bin/bash

echo '1 - updating searchable text for users'
psql -U postgres postgres -d comet -c "DO
\$do\$
DECLARE
   i int;
   e varchar;
   m varchar;
BEGIN
   FOR i IN select id from \"Users\" LOOP
	select email from \"Users\" where id = i into m;

	select a[1] from (
	    select regexp_split_to_array(m, '@')
	) as dt(a) into e;

   UPDATE \"Users\" SET searchable_text= \"firstName\" || ' ' || \"lastName\" || ' ' || alias || ' ' || e WHERE id = i;

   END LOOP;
   RETURN;
END
\$do\$;"
echo '2 - searchable text updated.'

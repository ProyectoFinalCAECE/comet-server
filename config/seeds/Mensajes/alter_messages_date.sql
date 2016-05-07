DO
$do$
DECLARE
   r int;
   a int;
BEGIN
   a = 1;
   FOR r IN select id from "Messages" ORDER BY id ASC

   LOOP
       UPDATE "Messages" SET "sentDateTimeUTC" = to_timestamp(date '2015-12-31' + time '00:00:' || cast(a as varchar), 'YYYY-mm-DD HH24:MI:SS') WHERE "Messages".id = r;
       a = a+1;
   END LOOP;
   RETURN;
END
$do$;

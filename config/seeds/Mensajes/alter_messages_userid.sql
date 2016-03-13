DO
$do$
DECLARE
   r int;
   i int;
   u int;
   arr varchar[] := array[1001,1002,1003,1004,1005,1006];
BEGIN
   FOR r IN select id from "Messages"
   LOOP
	SELECT trunc(random() * 6 + 1) into i;
	SELECT arr[i] into u;
	UPDATE "Messages" SET "UserId" = u WHERE "Messages".id = r;
   END LOOP;

   RETURN;
END
$do$;

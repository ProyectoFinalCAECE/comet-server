---------------------------------------------
Insertar 1.000.000 de registros en "Messages"
---------------------------------------------

Requisitos:
- Tener canales con id de 6 a 9 inclusive (no importan los proyectos).
- Tener un usuario con id 1

Procedimiento:
- Eliminar la tabla actual "Messages" (mediante pgAdmin)
- Extraer /comet-server/config/seeds/Mensajes/messages.dump.tar.gz en alguna carpeta de la VM
- En la consola de la VM, en la carpeta donde se extrajo el archivo, ejecutar: psql -f messages.backup -U postgres comet
- Nuevamente desde pgAdmin, Renombrar "messages" a "Messages"
- Actualizar la identidad desde Sequences > Messages_id_seq poniendo el valor actual en 1.000.000
- Ejecutar el script almacenado en el archivo 'alter_messages_date.sql', para hacer que todos los mensajes tengan una fecha diferente. Es necesario para que el buscador trabaje como debe.
- Ejecutar el script almacenado en el archivo 'alter_messages_userid.sql', para hacer que todos los mensajes pertenezcan a alguno de los usuarios creados con el seed.
- Levantar comer-server

*Actualizar PostgreSQL 9.3 a 9.4*

- Crear archivo: /etc/apt/sources.list.d/pgdg.list
- Agregar linea: deb http://apt.postgresql.org/pub/repos/apt/ trusty-pgdg main
- Ejecutar:
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | \sudo apt-key add -
  sudo apt-get update
  sudo apt-get install postgresql-9.4
  export LC_CTYPE=en_US.UTF-8
  export LC_ALL=en_US.UTF-8

- Comentar liea 352 en /usr/bin/pg_upgradecluster: "delete $ENV{'LC_ALL'}"

- Ejecutar:
  sudo pg_upgradecluster 9.3 main


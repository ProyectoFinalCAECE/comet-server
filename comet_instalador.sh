### Instalador del sistema COMET y dependencias.

### verificación de dependencias

### Verifica que el instalador se ejecute como root. 
if [ "$(id -u)" != "0" ]
then

    	printf "El instalador debe ejecutarse como root"
    	exit 1

fi

printf "Inicio de instalacion del sistema comet\n\n"
printf "Verificacion de dependencias\n\n"
### Verifica si git esta instalado, si no lo instala

printf "Verificando si git esta instalado\n"

git --version >/dev/null 2>&1
GIT_INSTALLED=$?

if [ $GIT_INSTALLED -ne 0 ]
then
	printf "No se encontro git instalado, se procede a su instalación\n"
	printf "Instalando git...\n" 
	apt-get install -y git >/dev/null 2>&1
	printf "git instalado satisfactoriamente"

else
	printf "git ya se encuentra instalado.\n"
fi

##verifica si nodejs, npm y bower estan instalados, sino los instala

type nodejs >/dev/null 2>&1
NODEJS_INSTALLED=$?

type npm >/dev/null 2>&1
NPM_INSTALLED=$?

printf "Verificando si nodejs esta instalado\n"

if [ $NODEJS_INSTALLED -ne 0 ]
then
	printf "No se encontro nodejs instalado, se procede a su instalación\n"
	printf "Instalando nodejs...\n" 
	apt-get install -y nodejs >/dev/null 2>&1
	printf "nodejs instalado satisfactoriamente\n"
else
	printf "nodejs ya se encuentra instalado.\n"
fi


printf "Verificando si npm esta instalado\n"

if [ $NPM_INSTALLED -ne 0 ]
then
	printf "No se encontro npm instalado, se procede a su instalación\n"
	printf "Instalando npm...\n" 
	apt-get install -y npm >/dev/null 2>&1
	ln -s /usr/bin/nodejs /usr/bin/node
	npm install -g bower >/dev/null 2>&1
	printf "npm instalado satisfactoriamente\n"
else
	printf "npm ya se encuentra instalado.\n"
fi

##verifica si redis esta instalado, sino lo instala

printf "Verificando si redis esta instalado\n"

type redis_server >/dev/null 2>&1
REDIS_INSTALLED=$?

if [ $REDIS_INSTALLED -ne 0 ]
then
	printf "No se encontro redis instalado, se procede a su instalación\n"
	printf "Instalando redis...\n" 
	apt-get install -y redis-server >/dev/null 2>&1
	ps axf | grep redis | grep -v grep | awk '{print "kill -9 " $1}' | sh > /dev/null 2>&1
	printf "redis instalado satisfactoriamente\n"
else
	printf "redis ya se encuentra instalado"
fi


##verifica si postgres esta instalado, sino lo instala, a su vez crea la base de datos de comet

printf "Verificando si postgres esta instalado\n"

psql --version >/dev/null 2>&1
PSQL_INSTALLED=$?

if [ $PSQL_INSTALLED -ne 0 ]
then
	printf "No se encontro postgres instalado, se procede a su instalación\n"
	printf "Instalando postgres...\n" 
	apt-get install -y postgresql postgresql-contrib >/dev/null 2>&1
	cd /tmp
	sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '123456789';"
	printf "postgres instalado satisfactoriamente\n"
else
	printf "postgres ya se encuentra instalado\n"
fi

sudo -u postgres createdb comet

#################

printf "\n\nTodas las dependencias se encuentran instaladas, procediendo a la instalación del sistema comet\n"

printf "Creando directorios"
mkdir "$HOME/comet"
cd "$HOME/comet"

##comet server
printf "Instalando el servidor y sus modulos..."
git clone https://github.com/ProyectoFinalCAECE/comet-server.git 
cd "$HOME/comet/comet-server"
npm install >/dev/null 2>&1
apt-get install -y imagemagick >/dev/null 2>&1
printf "Servidor instalado satisfactoriamente"

##comet-client
printf "Instalando modulos del cliente"
cd "$HOME/comet"
git clone https://github.com/ProyectoFinalCAECE/comet-client.git
cd "$HOME/comet/comet-client"
bower --allow-root install >/dev/null 2>&1
printf "Modulos del cliente instalado satisfactoriamente"

##comet-signalmaster
printf "Instalando Signalmaster\n"
cd "$HOME/comet"
git clone https://github.com/ProyectoFinalCAECE/comet-signalmaster.git
cd "$HOME/comet/comet-signalmaster"
npm install >/dev/null 2>&1
printf "Signalmaster instalado satisfactoriamente\n"

## Iniciando y parando el servidor para poblar los tipos de mensajes en la base de datos

printf "Iniciando Servidor\n"
cd "$HOME/comet/comet-server"
npm install -g grunt >/dev/null 2>&1
npm start & >/dev/null 2>&1
SERVER_PID=$!
sleep 45
printf "Bajando servidor\n"
kill -TERM $SERVER_PID > /dev/null 2>&1
ps axf | grep start.sh | grep -v grep | awk '{print "kill -9 " $1}' | sh > /dev/null 2>&1
ps axf | grep bin/www | grep -v grep | awk '{print "kill -9 " $1}' | sh > /dev/null 2>&1
ps axf | grep redis | grep -v grep | awk '{print "kill -9 " $1}' | sh > /dev/null 2>&1
grunt fixtures:import_default_data
chmod -R 777 "$HOME/.config/configstore/"




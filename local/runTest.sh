#!/bin/bash

SCRIPT_DIR=$(cd $(dirname $0); pwd)

cd $SCRIPT_DIR

bash cpMysqlFile.sh

docker-compose -f docker-compose-local-m1.yaml build
docker-compose -f docker-compose-local-m1.yaml up -d

cd ../scoring/tool/nodeTool
npm ci

cd $SCRIPT_DIR

bash mysql_waiter.sh

if [ $?=0 ] ; then
  bash localApiTestOnly.sh
fi

if [ $?!=0 ] ; then
  echo "=========== mysql errors ==========="
  mysql_container_name=`docker ps --format "{{.Names}}" --filter "name=mysql"`
  docker logs $mysql_container_name > /dev/null

  echo "=========== nodejs errors ==========="
  backend_container_name=`docker ps --format "{{.Names}}" --filter "name=backend"`
  docker logs $backend_container_name > /dev/null

  echo "=========== nodejs last 100 line logs ==========="
  docker logs $backend_container_name 2> /dev/null | tail -n -100
fi

docker-compose -f docker-compose-local.yaml down

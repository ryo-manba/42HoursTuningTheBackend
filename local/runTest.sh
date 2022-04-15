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

docker-compose -f docker-compose-local.yaml down

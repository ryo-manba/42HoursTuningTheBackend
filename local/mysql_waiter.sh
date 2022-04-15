#!/bin/sh

count=0
container_name=`docker ps --format "{{.Names}}" --filter "name=mysql"`
while [ `docker logs $container_name 2>&1 > /dev/null | grep "socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server - GPL." | wc -l` = 0 ]
do
  count=$((++count))
  if [ $count -gt 300 ] ; then
    echo "!!! Maybe failed to launch MySQL"
    echo "(docker logs)"
    docker logs local-mysql-1
    exit 1
  fi
  echo "Waiting for MySQL to be ready... ($count seconds)"
  sleep 1
done

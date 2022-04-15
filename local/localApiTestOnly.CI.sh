#!/bin/bash

# ===========================
# ローカル開発環境用APIテストスクリプト
# APIテストをフォールバックモードで実施します。
# フォールバックモードでは、一部の項目はテストされません。
# ===========================

count=0
while [ `docker logs local-mysql-1 2>&1 > /dev/null | grep "socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server - GPL." | wc -l` = 0 ]
do
  count=$((++count))
  if [ $count -gt 30 ] ; then
    echo "Maybe failed to launch MySQL"
    exit 1
  fi
  echo "Waiting for MySQL to be ready... ($count seconds)"
  sleep 1
done

(cd ../scoring/tool && node ./nodeTool/check-local.js "fallback") || (echo "処理に失敗しました。" && exit 1)
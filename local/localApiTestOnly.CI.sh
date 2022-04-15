#!/bin/bash

# ===========================
# ローカル開発環境用APIテストスクリプト
# APIテストをフォールバックモードで実施します。
# フォールバックモードでは、一部の項目はテストされません。
# ===========================

count=0
while [ `docker logs local-mysql-1 2> /dev/null | grep "MySQL init process done. Ready for start up." | wc -l` = 0 ]
do
  count=$((++count))
  if [ COUNTER >= 30 ] ; then
    exit 1
  fi

  sleep 1
done

(cd ../scoring/tool && node ./nodeTool/check-local.js "fallback") || (echo "処理に失敗しました。" && exit 1)
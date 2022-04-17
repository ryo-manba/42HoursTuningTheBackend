#!/bin/bash

# ===========================
# localMysql用に、一部ファイルをdevelopmentからコピーする
# ===========================

cp ../development/mysql/sql/V0.sql ./localMysql/sql/
cp ../development/mysql/sql/V1.sql ./localMysql/sql/
cp ../development/mysql/custom.conf ./localMysql/custom.conf

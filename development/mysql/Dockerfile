FROM mysql:8.0

COPY ./custom.conf /etc/mysql/conf.d/mysql.cnf

CMD ["mysqld", "--sql-mode=NO_ENGINE_SUBSTITUTION"]
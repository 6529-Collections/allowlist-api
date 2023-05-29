# API for creating allowlists

To run local DB:
```
docker pull mariadb
docker run --name mariadbtest -e MYSQL_ROOT_PASSWORD=mypass -p 3306:3306 -d mariadb
```

Log in to your local DB (user: root, pass: mypass) and execute:

```
CREATE USER allowlist IDENTIFIED BY 'allowlist';
create database allowlist;
grant all privileges on allowlist.* TO 'allowlist'
```

To install dependencies run `yarn`

To create database schema run:

```
node node_modules/db-migrate/bin/db-migrate up -e dev
```

To start the app run `yarn start`
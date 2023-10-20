create user 'allowlist'@'%' identified with mysql_native_password by 'allowlist';
create database allowlist;
grant all privileges on allowlist.* TO 'allowlist';
flush privileges;
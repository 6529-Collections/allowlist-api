CREATE DATABASE IF NOT EXISTS allowlist;
CREATE USER IF NOT EXISTS 'allowlist'@'%' IDENTIFIED WITH mysql_native_password BY 'allowlist';
ALTER USER 'allowlist'@'%' IDENTIFIED WITH mysql_native_password BY 'allowlist';
GRANT ALL PRIVILEGES ON allowlist.* TO 'allowlist'@'%';
FLUSH PRIVILEGES;
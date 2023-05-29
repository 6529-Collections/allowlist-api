create table allowlist
(
    id          varchar(255) primary key not null,
    name        text                     not null,
    description text                     not null,
    created_at  bigint                   not null
);
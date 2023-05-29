create table transfer_pool
(
    id           varchar(255) primary key not null,
    name         text                     not null,
    description  text                     not null,
    contract     varchar(255)             not null,
    block_no     int                      not null,
    created_at   bigint                   not null,
    allowlist_id varchar(255)             not null,
    constraint transfer_pool_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade
);
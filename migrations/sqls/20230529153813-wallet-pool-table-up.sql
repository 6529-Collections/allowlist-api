create table wallet_pool
(
    id               varchar(255) primary key not null,
    name             text                     not null,
    description      text                     not null,
    created_at       bigint                   not null,
    allowlist_id     varchar(255)             not null,
    allowlist_run_id varchar(255)             not null,
    constraint wallet_pool_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade,
    constraint wallet_pool_allowlist_run_id_fk
        foreign key (allowlist_run_id) references allowlist_run (id)
            on delete cascade
);
create table token_pool
(
    id               varchar(255) primary key not null,
    name             text                     not null,
    description      text                     not null,
    allowlist_id     varchar(255)             not null,
    transfer_pool_id varchar(255)             not null,
    constraint token_pool_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade,
    constraint token_pool_transfer_pool_id_fk
        foreign key (transfer_pool_id) references transfer_pool (id)
            on delete cascade
);
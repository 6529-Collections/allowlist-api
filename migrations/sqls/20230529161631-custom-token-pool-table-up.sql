create table custom_token_pool
(
    id               varchar(255) primary key not null,
    name             text                     not null,
    description      text                     not null,
    allowlist_id     varchar(255)             not null,
    constraint custom_token_pool_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade
);
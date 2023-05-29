create table custom_token_pool_token
(
    id                   varchar(255) primary key not null,
    owner                varchar(255)             not null,
    token_id              varchar(512)             not null,
    op_order             int                      not null,
    since                bigint                   not null,
    custom_token_pool_id varchar(255)             not null,
    allowlist_id         varchar(255)             not null,
    constraint custom_token_pool_token_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade,
    constraint custom_token_pool_token_custom_token_pool_id_fk
        foreign key (custom_token_pool_id) references custom_token_pool_token (id)
            on delete cascade
);
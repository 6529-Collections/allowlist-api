create table token_ownership
(
    id            varchar(255) primary key not null,
    contract      varchar(255)             not null,
    owner         varchar(255)             not null,
    token_id       varchar(512)             not null,
    op_order      int                      not null,
    since         bigint                   not null,
    token_pool_id varchar(255)             not null,
    allowlist_id  varchar(255)             not null,
    constraint token_ownership_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade,
    constraint token_ownership_token_pool_id_fk
        foreign key (token_pool_id) references token_pool (id)
            on delete cascade
);
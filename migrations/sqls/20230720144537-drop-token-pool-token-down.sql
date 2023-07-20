create table token_pool_token
(
    contract               varchar(100) not null,
    token_id               varchar(100) not null,
    amount                 int          not null,
    wallet                 varchar(100) not null,
    token_pool_id varchar(255) not null,
    allowlist_id           varchar(255) not null,
    constraint token_pool_token_allowlist_run_id_fk
        foreign key (allowlist_id) references allowlist_run (allowlist_id)
            on delete cascade,
    constraint token_pool_token_token_pool_id_fk
        foreign key (token_pool_id, allowlist_id) references token_pool (external_id, allowlist_id)
            on delete cascade,
    primary key (contract, token_id, token_pool_id, allowlist_id)
);
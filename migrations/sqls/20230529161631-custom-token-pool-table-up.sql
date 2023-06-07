create table custom_token_pool
(
    external_id  varchar(255) not null,
    name         text          not null,
    description  text          not null,
    allowlist_id varchar(255)  not null,
    constraint custom_token_pool_allowlist_run_id_fk
        foreign key (allowlist_id) references allowlist_run (allowlist_id)
            on delete cascade,
    primary key (external_id, allowlist_id)
);
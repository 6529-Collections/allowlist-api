create table transfer_pool
(
    external_id  varchar(255) not null,
    name         text         not null,
    description  text         not null,
    contract     varchar(255) not null,
    block_no     int          not null,
    allowlist_id varchar(255) not null,
    constraint transfer_pool_allowlist_run_id_fk
        foreign key (allowlist_id) references allowlist_run (allowlist_id)
            on delete cascade,
    primary key (external_id, allowlist_id)
);
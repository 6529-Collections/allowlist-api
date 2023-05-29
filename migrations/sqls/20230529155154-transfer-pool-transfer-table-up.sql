create table transfer_pool_transfer
(
    id               varchar(255) primary key not null,
    allowlist_id     varchar(255)             not null,
    transfer_pool_id varchar(255)             not null,
    transaction_hash varchar(512)             not null,
    op_order         int                      not null,
    constraint transfer_pool_transfer_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade,
    constraint transfer_pool_transfer_transfer_pool_id_fk
        foreign key (transfer_pool_id) references transfer_pool (id)
            on delete cascade,
    constraint transfer_pool_transfer_transfer_transaction_hash_fk
        foreign key (transaction_hash) references transfer (transaction_hash)
            on delete cascade
);
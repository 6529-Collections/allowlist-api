create table wallet_pool_wallet
(
    id             varchar(255) primary key not null,
    wallet         text                     not null,
    allowlist_id   varchar(255)             not null,
    wallet_pool_id varchar(255)             not null,
    constraint wallet_pool_wallet_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade,
    constraint wallet_pool_wallet_wallet_pool_id_fk
        foreign key (wallet_pool_id) references wallet_pool (id)
            on delete cascade
);
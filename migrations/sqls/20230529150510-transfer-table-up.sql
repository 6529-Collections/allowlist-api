create table transfer
(
    transaction_hash  varchar(512) not null primary key,
    amount            int           not null,
    block_number      bigint        not null,
    contract          varchar(255)  not null,
    from_party        varchar(255)  not null,
    to_party          varchar(255)  not null,
    log_index         bigint        not null,
    timestamp         bigint        not null,
    token_id          text          not null,
    transaction_index bigint        not null
);
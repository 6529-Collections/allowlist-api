create table transfer
(
    id                varchar(500) not null primary key,
    transaction_hash  varchar(512)  not null,
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
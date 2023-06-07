create table transfer
(
    transaction_hash  varchar(100) not null,
    amount            int          not null,
    block_number      int          not null,
    contract          varchar(100) not null,
    from_party        varchar(100) not null,
    to_party          varchar(100) not null,
    log_index         int          not null,
    timestamp         bigint       not null,
    token_id          varchar(100) not null,
    transaction_index int          not null,
    PRIMARY KEY (contract, block_number, transaction_index, log_index, token_id)
);
create table token_pool_download (
    allowlist_id varchar(255) not null references allowlist(id),
    token_pool_id varchar(255) not null primary key,
    contract varchar(100),
    token_ids text,
    block_no int not null,
    status text not null
);
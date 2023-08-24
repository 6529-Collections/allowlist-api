CREATE TABLE allowlist_user
(
    allowlist_id varchar(255) not null,
    user_wallet  varchar(255) not null,
    created_at   bigint       not null,
    primary key (allowlist_id, user_wallet)
)
create table allowlist_run
(
    id           varchar(255) primary key not null,
    status       varchar(255)             not null,
    created_at   bigint                   not null,
    started_at   bigint,
    updated_at   bigint,

    allowlist_id varchar(255)             not null,
    CONSTRAINT `fk_allowlist_run_allowlist_id_allowlist_id`
        FOREIGN KEY (allowlist_id) REFERENCES allowlist (id)
            ON DELETE CASCADE
)
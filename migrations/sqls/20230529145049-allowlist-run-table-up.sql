create table allowlist_run
(
    allowlist_id varchar(255) not null,
    status       varchar(255) not null,
    created_at   bigint       not null,
    started_at   bigint,
    updated_at   bigint,
    CONSTRAINT `fk_allowlist_run_allowlist_id_allowlist_id`
        FOREIGN KEY (allowlist_id) REFERENCES allowlist (id)
            ON DELETE CASCADE,
    PRIMARY KEY (allowlist_id)
);

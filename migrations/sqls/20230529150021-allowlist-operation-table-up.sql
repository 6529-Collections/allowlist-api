create table allowlist_operation
(
    id           varchar(255) primary key not null,
    code         text                     not null,
    params       text,
    created_at   bigint                   not null,
    op_order     int                      not null,
    has_ran      boolean                  not null,
    allowlist_id varchar(255)             not null,
    CONSTRAINT fk_allowlist_operation_allowlist_id
        FOREIGN KEY (allowlist_id) REFERENCES allowlist (id)
            ON DELETE CASCADE
);
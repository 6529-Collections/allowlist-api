create table phase
(
    external_id     varchar(255) not null,
    name            varchar(255)  not null,
    description     varchar(255)  not null,
    insertion_order int           not null,
    allowlist_id    varchar(255)  not null,
    constraint phase_allowlist_run_id_fk
        foreign key (allowlist_id) references allowlist_run (allowlist_id)
            on delete cascade,
    primary key (external_id, allowlist_id)
)
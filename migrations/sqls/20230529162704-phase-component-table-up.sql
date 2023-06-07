create table phase_component
(
    id                varchar(255) primary key not null,
    external_id       varchar(1000)            not null,
    name              varchar(255)             not null,
    description       varchar(255)             not null,
    insertion_order   int                      not null,
    allowlist_id      varchar(255)             not null,
    allowlist_run_id  varchar(255)             not null,
    phase_external_id varchar(1000)            not null,
    constraint phase_component_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade,
    constraint phase_component_allowlist_run_id_fk
        foreign key (allowlist_run_id) references allowlist_run (id)
            on delete cascade
);
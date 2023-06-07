create table phase_component_winner
(
    id                          varchar(255) primary key not null,
    wallet                      varchar(255)             not null,
    phase_external_id           varchar(255)            not null,
    allowlist_id                varchar(255)             not null,
    amount                      int                      not null,
    phase_component_external_id varchar(255)            not null,
    constraint phase_component_winner_allowlist_id_fk
        foreign key (allowlist_id) references allowlist_run (allowlist_id)
            on delete cascade
);
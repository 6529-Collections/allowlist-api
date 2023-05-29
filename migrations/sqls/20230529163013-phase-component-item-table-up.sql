create table phase_component_item
(
    id                 varchar(255) primary key not null,
    name               varchar(255)             not null,
    description        varchar(255)             not null,
    insertion_order    int                      not null,
    allowlist_id       varchar(255)             not null,
    phase_component_id varchar(255)             not null,
    constraint phase_component_item_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade,
    constraint phase_component_phase_component_item_id_fk
        foreign key (phase_component_id) references phase_component (id)
            on delete cascade
);
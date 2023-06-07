create table phase_component_item
(
    external_id                 varchar(255) not null,
    name                        varchar(255)  not null,
    description                 varchar(255)  not null,
    insertion_order             int           not null,
    phase_external_id           varchar(255) not null,
    allowlist_id                varchar(255)  not null,
    phase_component_external_id varchar(255) not null,
    pool_id                     varchar(255)  not null,
    pool_type                   varchar(255)  not null,
    constraint phase_component_item_allowlist_run_id_fk
        foreign key (allowlist_id) references allowlist_run (allowlist_id)
            on delete cascade,
    primary key (external_id, allowlist_id)
);
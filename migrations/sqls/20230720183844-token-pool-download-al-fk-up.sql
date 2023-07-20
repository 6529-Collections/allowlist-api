alter table token_pool_download
    add constraint token_pool_download_allowlist_id_fk
        foreign key (allowlist_id) references allowlist (id)
            on delete cascade;
ALTER TABLE token_pool_download
    ADD COLUMN created_at BIGINT NULL,
    ADD COLUMN updated_at BIGINT NULL,
    ADD COLUMN claimed_at BIGINT NULL,
    ADD COLUMN last_heartbeat_at BIGINT NULL,
    ADD COLUMN completed_at BIGINT NULL,
    ADD COLUMN failed_at BIGINT NULL,
    ADD COLUMN error_reason LONGTEXT NULL,
    ADD COLUMN failure_count INT NOT NULL DEFAULT 0,
    ADD COLUMN last_failure_at BIGINT NULL,
    ADD COLUMN last_failure_reason LONGTEXT NULL,
    ADD COLUMN attempt_count INT NOT NULL DEFAULT 0,
    ADD COLUMN stage VARCHAR(64) NULL,
    ADD COLUMN progress LONGTEXT NULL;

-- AlterTable
ALTER TABLE `raw_events` ADD COLUMN `version_number` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `raw_events_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `version_number` INTEGER NOT NULL,
    `archived_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `change_count` INTEGER NOT NULL DEFAULT 0,
    `event_name` VARCHAR(512) NOT NULL,
    `event_start` VARCHAR(19) NOT NULL,
    `event_end` VARCHAR(19) NOT NULL,
    `gmt_start` VARCHAR(19) NOT NULL,
    `gmt_end` VARCHAR(19) NOT NULL,
    `time_booking_start` VARCHAR(19) NOT NULL,
    `time_booking_end` VARCHAR(19) NOT NULL,
    `is_all_day_event` BOOLEAN NOT NULL,
    `timezone_abbreviation` VARCHAR(255) NOT NULL,
    `building` VARCHAR(255) NOT NULL,
    `building_id` INTEGER NOT NULL,
    `room` VARCHAR(255) NOT NULL,
    `room_id` INTEGER NOT NULL,
    `room_code` VARCHAR(255) NOT NULL,
    `room_type` VARCHAR(255) NOT NULL,
    `room_type_id` INTEGER NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `location_link` VARCHAR(255) NOT NULL,
    `group_name` VARCHAR(255) NOT NULL,
    `reservation_id` INTEGER NOT NULL,
    `reservation_summary_url` VARCHAR(255) NOT NULL,
    `status_id` INTEGER NOT NULL,
    `status_type_id` INTEGER NOT NULL,
    `web_user_is_owner` BOOLEAN NOT NULL,

    INDEX `idx_history_event_id`(`event_id`),
    INDEX `idx_history_event_version`(`event_id`, `version_number`),
    INDEX `idx_history_archived_at`(`archived_at`),
    UNIQUE INDEX `uk_event_version`(`event_id`, `version_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

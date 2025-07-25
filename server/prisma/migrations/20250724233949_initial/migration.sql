-- CreateTable
CREATE TABLE `raw_constant_violations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `field_name` VARCHAR(255) NOT NULL,
    `expected_value` TEXT NOT NULL,
    `actual_value` TEXT NOT NULL,
    `violation_time` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_event_id`(`event_id`),
    INDEX `idx_field_name`(`field_name`),
    INDEX `idx_violation_time`(`violation_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `raw_events` (
    `id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_checked` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `event_name` VARCHAR(512) NOT NULL,
    `event_start` DATETIME(0) NOT NULL,
    `event_end` DATETIME(0) NOT NULL,
    `gmt_start` DATETIME(0) NOT NULL,
    `gmt_end` DATETIME(0) NOT NULL,
    `time_booking_start` DATETIME(0) NOT NULL,
    `time_booking_end` DATETIME(0) NOT NULL,
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

    INDEX `idx_building_id`(`building_id`),
    INDEX `idx_date_range`(`event_start`, `event_end`),
    INDEX `idx_event_end`(`event_end`),
    INDEX `idx_event_start`(`event_start`),
    INDEX `idx_group_name`(`group_name`),
    INDEX `idx_location_search`(`building`, `room`),
    INDEX `idx_reservation_id`(`reservation_id`),
    INDEX `idx_room_id`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rel_rooms` (
    `room_id` INTEGER NOT NULL,
    `room_name` VARCHAR(255) NOT NULL,
    `building_id` INTEGER NOT NULL,
    `room_type_id` INTEGER NOT NULL,

    INDEX `idx_rooms_building_id`(`building_id`),
    INDEX `idx_rooms_room_type_id`(`room_type_id`),
    PRIMARY KEY (`room_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

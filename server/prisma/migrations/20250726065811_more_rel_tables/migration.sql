-- CreateTable
CREATE TABLE `rel_buildings` (
    `building_id` INTEGER NOT NULL,
    `building_name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`building_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rel_room_types` (
    `room_type_id` INTEGER NOT NULL,
    `room_type_name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`room_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `raw_events` ADD CONSTRAINT `raw_events_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `rel_buildings`(`building_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `raw_events` ADD CONSTRAINT `raw_events_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `rel_room_types`(`room_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rel_rooms` ADD CONSTRAINT `rel_rooms_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `rel_buildings`(`building_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rel_rooms` ADD CONSTRAINT `rel_rooms_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `rel_room_types`(`room_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

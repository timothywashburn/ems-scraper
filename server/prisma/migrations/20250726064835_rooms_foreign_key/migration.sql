-- AddForeignKey
ALTER TABLE `raw_events` ADD CONSTRAINT `raw_events_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rel_rooms`(`room_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

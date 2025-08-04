-- AddForeignKey
ALTER TABLE `raw_events` ADD CONSTRAINT `raw_events_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `rel_statuses`(`status_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

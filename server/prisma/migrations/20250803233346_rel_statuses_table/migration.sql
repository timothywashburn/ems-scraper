-- CreateTable
CREATE TABLE `rel_statuses` (
    `status_id` INTEGER NOT NULL,
    `status_name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`status_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scraper_state` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scraper_type` VARCHAR(50) NOT NULL,
    `current_date` DATE NOT NULL,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `scraper_state_scraper_type_key`(`scraper_type`),
    INDEX `idx_scraper_type`(`scraper_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

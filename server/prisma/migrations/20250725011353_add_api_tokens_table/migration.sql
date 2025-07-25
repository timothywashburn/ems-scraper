-- CreateTable
CREATE TABLE `api_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(255) NOT NULL,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `comment` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_used` TIMESTAMP(0) NULL,

    UNIQUE INDEX `api_tokens_token_key`(`token`),
    INDEX `idx_token`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

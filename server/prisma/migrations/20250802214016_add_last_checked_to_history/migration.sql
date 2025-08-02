/*
  Warnings:

  - Added the required column `last_checked` to the `raw_events_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `raw_events_history` ADD COLUMN `last_checked` TIMESTAMP(0) NOT NULL;

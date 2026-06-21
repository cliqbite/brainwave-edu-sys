-- AlterTable
ALTER TABLE `push_notification_recipients` ADD COLUMN `in_app_read` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `push_read` BOOLEAN NOT NULL DEFAULT false;

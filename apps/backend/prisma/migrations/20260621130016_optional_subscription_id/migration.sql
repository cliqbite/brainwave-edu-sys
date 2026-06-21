-- DropForeignKey
ALTER TABLE `push_notification_recipients` DROP FOREIGN KEY `push_notification_recipients_subscription_id_fkey`;

-- AlterTable
ALTER TABLE `push_notification_recipients` MODIFY `subscription_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `push_notification_recipients` ADD CONSTRAINT `push_notification_recipients_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `push_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

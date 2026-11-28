-- Customer Feedback & Reviews system (extends the existing Testimonial table).
ALTER TABLE `Testimonial` ADD COLUMN `avatar` VARCHAR(500) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `images` JSON NULL,
    ADD COLUMN `isVerifiedPurchase` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `permissionConfirmed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN `title` VARCHAR(160) NULL,
    ADD COLUMN `type` ENUM('CUSTOMER_TEXT', 'WHATSAPP_SCREENSHOT', 'ADMIN_REVIEW', 'SAMPLE') NOT NULL DEFAULT 'ADMIN_REVIEW',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE INDEX `Testimonial_status_isActive_createdAt_idx` ON `Testimonial`(`status`, `isActive`, `createdAt`);
CREATE INDEX `Testimonial_type_idx` ON `Testimonial`(`type`);

-- Existing testimonials were entered by an admin under the rule "only publish genuine feedback with permission".
UPDATE `Testimonial` SET `permissionConfirmed` = true;

-- Three SAMPLE reviews so the section is not empty at launch. They are labelled "Sample review" on the website,
-- excluded from the review count and average rating, and removable in one click (Admin → Customer feedback → Samples).
-- Only added when the store has no published genuine feedback yet.
INSERT INTO `Testimonial` (`id`, `name`, `location`, `title`, `text`, `rating`, `type`, `status`, `isActive`, `permissionConfirmed`, `sortOrder`, `createdAt`, `updatedAt`)
SELECT * FROM (
  SELECT 'fb_sample_1' AS `id`, 'Ayesha K.' AS `name`, 'Dubai' AS `location`, 'Beautiful shawl' AS `title`, 'The embroidered shawl is soft and warm, and the colours look even richer in person. Neatly packed too.' AS `text`, 5 AS `rating`, 'SAMPLE' AS `type`, 'APPROVED' AS `status`, true AS `isActive`, true AS `permissionConfirmed`, 90 AS `sortOrder`, UTC_TIMESTAMP(3) AS `createdAt`, UTC_TIMESTAMP(3) AS `updatedAt`
  UNION ALL SELECT 'fb_sample_2', 'Mariam S.', 'Sharjah', 'Lovely stitching', 'Lovely stitching on my dress and the fit was just right. I will definitely order again.', 5, 'SAMPLE', 'APPROVED', true, true, 91, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3)
  UNION ALL SELECT 'fb_sample_3', 'Fatima R.', 'Abu Dhabi', 'Helpful service', 'They answered my sizing questions on WhatsApp quickly before I ordered. Very helpful.', 4, 'SAMPLE', 'APPROVED', true, true, 92, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3)
) AS `samples`
WHERE NOT EXISTS (SELECT 1 FROM `Testimonial` WHERE `type` <> 'SAMPLE' AND `status` = 'APPROVED' AND `isActive` = true);

-- Show "Customer Feedback" as the last homepage section.
UPDATE `HomepageSection` SET `title` = 'Customer Feedback', `subtitle` = 'Real words from our customers — on the website and on WhatsApp.', `isEnabled` = true, `sortOrder` = 11 WHERE `key` = 'testimonials';

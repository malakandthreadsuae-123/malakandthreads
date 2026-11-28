-- Homepage hero becomes a brand showcase slider (Admin → Brands → "Show in homepage hero").
ALTER TABLE `Brand` ADD COLUMN `heroImage` VARCHAR(500) NULL,
    ADD COLUMN `heroLink` VARCHAR(500) NULL,
    ADD COLUMN `heroTagline` VARCHAR(200) NULL,
    ADD COLUMN `showInHero` BOOLEAN NOT NULL DEFAULT false;

-- Start with the active homepage brands (they already have photos). Admins can change this per brand.
UPDATE `Brand` SET `showInHero` = true WHERE `isActive` = true AND `isFeatured` = true;

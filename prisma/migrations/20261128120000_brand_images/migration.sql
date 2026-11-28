-- Stand-in photos for the brand cards (licensed Unsplash images from public/images/demo, see docs/MEDIA_CREDITS.md).
-- Only fills brands that have no photo yet, so images uploaded in Admin → Brands are never replaced.
UPDATE `Brand` SET `image` = '/images/demo/dress-05.webp' WHERE `slug` = 'khaadi' AND (`image` IS NULL OR `image` = '');
UPDATE `Brand` SET `image` = '/images/demo/dress-03.webp' WHERE `slug` = 'beechtree' AND (`image` IS NULL OR `image` = '');
UPDATE `Brand` SET `image` = '/images/demo/dress-08.webp' WHERE `slug` = 'sapphire' AND (`image` IS NULL OR `image` = '');
UPDATE `Brand` SET `image` = '/images/demo/dress-07.webp' WHERE `slug` = 'kayseria' AND (`image` IS NULL OR `image` = '');
UPDATE `Brand` SET `image` = '/images/demo/shawl-07.webp' WHERE `slug` = 'zilbaji' AND (`image` IS NULL OR `image` = '');
UPDATE `Brand` SET `image` = '/images/demo/dress-10.webp' WHERE `slug` = 'edenrobe' AND (`image` IS NULL OR `image` = '');
UPDATE `Brand` SET `image` = '/images/demo/dress-09.webp' WHERE `slug` = 'alkaram-studio' AND (`image` IS NULL OR `image` = '');
UPDATE `Brand` SET `image` = '/images/demo/shawl-04.webp' WHERE `slug` = 'bonanza-satrangi' AND (`image` IS NULL OR `image` = '');

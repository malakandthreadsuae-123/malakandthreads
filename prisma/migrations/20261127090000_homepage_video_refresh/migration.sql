-- Homepage refresh (data only): new hero video, embroidered video story, single newsletter sign-up.

-- Point the original seeded hero banner at the new video and its matching poster.
-- Banners an admin has already changed (different video) are left untouched.
UPDATE `Banner`
SET `videoUrl` = '/videos/hero-embroidered.mp4',
    `imageUrl` = '/images/hero-embroidered.webp',
    `mobileImageUrl` = NULL,
    `imageAlt` = 'Model in an embroidered teal outfit with traditional gold jewellery',
    `eyebrow` = 'The Embroidered Edit · UAE',
    `title` = 'Elegance, Woven for the Emirates',
    `subtitle` = 'Designer dresses, premium shawls and statement bags from the labels you love — delivered across all seven emirates with Cash on Delivery.'
WHERE `placement` = 'HERO' AND `videoUrl` = '/videos/hero-fashion.mp4';

-- New "video story" homepage section (only if the database already has sections; a fresh database gets it from the seed).
INSERT INTO `HomepageSection` (`id`, `key`, `title`, `subtitle`, `isEnabled`, `sortOrder`, `config`, `updatedAt`)
SELECT 'hs_video_story', 'video_story', 'The Embroidered Edit',
       'Hand-finished embroidery, soft drape and heirloom detail — pieces made to be noticed.',
       true, 4,
       JSON_OBJECT('video', '/videos/story-embroidered.mp4', 'poster', '/images/story-embroidered.webp', 'href', '/category/womens-clothing', 'cta', 'Discover the edit'),
       CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE EXISTS (SELECT 1 FROM `HomepageSection`)
  AND NOT EXISTS (SELECT 1 FROM `HomepageSection` WHERE `key` = 'video_story');

-- The footer already has a newsletter sign-up; hide the duplicate homepage band.
UPDATE `HomepageSection` SET `isEnabled` = false WHERE `key` = 'newsletter';

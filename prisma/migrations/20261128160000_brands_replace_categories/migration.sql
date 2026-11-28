-- Owner request: Brand Collections (light, arch design) replaces Shop by Category right after the hero.
UPDATE `HomepageSection` SET `isEnabled` = true, `sortOrder` = 1 WHERE `key` = 'brands';
UPDATE `HomepageSection` SET `isEnabled` = false, `sortOrder` = 38 WHERE `key` = 'categories';

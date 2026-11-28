-- Owner request: remove Brand Collections from the homepage and show Shop by Category right after the hero.
UPDATE `HomepageSection` SET `isEnabled` = false, `sortOrder` = 37 WHERE `key` = 'brands';
UPDATE `HomepageSection` SET `sortOrder` = 1 WHERE `key` = 'categories';

-- Owner request: remove the Brand Collections section (brands are now shown in the homepage hero).
UPDATE `HomepageSection` SET `isEnabled` = false, `sortOrder` = 37 WHERE `key` = 'brands';

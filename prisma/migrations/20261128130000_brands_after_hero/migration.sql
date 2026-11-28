-- Show Brand Collections directly after the hero (owner request).
-- The hidden trust strip moves out of the way so the order stays unambiguous.
UPDATE `HomepageSection` SET `sortOrder` = 1 WHERE `key` = 'brands';
UPDATE `HomepageSection` SET `sortOrder` = 40 WHERE `key` = 'trust_strip';

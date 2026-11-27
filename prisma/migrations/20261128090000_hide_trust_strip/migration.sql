-- Hide the delivery / COD / returns / WhatsApp strip under the hero (owner request).
-- It stays in the database and can be switched back on in Admin -> Homepage.
UPDATE `HomepageSection` SET `isEnabled` = false WHERE `key` = 'trust_strip';

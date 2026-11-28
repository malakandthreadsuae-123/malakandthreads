-- Owner request: show the FAQ on the homepage (questions are read from the FAQ page in Admin → Content).
INSERT INTO `HomepageSection` (`id`, `key`, `title`, `subtitle`, `isEnabled`, `sortOrder`, `config`, `updatedAt`)
VALUES ('hs_faq_homepage', 'faq', 'Frequently Asked Questions', 'Delivery, payment, wholesale and more — quick answers to what customers ask us most.', true, 10, '{"limit":6}', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `isEnabled` = true;

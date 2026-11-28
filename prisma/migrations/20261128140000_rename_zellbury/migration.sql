-- Correct the brand name: Zilbaji -> Zellbury.
UPDATE `Brand` SET `name` = 'Zellbury', `slug` = 'zellbury' WHERE `slug` = 'zilbaji';

-- Owner request: after Brand Collections show four categories: Bags, Girl Dress, Shawls, Random Collection.
UPDATE `HomepageSection` SET `isEnabled` = true, `sortOrder` = 2,
  `config` = '{"slugs":["bags","womens-dresses","shawls","random-collections"],"labels":{"womens-dresses":"Girl Dress","random-collections":"Random Collection"}}'
WHERE `key` = 'categories';
UPDATE `HomepageSection` SET `sortOrder` = 3 WHERE `key` = 'product_tabs' AND `sortOrder` <= 2;

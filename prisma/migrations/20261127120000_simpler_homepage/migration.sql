-- Simpler homepage (data only): ten focused sections in a clear order.
-- Hidden sections stay in the database and can be switched back on in Admin → Homepage.
UPDATE `HomepageSection` SET `sortOrder` = CASE `key`
    WHEN 'hero' THEN 0
    WHEN 'trust_strip' THEN 1
    WHEN 'categories' THEN 2
    WHEN 'product_tabs' THEN 3
    WHEN 'dresses' THEN 4
    WHEN 'video_story' THEN 5
    WHEN 'shawls' THEN 6
    WHEN 'brands' THEN 7
    WHEN 'bags' THEN 8
    WHEN 'testimonials' THEN 9
    ELSE `sortOrder` END
WHERE `key` IN ('hero', 'trust_strip', 'categories', 'product_tabs', 'dresses', 'video_story', 'shawls', 'brands', 'bags', 'testimonials');

UPDATE `HomepageSection` SET `isEnabled` = false
WHERE `key` IN ('promo_banners', 'shop_by_price', 'seasonal', 'featured', 'gallery', 'whatsapp', 'trust');

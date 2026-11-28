-- Owner request: "Delivery charges 17 dirham across UAE (charges may vary according to your location)" everywhere, incl. the header.
-- Settings: AED 17 default fee, no free-delivery threshold, new announcement bar text (overrides any saved values).
INSERT INTO `WebsiteSetting` (`key`, `value`, `updatedAt`) VALUES
  ('announcement', JSON_QUOTE('Delivery charges 17 dirham across UAE (charges may vary according to your location) · Cash on Delivery available'), CURRENT_TIMESTAMP(3)),
  ('announcementEnabled', 'true', CURRENT_TIMESTAMP(3)),
  ('freeShippingThreshold', '0', CURRENT_TIMESTAMP(3)),
  ('defaultShippingFee', '1700', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updatedAt` = VALUES(`updatedAt`);

-- Per-emirate free-delivery overrides off; fees already AED 17 (previous migration).
UPDATE `ShippingRate` SET `freeShippingThreshold` = NULL;

-- FAQ "Do you deliver to all emirates?" answer + Shipping Policy wording.
UPDATE `Page` SET `content` = REPLACE(`content`, 'The delivery fee for your emirate is shown at checkout.\n\n## How much is delivery?', 'Delivery charges 17 dirham across UAE (charges may vary according to your location).\n\n## How much is delivery?') WHERE `slug` = 'faq';
UPDATE `Page` SET `content` = REPLACE(`content`, ' The exact delivery fee is always shown at checkout before you place your order. Orders above the free-delivery threshold shown on the website qualify for free delivery.', ' The exact delivery fee is always shown at checkout before you place your order.') WHERE `slug` = 'shipping-policy';
UPDATE `Page` SET `seoDescription` = 'Delivery charges are AED 17 across the UAE (may vary by location). How we deliver MALAKAND THREADS orders to all seven emirates.' WHERE `slug` = 'shipping-policy' AND `seoDescription` = 'Delivery fees, free delivery threshold and how we deliver MALAKAND THREADS orders across all seven UAE emirates.';

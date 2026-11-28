-- Owner request: five more FAQ answers (delivery charge, international delivery, wholesale, WhatsApp help, changes/cancellations).
-- Inserted after the first question (or appended if the FAQ was reworded in Admin); edits are kept; skipped if already added.
UPDATE `Page` SET `content` = IF(LOCATE('\n\n## Can I pay cash on delivery?', `content`) > 0,
  INSERT(`content`, LOCATE('\n\n## Can I pay cash on delivery?', `content`), 0, CONCAT('\n\n', '## How much is delivery?

Delivery is AED 17 across the UAE. Charges may vary according to your location — the exact fee is always shown at checkout before you place your order.

## Do you deliver outside the UAE?

Yes, we accept international deliveries across the globe. Message us on WhatsApp with your country and the items you would like, and we will confirm the delivery charges for you.

## Do you sell wholesale?

Yes. Kindly [contact us](/contact) or message us on WhatsApp for bulk and wholesale orders.

## Can I get help with my order on WhatsApp?

Yes. Tap the WhatsApp button on any page and send us the product name or link — our team can help with sizes, colours and placing your order.

## Can I change or cancel my order?

Contact us as soon as possible with your order number. If your order has not been dispatched yet we will do our best to change or cancel it. See our [Cancellation Policy](/cancellation-policy) for details.')),
  CONCAT(`content`, '\n\n', '## How much is delivery?

Delivery is AED 17 across the UAE. Charges may vary according to your location — the exact fee is always shown at checkout before you place your order.

## Do you deliver outside the UAE?

Yes, we accept international deliveries across the globe. Message us on WhatsApp with your country and the items you would like, and we will confirm the delivery charges for you.

## Do you sell wholesale?

Yes. Kindly [contact us](/contact) or message us on WhatsApp for bulk and wholesale orders.

## Can I get help with my order on WhatsApp?

Yes. Tap the WhatsApp button on any page and send us the product name or link — our team can help with sizes, colours and placing your order.

## Can I change or cancel my order?

Contact us as soon as possible with your order number. If your order has not been dispatched yet we will do our best to change or cancel it. See our [Cancellation Policy](/cancellation-policy) for details.'))
WHERE `slug` = 'faq' AND `content` NOT LIKE '%Do you deliver outside the UAE?%';

-- Delivery is AED 17 across the UAE (owner). Only rates still on the old AED 25 default are changed.
UPDATE `ShippingRate` SET `fee` = 1700 WHERE `fee` IN (2500, 3000);

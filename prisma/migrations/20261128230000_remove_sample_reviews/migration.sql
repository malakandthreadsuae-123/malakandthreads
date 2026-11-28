-- Owner request: remove the sample reviews from the Customer Feedback section.
DELETE FROM `Testimonial` WHERE `type` = 'SAMPLE';

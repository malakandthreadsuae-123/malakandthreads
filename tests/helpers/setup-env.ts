import "dotenv/config";

// Integration tests ALWAYS use the dedicated test database — never the development or production DB.
if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL must be set to run tests");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
(process.env as Record<string, string>).NODE_ENV = "test";
process.env.AUTH_SECRET ||= "test-secret-test-secret-test-secret-123456";
// Never send real email or call real Stripe from tests.
process.env.SMTP_HOST = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASSWORD = "";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy_for_signature_tests_only";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret_for_unit_tests";

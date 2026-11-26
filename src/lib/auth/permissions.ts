/**
 * Role-based access control. Permissions are stored in the database
 * (Role ↔ Permission) and enforced server-side on every admin API call.
 * This file is the canonical list used by the seed script.
 */

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  PRODUCTS_READ: "products.read",
  PRODUCTS_WRITE: "products.write",
  PRODUCTS_DELETE: "products.delete",
  CATEGORIES_WRITE: "categories.write",
  BRANDS_WRITE: "brands.write",
  INVENTORY_WRITE: "inventory.write",
  ORDERS_READ: "orders.read",
  ORDERS_WRITE: "orders.write",
  ORDERS_REFUND: "orders.refund",
  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_WRITE: "customers.write",
  COUPONS_WRITE: "coupons.write",
  REVIEWS_WRITE: "reviews.write",
  CONTENT_WRITE: "content.write",
  HOMEPAGE_WRITE: "homepage.write",
  REPORTS_VIEW: "reports.view",
  SETTINGS_WRITE: "settings.write",
  USERS_MANAGE: "users.manage",
  AUDIT_VIEW: "audit.view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as PermissionKey[];

const P = PERMISSIONS;

export const ROLE_DEFINITIONS: {
  key: string;
  name: string;
  description: string;
  isAdmin: boolean;
  permissions: PermissionKey[];
}[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Full access including settings, admin users and audit log",
    isAdmin: true,
    permissions: ALL_PERMISSIONS,
  },
  {
    key: "manager",
    name: "Manager",
    description: "Runs the store day-to-day: catalogue, orders, customers, content and reports",
    isAdmin: true,
    permissions: ALL_PERMISSIONS.filter((p) => p !== P.USERS_MANAGE && p !== P.SETTINGS_WRITE && p !== P.AUDIT_VIEW),
  },
  {
    key: "order_manager",
    name: "Order Manager",
    description: "Processes orders, deliveries and customer queries",
    isAdmin: true,
    permissions: [P.DASHBOARD_VIEW, P.ORDERS_READ, P.ORDERS_WRITE, P.CUSTOMERS_READ, P.PRODUCTS_READ],
  },
  {
    key: "product_manager",
    name: "Product Manager",
    description: "Manages products, categories, brands and stock",
    isAdmin: true,
    permissions: [
      P.DASHBOARD_VIEW,
      P.PRODUCTS_READ,
      P.PRODUCTS_WRITE,
      P.PRODUCTS_DELETE,
      P.CATEGORIES_WRITE,
      P.BRANDS_WRITE,
      P.INVENTORY_WRITE,
      P.REVIEWS_WRITE,
    ],
  },
  {
    key: "customer",
    name: "Customer",
    description: "Storefront customer account",
    isAdmin: false,
    permissions: [],
  },
];

export function hasPermission(granted: readonly string[], needed: PermissionKey | PermissionKey[]): boolean {
  const list = Array.isArray(needed) ? needed : [needed];
  return list.every((p) => granted.includes(p));
}

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Role_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(80) NOT NULL,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `Permission_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,

    INDEX `RolePermission_permissionId_idx`(`permissionId`),
    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `roleId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `emailVerifiedAt` DATETIME(3) NULL,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `failedLoginCount` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `marketingOptIn` BOOLEAN NOT NULL DEFAULT false,
    `deletionRequestedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_roleId_idx`(`roleId`),
    INDEX `User_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(128) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `kind` ENUM('CUSTOMER', 'ADMIN') NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `ip` VARCHAR(64) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_tokenHash_key`(`tokenHash`),
    INDEX `Session_userId_idx`(`userId`),
    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('EMAIL_VERIFY', 'PASSWORD_RESET') NOT NULL,
    `tokenHash` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AuthToken_tokenHash_key`(`tokenHash`),
    INDEX `AuthToken_userId_type_idx`(`userId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserAddress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(50) NULL,
    `fullName` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `emirate` ENUM('ABU_DHABI', 'DUBAI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH') NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `area` VARCHAR(120) NOT NULL,
    `street` VARCHAR(160) NOT NULL,
    `building` VARCHAR(160) NOT NULL,
    `apartment` VARCHAR(60) NULL,
    `landmark` VARCHAR(160) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserAddress_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('EXPORT', 'DELETE') NOT NULL,
    `status` ENUM('OPEN', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'OPEN',
    `message` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DataRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `description` TEXT NULL,
    `content` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `parentId` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `showInMenu` BOOLEAN NOT NULL DEFAULT true,
    `seoTitle` VARCHAR(160) NULL,
    `seoDescription` VARCHAR(320) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_slug_key`(`slug`),
    INDEX `Category_parentId_idx`(`parentId`),
    INDEX `Category_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Brand` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `logo` VARCHAR(500) NULL,
    `image` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `content` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `seoTitle` VARCHAR(160) NULL,
    `seoDescription` VARCHAR(320) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Brand_slug_key`(`slug`),
    INDEX `Brand_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(220) NOT NULL,
    `sku` VARCHAR(80) NOT NULL,
    `shortDescription` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `brandId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `regularPrice` INTEGER NOT NULL,
    `salePrice` INTEGER NULL,
    `costPrice` INTEGER NULL,
    `material` VARCHAR(160) NULL,
    `careInstructions` VARCHAR(500) NULL,
    `weightGrams` INTEGER NULL,
    `videoUrl` VARCHAR(500) NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isBestSeller` BOOLEAN NOT NULL DEFAULT false,
    `isNewArrival` BOOLEAN NOT NULL DEFAULT false,
    `isOnSale` BOOLEAN NOT NULL DEFAULT false,
    `isTrending` BOOLEAN NOT NULL DEFAULT false,
    `isDemo` BOOLEAN NOT NULL DEFAULT false,
    `seoTitle` VARCHAR(160) NULL,
    `seoDescription` VARCHAR(320) NULL,
    `seoKeywords` VARCHAR(255) NULL,
    `salesCount` INTEGER NOT NULL DEFAULT 0,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    UNIQUE INDEX `Product_sku_key`(`sku`),
    INDEX `Product_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Product_brandId_idx`(`brandId`),
    INDEX `Product_categoryId_idx`(`categoryId`),
    INDEX `Product_isFeatured_idx`(`isFeatured`),
    INDEX `Product_isBestSeller_idx`(`isBestSeller`),
    INDEX `Product_isNewArrival_idx`(`isNewArrival`),
    INDEX `Product_salesCount_idx`(`salesCount`),
    INDEX `Product_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductCategory` (
    `productId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,

    INDEX `ProductCategory_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`productId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductImage` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `alt` VARCHAR(255) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductImage_productId_sortOrder_idx`(`productId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `size` VARCHAR(40) NULL,
    `color` VARCHAR(60) NULL,
    `colorHex` VARCHAR(9) NULL,
    `priceOverride` INTEGER NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `lowStockThreshold` INTEGER NOT NULL DEFAULT 3,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductVariant_sku_key`(`sku`),
    INDEX `ProductVariant_productId_idx`(`productId`),
    INDEX `ProductVariant_stock_idx`(`stock`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `change` INTEGER NOT NULL,
    `stockAfter` INTEGER NOT NULL,
    `reason` ENUM('INITIAL', 'ADJUSTMENT', 'ORDER', 'CANCELLATION', 'REFUND_RESTOCK', 'IMPORT', 'CORRECTION') NOT NULL,
    `note` VARCHAR(255) NULL,
    `orderId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryTransaction_variantId_createdAt_idx`(`variantId`, `createdAt`),
    INDEX `InventoryTransaction_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(160) NULL,
    `body` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `isVerifiedPurchase` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Review_productId_status_idx`(`productId`, `status`),
    UNIQUE INDEX `Review_productId_userId_key`(`productId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cart` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `guestToken` VARCHAR(128) NULL,
    `couponCode` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cart_userId_key`(`userId`),
    UNIQUE INDEX `Cart_guestToken_key`(`guestToken`),
    INDEX `Cart_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartItem` (
    `id` VARCHAR(191) NOT NULL,
    `cartId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CartItem_variantId_idx`(`variantId`),
    UNIQUE INDEX `CartItem_cartId_variantId_key`(`cartId`, `variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Wishlist` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Wishlist_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WishlistItem` (
    `id` VARCHAR(191) NOT NULL,
    `wishlistId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WishlistItem_productId_idx`(`productId`),
    UNIQUE INDEX `WishlistItem_wishlistId_productId_key`(`wishlistId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(30) NOT NULL,
    `accessToken` VARCHAR(64) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `emirate` ENUM('ABU_DHABI', 'DUBAI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH') NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `area` VARCHAR(120) NOT NULL,
    `street` VARCHAR(160) NOT NULL,
    `building` VARCHAR(160) NOT NULL,
    `apartment` VARCHAR(60) NULL,
    `landmark` VARCHAR(160) NULL,
    `deliveryInstructions` VARCHAR(500) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` ENUM('COD', 'STRIPE') NOT NULL,
    `paymentStatus` ENUM('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'UNPAID',
    `currency` VARCHAR(3) NOT NULL DEFAULT 'AED',
    `subtotal` INTEGER NOT NULL,
    `discountTotal` INTEGER NOT NULL DEFAULT 0,
    `shippingFee` INTEGER NOT NULL DEFAULT 0,
    `codFee` INTEGER NOT NULL DEFAULT 0,
    `vatRateBps` INTEGER NOT NULL,
    `vatInclusive` BOOLEAN NOT NULL DEFAULT true,
    `vatAmount` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `couponId` VARCHAR(191) NULL,
    `couponCode` VARCHAR(50) NULL,
    `stockRestored` BOOLEAN NOT NULL DEFAULT false,
    `customerIp` VARCHAR(64) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    UNIQUE INDEX `Order_accessToken_key`(`accessToken`),
    INDEX `Order_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `Order_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Order_paymentStatus_idx`(`paymentStatus`),
    INDEX `Order_email_idx`(`email`),
    INDEX `Order_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `variantId` VARCHAR(191) NULL,
    `productName` VARCHAR(200) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `size` VARCHAR(40) NULL,
    `color` VARCHAR(60) NULL,
    `image` VARCHAR(500) NULL,
    `brandName` VARCHAR(120) NULL,
    `unitPrice` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `lineTotal` INTEGER NOT NULL,

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderStatusHistory` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL,
    `note` VARCHAR(500) NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderStatusHistory_orderId_createdAt_idx`(`orderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderNote` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `authorName` VARCHAR(120) NULL,
    `note` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderNote_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `provider` ENUM('COD', 'STRIPE') NOT NULL,
    `providerRef` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'AED',
    `status` ENUM('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `rawStatus` VARCHAR(60) NULL,
    `refundedAmount` INTEGER NOT NULL DEFAULT 0,
    `failureReason` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_providerRef_key`(`providerRef`),
    INDEX `Payment_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentEvent` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NULL,
    `provider` VARCHAR(30) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `payload` JSON NOT NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PaymentEvent_eventId_key`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shipment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `courier` VARCHAR(100) NULL,
    `trackingNumber` VARCHAR(120) NULL,
    `trackingUrl` VARCHAR(500) NULL,
    `estimatedDelivery` VARCHAR(120) NULL,
    `notes` VARCHAR(500) NULL,
    `shippedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Shipment_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingRate` (
    `id` VARCHAR(191) NOT NULL,
    `emirate` ENUM('ABU_DHABI', 'DUBAI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH') NOT NULL,
    `fee` INTEGER NOT NULL,
    `freeShippingThreshold` INTEGER NULL,
    `estimate` VARCHAR(120) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ShippingRate_emirate_key`(`emirate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `type` ENUM('PERCENTAGE', 'FIXED', 'FREE_SHIPPING') NOT NULL,
    `value` INTEGER NOT NULL,
    `minSubtotal` INTEGER NULL,
    `maxDiscount` INTEGER NULL,
    `usageLimit` INTEGER NULL,
    `perCustomerLimit` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CouponUsage` (
    `id` VARCHAR(191) NOT NULL,
    `couponId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `discount` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CouponUsage_orderId_key`(`orderId`),
    INDEX `CouponUsage_couponId_email_idx`(`couponId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `description` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BlogCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogPost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(220) NOT NULL,
    `excerpt` VARCHAR(500) NULL,
    `content` LONGTEXT NOT NULL,
    `coverImage` VARCHAR(500) NULL,
    `coverAlt` VARCHAR(255) NULL,
    `categoryId` VARCHAR(191) NULL,
    `tags` VARCHAR(500) NULL,
    `authorName` VARCHAR(120) NOT NULL DEFAULT 'MALAKAND THREADS Team',
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `seoTitle` VARCHAR(160) NULL,
    `seoDescription` VARCHAR(320) NULL,
    `canonicalUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BlogPost_slug_key`(`slug`),
    INDEX `BlogPost_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `BlogPost_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Page` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `seoTitle` VARCHAR(160) NULL,
    `seoDescription` VARCHAR(320) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `showInFooter` BOOLEAN NOT NULL DEFAULT true,
    `needsReview` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Page_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banner` (
    `id` VARCHAR(191) NOT NULL,
    `placement` ENUM('HERO', 'PROMO', 'SEASONAL') NOT NULL,
    `eyebrow` VARCHAR(120) NULL,
    `title` VARCHAR(200) NOT NULL,
    `subtitle` VARCHAR(500) NULL,
    `imageUrl` VARCHAR(500) NULL,
    `mobileImageUrl` VARCHAR(500) NULL,
    `videoUrl` VARCHAR(500) NULL,
    `imageAlt` VARCHAR(255) NULL,
    `ctaLabel` VARCHAR(60) NULL,
    `ctaHref` VARCHAR(300) NULL,
    `cta2Label` VARCHAR(60) NULL,
    `cta2Href` VARCHAR(300) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Banner_placement_isActive_sortOrder_idx`(`placement`, `isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomepageSection` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(60) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `subtitle` VARCHAR(500) NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `config` JSON NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HomepageSection_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Testimonial` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `location` VARCHAR(120) NULL,
    `text` TEXT NOT NULL,
    `rating` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebsiteSetting` (
    `key` VARCHAR(80) NOT NULL,
    `value` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsletterSubscriber` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `status` ENUM('SUBSCRIBED', 'UNSUBSCRIBED') NOT NULL DEFAULT 'SUBSCRIBED',
    `source` VARCHAR(60) NULL,
    `unsubscribeToken` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unsubscribedAt` DATETIME(3) NULL,

    UNIQUE INDEX `NewsletterSubscriber_email_key`(`email`),
    UNIQUE INDEX `NewsletterSubscriber_unsubscribeToken_key`(`unsubscribeToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactMessage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `subject` VARCHAR(200) NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContactMessage_isRead_createdAt_idx`(`isRead`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Redirect` (
    `id` VARCHAR(191) NOT NULL,
    `fromPath` VARCHAR(300) NOT NULL,
    `toPath` VARCHAR(300) NULL,
    `statusCode` INTEGER NOT NULL DEFAULT 301,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Redirect_fromPath_key`(`fromPath`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(80) NOT NULL,
    `entity` VARCHAR(60) NOT NULL,
    `entityId` VARCHAR(80) NULL,
    `details` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdminAuditLog_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `AdminAuditLog_createdAt_idx`(`createdAt`),
    INDEX `AdminAuditLog_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailLog` (
    `id` VARCHAR(191) NOT NULL,
    `to` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `template` VARCHAR(60) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `error` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmailLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthToken` ADD CONSTRAINT `AuthToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAddress` ADD CONSTRAINT `UserAddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DataRequest` ADD CONSTRAINT `DataRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCategory` ADD CONSTRAINT `ProductCategory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCategory` ADD CONSTRAINT `ProductCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryTransaction` ADD CONSTRAINT `InventoryTransaction_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wishlist` ADD CONSTRAINT `Wishlist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_wishlistId_fkey` FOREIGN KEY (`wishlistId`) REFERENCES `Wishlist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishlistItem` ADD CONSTRAINT `WishlistItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderStatusHistory` ADD CONSTRAINT `OrderStatusHistory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderNote` ADD CONSTRAINT `OrderNote_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentEvent` ADD CONSTRAINT `PaymentEvent_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shipment` ADD CONSTRAINT `Shipment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponUsage` ADD CONSTRAINT `CouponUsage_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponUsage` ADD CONSTRAINT `CouponUsage_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlogPost` ADD CONSTRAINT `BlogPost_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `BlogCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminAuditLog` ADD CONSTRAINT `AdminAuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

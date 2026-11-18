
CREATE DATABASE IF NOT EXISTS `roti_hajatan_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `roti_hajatan_db`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(160) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  `phone` VARCHAR(40) NULL,
  `default_address` TEXT NULL,
  `google_id` VARCHAR(191) NULL,
  `avatar` TEXT NULL,
  `password_hash` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_email` (`email`),
  KEY `idx_users_google_id` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `token` VARCHAR(128) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token`),
  KEY `idx_sessions_user_id` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(180) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `category` VARCHAR(120) NOT NULL,
  `description` TEXT NOT NULL,
  `price` INT UNSIGNED NOT NULL DEFAULT 0,
  `variants` TEXT NOT NULL,
  `image` TEXT NOT NULL,
  `stock` INT UNSIGNED NOT NULL DEFAULT 20,
  `expired_days` INT UNSIGNED NOT NULL DEFAULT 3,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_products_slug` (`slug`),
  KEY `idx_products_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stores` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(160) NOT NULL,
  `address` TEXT NOT NULL,
  `phone` VARCHAR(40) NOT NULL,
  `hours` VARCHAR(120) NOT NULL DEFAULT '06.00 – 19.00 WIB',
  `maps_url` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(60) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `discount_type` ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
  `discount_value` INT UNSIGNED NOT NULL DEFAULT 0,
  `min_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_promos_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ads` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(220) NOT NULL,
  `subtitle` TEXT NOT NULL,
  `image` TEXT NOT NULL,
  `cta_label` VARCHAR(80) NOT NULL DEFAULT 'Lihat Menu',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` TINYINT UNSIGNED NOT NULL,
  `brand_name` VARCHAR(160) NOT NULL,
  `tagline` VARCHAR(220) NOT NULL DEFAULT '',
  `footer_service_text` VARCHAR(220) NOT NULL DEFAULT '',
  `operating_hours` VARCHAR(160) NOT NULL DEFAULT '',
  `footer_address` TEXT NULL,
  `footer_copyright` VARCHAR(220) NOT NULL DEFAULT '',
  `admin_whatsapp` VARCHAR(40) NOT NULL DEFAULT '',
  `bank_name` VARCHAR(60) NOT NULL DEFAULT '',
  `bank_account_number` VARCHAR(80) NOT NULL DEFAULT '',
  `bank_account_holder` VARCHAR(160) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_code` VARCHAR(64) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `store_id` INT UNSIGNED NULL,
  `store_name` VARCHAR(160) NULL,
  `customer_name` VARCHAR(160) NOT NULL,
  `customer_email` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(40) NOT NULL,
  `delivery_address` TEXT NOT NULL,
  `event_datetime` VARCHAR(64) NOT NULL,
  `order_type` ENUM('po', 'direct') NOT NULL DEFAULT 'po',
  `payment_method` ENUM('cash', 'transfer') NOT NULL DEFAULT 'transfer',
  `promo_code` VARCHAR(60) NULL,
  `discount_amount` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_amount` INT UNSIGNED NOT NULL DEFAULT 0,
  `dp_amount` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('pending_wa', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending_wa',
  `created_at` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_orders_code` (`order_code`),
  KEY `idx_orders_user_id` (`user_id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `product_name` VARCHAR(180) NOT NULL,
  `variant` VARCHAR(120) NOT NULL DEFAULT 'Original',
  `price` INT UNSIGNED NOT NULL DEFAULT 0,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `subtotal` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

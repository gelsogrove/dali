/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.6.24-MariaDB, for debian-linux-gnu (aarch64)
--
-- Host: localhost    Database: dalila_db
-- ------------------------------------------------------
-- Server version	10.6.24-MariaDB-ubu2204

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL COMMENT 'create, update, delete, login, etc.',
  `entity_type` varchar(50) DEFAULT NULL COMMENT 'property, video, photogallery, user',
  `entity_id` int(10) unsigned DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
INSERT INTO `activity_log` VALUES (1,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:12:54'),(2,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:17:11'),(3,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:27:24'),(4,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:29:47'),(5,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:42:07'),(6,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:49:02'),(7,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:49:12'),(8,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:49:23'),(9,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:50:38'),(10,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:51:25'),(11,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:52:04'),(12,1,'create','property',8,'Created property: Test Property 2','192.168.65.1','2026-01-19 12:52:04'),(13,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:52:17'),(14,1,'create','property',9,'Created property: tedsf','192.168.65.1','2026-01-19 12:52:17'),(15,1,'create','property',10,'Created property: tedsf','192.168.65.1','2026-01-19 12:52:41'),(16,1,'create','property',11,'Created property: test','192.168.65.1','2026-01-19 12:52:52'),(17,1,'create','property',12,'Created property: ttt','192.168.65.1','2026-01-19 12:53:08'),(18,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 12:56:07'),(19,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 13:28:48'),(20,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 13:31:13'),(21,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 21:43:05'),(22,1,'login',NULL,NULL,'User logged in','192.168.65.1','2026-01-19 21:46:42');
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `role` enum('admin','editor','viewer') DEFAULT 'editor',
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (1,'admin@dalila.com','$2y$10$Wy/DX5zbz/7hhGnXzjZItuoBdYFarw.wVBSj0Pzu9VlPAdI1gMrLK','Admin','User','admin',1,'2026-01-19 21:46:42','2026-01-19 11:24:56','2026-01-19 21:46:42');
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blogs`
--

DROP TABLE IF EXISTS `blogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `blogs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `featured_image` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `published_date` date DEFAULT NULL,
  `created_by` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `idx_slug` (`slug`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_display_order` (`display_order`),
  KEY `idx_published_date` (`published_date`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `blogs_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blogs`
--

LOCK TABLES `blogs` WRITE;
/*!40000 ALTER TABLE `blogs` DISABLE KEYS */;
INSERT INTO `blogs` VALUES (1,'First Blog','first-blog','Welcome to our blog','This is the first blog post on our website',NULL,NULL,1,1,'2026-01-19',1,'2026-01-19 13:33:21','2026-01-19 13:33:21'),(3,'Top 5 Tips for First-Time Home Buyers','top-5-tips-first-time-home-buyers','Essential advice for your first property purchase','Buying your first home is an exciting milestone. Here are the most important tips to help you navigate the process successfully.','Buying your first home is one of the most significant financial decisions you will make. Here are five essential tips to help you through the process:\n\n1. Get Pre-Approved for a Mortgage\nBefore you start house hunting, get pre-approved for a mortgage. This will give you a clear understanding of your budget and show sellers that you are a serious buyer.\n\n2. Research Neighborhoods Thoroughly\nDon\'t just focus on the house itself. Research the neighborhood, schools, local amenities, and future development plans in the area.\n\n3. Budget for Additional Costs\nRemember to factor in closing costs, moving expenses, home inspection fees, and ongoing maintenance costs.\n\n4. Don\'t Skip the Home Inspection\nAlways get a professional home inspection. This can reveal potential issues that might not be visible during a showing.\n\n5. Work with a Real Estate Agent\nAn experienced agent can guide you through the process, negotiate on your behalf, and help you avoid common pitfalls.',NULL,1,2,'2026-01-15',1,'2026-01-19 16:13:05','2026-01-19 16:13:05'),(4,'Miami Real Estate Market Trends 2026','miami-real-estate-market-trends-2026','What to expect from the Miami property market this year','An in-depth look at the current trends shaping Miami\'s real estate market and predictions for the rest of 2026.','The Miami real estate market continues to show strong growth in 2026. Here\'s what you need to know:\n\nMarket Overview:\nPrices have stabilized after the rapid growth of previous years, creating excellent opportunities for both buyers and sellers.\n\nKey Trends:\n- Increased demand for waterfront properties\n- Growing interest in eco-friendly and smart homes\n- Strong international buyer presence\n- New developments in emerging neighborhoods\n\nExpert Predictions:\nAnalysts expect steady appreciation throughout the year, with particular strength in the luxury segment.\n\nBest Time to Buy:\nSpring and fall typically offer the best opportunities for buyers, with more inventory and motivated sellers.',NULL,1,3,'2026-01-10',1,'2026-01-19 16:13:05','2026-01-19 16:13:05'),(5,'The Ultimate Guide to Selling Your Home Fast','ultimate-guide-selling-home-fast','Proven strategies to sell your property quickly','Learn the secrets to attracting buyers and closing deals faster with these professional selling strategies.','Selling your home doesn\'t have to be a lengthy process. Follow these proven strategies:\n\n1. Price it Right from the Start\nOverpricing is the #1 reason homes sit on the market. Work with your agent to set a competitive price.\n\n2. Stage Your Home Professionally\nFirst impressions matter. Professional staging can increase your home\'s value by 5-15%.\n\n3. Professional Photography is Essential\nMost buyers start their search online. High-quality photos are crucial for attracting interest.\n\n4. Make Necessary Repairs\nFix any obvious issues before listing. Small repairs can prevent big negotiations later.\n\n5. Be Flexible with Showings\nThe more available you are for showings, the faster you\'ll find a buyer.\n\n6. Market Aggressively\nUse all available channels: MLS, social media, open houses, and virtual tours.',NULL,1,4,'2026-01-05',1,'2026-01-19 16:13:05','2026-01-19 16:13:05');
/*!40000 ALTER TABLE `blogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `photogallery`
--

DROP TABLE IF EXISTS `photogallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `photogallery` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `property_id` int(10) unsigned NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `medium_url` varchar(255) DEFAULT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `file_size` int(11) DEFAULT NULL COMMENT 'Size in bytes',
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_property_id` (`property_id`),
  KEY `idx_display_order` (`display_order`),
  KEY `idx_is_featured` (`is_featured`),
  CONSTRAINT `photogallery_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `photogallery`
--

LOCK TABLES `photogallery` WRITE;
/*!40000 ALTER TABLE `photogallery` DISABLE KEYS */;
/*!40000 ALTER TABLE `photogallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `properties`
--

DROP TABLE IF EXISTS `properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `properties` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `bedrooms` int(11) DEFAULT NULL,
  `bathrooms` decimal(3,1) DEFAULT NULL,
  `square_feet` int(11) DEFAULT NULL,
  `lot_size` varchar(50) DEFAULT NULL,
  `year_built` int(11) DEFAULT NULL,
  `property_type` varchar(50) DEFAULT NULL COMMENT 'Single Family, Condo, Townhouse, etc.',
  `status` enum('active','pending','sold','draft') DEFAULT 'draft',
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `zip_code` varchar(20) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `featured` tinyint(1) DEFAULT 0,
  `featured_image` varchar(255) DEFAULT NULL,
  `mls_number` varchar(100) DEFAULT NULL,
  `created_by` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `idx_slug` (`slug`),
  KEY `idx_status` (`status`),
  KEY `idx_featured` (`featured`),
  KEY `idx_city` (`city`),
  KEY `idx_price` (`price`),
  KEY `idx_created_at` (`created_at`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `properties`
--

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
INSERT INTO `properties` VALUES (1,'Luxury Waterfront Villa','luxury-waterfront-villa','Stunning waterfront property with panoramic ocean views. Features high-end finishes, gourmet kitchen, and infinity pool.',2500000.00,5,4.5,4800,NULL,NULL,'Single Family','active','123 Ocean Drive','Miami Beach','FL','33139',NULL,NULL,1,NULL,NULL,1,'2026-01-19 11:24:56','2026-01-19 11:24:56'),(2,'Modern Downtown Condo','modern-downtown-condo','Contemporary condo in the heart of downtown. Walking distance to restaurants, shops, and entertainment.',650000.00,2,2.0,1400,NULL,NULL,'Condo','active','456 Main Street','Miami','FL','33130',NULL,NULL,1,NULL,NULL,1,'2026-01-19 11:24:56','2026-01-19 11:24:56'),(3,'Charming Family Home','charming-family-home','Beautifully maintained family home in quiet neighborhood. Large backyard perfect for entertaining.',485000.00,4,3.0,2600,NULL,NULL,'Single Family','active','789 Oak Avenue','Coral Gables','FL','33134',NULL,NULL,0,NULL,NULL,1,'2026-01-19 11:24:56','2026-01-19 11:24:56'),(4,'tedsf','tedsf','',3333.00,-4,0.0,0,NULL,NULL,'','draft','','','','',NULL,NULL,0,NULL,NULL,1,'2026-01-19 12:42:56','2026-01-19 12:42:56'),(5,'Test Property','test-property',NULL,100000.00,3,NULL,NULL,NULL,NULL,NULL,'draft',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,'2026-01-19 12:49:23','2026-01-19 12:49:23'),(6,'Test Property','test-property-1768827038',NULL,100000.00,3,NULL,NULL,NULL,NULL,NULL,'draft',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,'2026-01-19 12:50:38','2026-01-19 12:50:38'),(7,'Test Property','test-property-1768827085',NULL,100000.00,3,NULL,NULL,NULL,NULL,NULL,'draft',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,'2026-01-19 12:51:25','2026-01-19 12:51:25'),(8,'Test Property 2','test-property-2',NULL,100000.00,3,NULL,NULL,NULL,NULL,NULL,'draft',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,'2026-01-19 12:52:04','2026-01-19 12:52:04'),(9,'tedsf','tedsf-1768827137','',3333.00,-4,0.0,0,NULL,NULL,'0','draft','','','','',NULL,NULL,0,NULL,NULL,1,'2026-01-19 12:52:17','2026-01-19 12:52:17'),(10,'tedsf','tedsf-1768827161','',3333.00,-4,0.0,0,NULL,NULL,'0','draft','','','','',NULL,NULL,0,NULL,NULL,1,'2026-01-19 12:52:41','2026-01-19 12:52:41'),(11,'test','test','',18.99,0,0.0,0,NULL,NULL,'0','draft','','','','',NULL,NULL,0,NULL,NULL,1,'2026-01-19 12:52:52','2026-01-19 12:52:52'),(12,'ttt','ttt','',50.00,0,0.0,3232,NULL,NULL,'0','draft','','','','',NULL,NULL,0,NULL,NULL,1,'2026-01-19 12:53:08','2026-01-19 12:53:08');
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `property_amenities`
--

DROP TABLE IF EXISTS `property_amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_amenities` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `property_id` int(10) unsigned NOT NULL,
  `amenity_name` varchar(100) NOT NULL,
  `amenity_value` varchar(255) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL COMMENT 'Interior, Exterior, Community, etc.',
  PRIMARY KEY (`id`),
  KEY `idx_property_id` (`property_id`),
  KEY `idx_category` (`category`),
  CONSTRAINT `property_amenities_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_amenities`
--

LOCK TABLES `property_amenities` WRITE;
/*!40000 ALTER TABLE `property_amenities` DISABLE KEYS */;
/*!40000 ALTER TABLE `property_amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token` varchar(512) NOT NULL,
  `refresh_token` varchar(512) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_token` (`token`(255)),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES (1,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjQ3NzQsImV4cCI6MTc2ODgyODM3NH0.zs7Alrlx_0hSreexPJH4mGrJNr0B6gRtD_ttlHmlNmA','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNDc3NCwiZXhwIjoxNzY4ODI4Mzc0fQ.DKFg6q_pO5vOO9IHN4qpipPC4X5Ag8KWTlPw2Nw4TXI','192.168.65.1','curl/8.7.1','2026-01-19 13:12:54','2026-01-19 12:12:54'),(2,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjUwMzEsImV4cCI6MTc2ODgyODYzMX0.QOYh01LNWZXS3OqOZIIXLlLg9RhKlaIkIbIwfHqXiwI','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNTAzMSwiZXhwIjoxNzY4ODI4NjMxfQ.TDXiFuNWysU7nO2uHNXVx9UBFuf5IZQOZ8m2oNWEKDg','192.168.65.1','curl/8.7.1','2026-01-19 13:17:11','2026-01-19 12:17:11'),(3,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjU2NDQsImV4cCI6MTc2ODgyOTI0NH0.h5F-7B8N6OT5utD8rGm7fVKXobghplFKL72WcwAf09c','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNTY0NCwiZXhwIjoxNzY4ODI5MjQ0fQ.FzzADKixUVLG9vemUyvADYqkGIG-mPj8UvleYyvzOGc','192.168.65.1','curl/8.7.1','2026-01-19 13:27:24','2026-01-19 12:27:24'),(4,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjU3ODcsImV4cCI6MTc2ODgyOTM4N30.nnT7sGpKVZb3PP0EwMpz-3A26KSnyQggd2JAIJiWneI','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNTc4NywiZXhwIjoxNzY4ODI5Mzg3fQ.ccRkCSxAdm4PPlisdtRPBHNpICUdhO2pQ-9htg6RIPg','192.168.65.1','curl/8.7.1','2026-01-19 13:29:47','2026-01-19 12:29:47'),(5,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjY1MjcsImV4cCI6MTc2ODgzMDEyN30.lGqgO-Xfajh3N5uxyiYTNz1frVS-Wlkp6_FuoiqozzU','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNjUyNywiZXhwIjoxNzY4ODMwMTI3fQ.cfMvQV6h86Tzg5bWEYGXioLyaY2Uy4ca3o4NeuRFUf8','192.168.65.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-19 13:42:07','2026-01-19 12:42:07'),(6,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjY5NDIsImV4cCI6MTc2ODgzMDU0Mn0.O2An5x3l1dX9cmKO3imfghVx6rTqxafHwUO1u2XN9nk','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNjk0MiwiZXhwIjoxNzY4ODMwNTQyfQ.ivbsCz6lwdul6bUG4VVgsLPQ_0LrZQ243JIk0cfvQsQ','192.168.65.1','curl/8.7.1','2026-01-19 13:49:02','2026-01-19 12:49:02'),(7,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjY5NTIsImV4cCI6MTc2ODgzMDU1Mn0.MdXZqEpkhlJ9VjVy3UpR8x4ltG5dv-z898MJV3A8ILA','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNjk1MiwiZXhwIjoxNzY4ODMwNTUyfQ.DEDSBb_CtPD7SLF-JdTYhfJLZ1P8fKFDvm2-9IkAhhc','192.168.65.1','curl/8.7.1','2026-01-19 13:49:12','2026-01-19 12:49:12'),(8,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjY5NjMsImV4cCI6MTc2ODgzMDU2M30.9GZdw7RIaxEVnHipwvyQFyXsHzz8kZOCQ5KykMsCToM','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNjk2MywiZXhwIjoxNzY4ODMwNTYzfQ.80GbH_5KC1DNtdWZBjYv6LYHHacOTlB0_5SxPsUOnLU','192.168.65.1','curl/8.7.1','2026-01-19 13:49:23','2026-01-19 12:49:23'),(9,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjcwMzgsImV4cCI6MTc2ODgzMDYzOH0.dy0XhEPGljJXeJtdaeUeSRiuUljIUYa9-Cbnm4d2szI','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNzAzOCwiZXhwIjoxNzY4ODMwNjM4fQ.k73FVJyrdyYfYb0It6k_5cUgNZ7dazlK7brriLR5HcU','192.168.65.1','curl/8.7.1','2026-01-19 13:50:38','2026-01-19 12:50:38'),(10,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjcwODUsImV4cCI6MTc2ODgzMDY4NX0.zO4_gnoO9eYC3lcvt0bqqeZ3yvMWkpJrHO8Avm3jCeI','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNzA4NSwiZXhwIjoxNzY4ODMwNjg1fQ.ISliO_sFyldl5693D2aOme4eRCGDE67HYy_QoCxnjso','192.168.65.1','curl/8.7.1','2026-01-19 13:51:25','2026-01-19 12:51:25'),(11,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjcxMjQsImV4cCI6MTc2ODgzMDcyNH0.sE5T_3b43brYe8djalfVyIzwezLDtAS1x3hieWgT-nY','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNzEyNCwiZXhwIjoxNzY4ODMwNzI0fQ.sUPHpavufhmbS7sbrGMsR6kU8DR57QGJw4fKyb_W3IQ','192.168.65.1','curl/8.7.1','2026-01-19 13:52:04','2026-01-19 12:52:04'),(12,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjcxMzcsImV4cCI6MTc2ODgzMDczN30.Nw2a91UyXZhRzrjUdZZa3YihtmqLQGL4Dq3jvlKOK7k','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNzEzNywiZXhwIjoxNzY4ODMwNzM3fQ.BGyxJlcT4fLMbBFRkDzzbeNt20xMhZLL3Mjggd9sGlI','192.168.65.1','curl/8.7.1','2026-01-19 13:52:17','2026-01-19 12:52:17'),(13,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjczNjcsImV4cCI6MTc2ODgzMDk2N30.cY7t7do-pnDGe7i9CcfpT7fse78Awj8XGbUUH-hprhU','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyNzM2NywiZXhwIjoxNzY4ODMwOTY3fQ.O3u_Cfiu0PZbQryO_EAW7Genb6qndgVismnP2ZO9Dyc','192.168.65.1','curl/8.7.1','2026-01-19 13:56:07','2026-01-19 12:56:07'),(14,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4MjkzMjgsImV4cCI6MTc2ODgzMjkyOH0.o1ffOybboht5nInF-SWhMHuRmYWqEviz0QnJ-sjp_QE','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyOTMyOCwiZXhwIjoxNzY4ODMyOTI4fQ.5WCvpwEIPchkHEE9MO6O5E6Nksc-DedTWsf5hQycIxo','192.168.65.1','curl/8.7.1','2026-01-19 14:28:48','2026-01-19 13:28:48'),(15,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4Mjk0NzMsImV4cCI6MTc2ODgzMzA3M30.Lx2X8KD9kQO0niEFtLoon-VlRoJRjPGim27W-a4waTY','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODgyOTQ3MywiZXhwIjoxNzY4ODMzMDczfQ.-CwgbVMfJzZAsgCBiD8YCevPPdOyoPSE-zO4DvJDhf0','192.168.65.1','curl/8.7.1','2026-01-19 14:31:13','2026-01-19 13:31:13'),(16,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4NTg5ODUsImV4cCI6MTc2ODg2MjU4NX0.oS3URB3YiMK8V1awQZynYMJzY2t-volKqE0EHqx-HoQ','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODg1ODk4NSwiZXhwIjoxNzY4ODYyNTg1fQ.WPSTQwqZo41xhJuteDe0Wywj5jIMtEp-qIoboEb2Hh0','192.168.65.1','curl/8.7.1','2026-01-19 22:43:05','2026-01-19 21:43:05'),(17,1,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGRhbGlsYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njg4NTkyMDIsImV4cCI6MTc2ODg2MjgwMn0.ExEwP6tr-sHQEdVYSWrrGhnfVRmQaxgzpsZtHJYNHZo','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2ODg1OTIwMiwiZXhwIjoxNzY4ODYyODAyfQ.wQFt6SDObVRboehSQxxSZQjmiZmRYdEuVPIMvupRV5A','192.168.65.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-19 22:46:42','2026-01-19 21:46:42');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `videos`
--

DROP TABLE IF EXISTS `videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `videos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `property_id` int(10) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `video_url` varchar(500) NOT NULL COMMENT 'URL to video file or YouTube/Vimeo embed',
  `video_type` enum('upload','youtube','vimeo') DEFAULT 'upload',
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL COMMENT 'Duration in seconds',
  `display_order` int(11) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_property_id` (`property_id`),
  KEY `idx_display_order` (`display_order`),
  CONSTRAINT `videos_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `videos`
--

LOCK TABLES `videos` WRITE;
/*!40000 ALTER TABLE `videos` DISABLE KEYS */;
INSERT INTO `videos` VALUES (1,1,'Luxury Villa Tour','Complete walkthrough of the stunning waterfront villa','https://player.vimeo.com/video/1042515673','vimeo','/uploads/videos/thumbnails/villa-tour.jpg',NULL,1,1,'2026-01-19 11:24:56','2026-01-19 11:24:56'),(2,2,'Downtown Condo Showcase','Modern living in the heart of Miami','https://player.vimeo.com/video/1042515674','vimeo','/uploads/videos/thumbnails/condo-tour.jpg',NULL,2,1,'2026-01-19 11:24:56','2026-01-19 11:24:56'),(3,3,'Family Home Experience','Discover this perfect family property','https://player.vimeo.com/video/1042515675','vimeo','/uploads/videos/thumbnails/home-tour.jpg',NULL,3,1,'2026-01-19 11:24:56','2026-01-19 11:24:56');
/*!40000 ALTER TABLE `videos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-19 22:00:53

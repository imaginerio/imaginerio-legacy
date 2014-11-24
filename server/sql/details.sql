/*
 Navicat Premium Data Transfer

 Source Server         : Rio [EC2]
 Source Server Type    : PostgreSQL
 Source Server Version : 90209
 Source Host           : rio-server.axismaps.com
 Source Database       : rio
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 90209
 File Encoding         : utf-8

 Date: 10/28/2014 10:41:14 AM
*/

-- ----------------------------
--  Table structure for details
-- ----------------------------
DROP TABLE IF EXISTS "public"."details";
CREATE TABLE "public"."details" (
	"creator" varchar(150) COLLATE "default",
	"firstowner" varchar(50) COLLATE "default",
	"owner" varchar(255) COLLATE "default",
	"occupant" varchar(150) COLLATE "default",
	"routename" varchar(50) COLLATE "default",
	"nameabbrev" varchar(50) COLLATE "default",
	"globalid" varchar(50) COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."details" OWNER TO "pg_power_user";


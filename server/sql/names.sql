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

 Date: 10/28/2014 10:41:29 AM
*/

-- ----------------------------
--  Table structure for names
-- ----------------------------
DROP TABLE IF EXISTS "public"."names";
CREATE TABLE "public"."names" (
	"layer" varchar(50) NOT NULL COLLATE "default",
	"name_en" varchar(255) COLLATE "default",
	"name_pr" varchar(255) COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."names" OWNER TO "pg_power_user";

-- ----------------------------
--  Primary key structure for table names
-- ----------------------------
ALTER TABLE "public"."names" ADD PRIMARY KEY ("layer") NOT DEFERRABLE INITIALLY IMMEDIATE;


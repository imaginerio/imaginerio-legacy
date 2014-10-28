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

 Date: 10/28/2014 11:10:31 AM
*/

-- ----------------------------
--  Table structure for uploads
-- ----------------------------
DROP TABLE IF EXISTS "public"."uploads";
CREATE TABLE "public"."uploads" (
	"uploaddate" int4 NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."uploads" OWNER TO "pg_power_user";

-- ----------------------------
--  Primary key structure for table uploads
-- ----------------------------
ALTER TABLE "public"."uploads" ADD PRIMARY KEY ("uploaddate") NOT DEFERRABLE INITIALLY IMMEDIATE;


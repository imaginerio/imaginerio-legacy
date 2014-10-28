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

 Date: 10/28/2014 10:41:00 AM
*/

-- ----------------------------
--  Table structure for cache
-- ----------------------------
DROP TABLE IF EXISTS "public"."cache";
CREATE TABLE "public"."cache" (
	"id" int4 NOT NULL DEFAULT nextval('cache_id_seq'::regclass),
	"year" int2,
	"layer" varchar(255) COLLATE "default",
	"z" int2,
	"x" int4,
	"y" int4
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cache" OWNER TO "pg_power_user";

-- ----------------------------
--  Primary key structure for table cache
-- ----------------------------
ALTER TABLE "public"."cache" ADD PRIMARY KEY ("id") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Indexes structure for table cache
-- ----------------------------
CREATE UNIQUE INDEX  "png" ON "public"."cache" USING btree("year" ASC NULLS LAST, layer COLLATE "default" ASC NULLS LAST, z ASC NULLS LAST, x ASC NULLS LAST, y ASC NULLS LAST);


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

 Date: 01/29/2015 10:41:53 AM
*/

-- ----------------------------
--  Table structure for visualpoly
-- ----------------------------
DROP TABLE IF EXISTS "public"."visualpoly";
CREATE TABLE "public"."visualpoly" (
	"gid" int4 NOT NULL DEFAULT nextval('visualpoly_gid_seq1'::regclass),
	"folder" varchar(50) COLLATE "default",
	"layer" varchar(50) COLLATE "default",
	"globalid" varchar(50) NOT NULL COLLATE "default",
	"geodatabas" varchar(50) COLLATE "default",
	"featuretyp" varchar(50) COLLATE "default",
	"creator" varchar(100) COLLATE "default",
	"repository" varchar(100) COLLATE "default",
	"firstdispl" int2,
	"lastdispla" int2,
	"imageviewd" varchar(200) COLLATE "default",
	"imageid" varchar(50) COLLATE "default",
	"geom" "public"."geometry",
	"uploaddate" int4,
	"latitude" float8,
	"longitude" float8
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."visualpoly" OWNER TO "pg_power_user";

-- ----------------------------
--  Primary key structure for table visualpoly
-- ----------------------------
ALTER TABLE "public"."visualpoly" ADD PRIMARY KEY ("gid", "globalid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Indexes structure for table visualpoly
-- ----------------------------
CREATE INDEX  "visualpoly_geom_gist" ON "public"."visualpoly" USING gist(geom);
CREATE INDEX  "visualpoly_gist" ON "public"."visualpoly" USING gist(geom);


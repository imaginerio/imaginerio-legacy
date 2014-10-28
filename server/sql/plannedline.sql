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

 Date: 10/28/2014 10:41:36 AM
*/

-- ----------------------------
--  Table structure for plannedline
-- ----------------------------
DROP TABLE IF EXISTS "public"."plannedline";
CREATE TABLE "public"."plannedline" (
	"gid" int4 NOT NULL DEFAULT nextval('plannedline_gid_seq'::regclass),
	"featuretyp" varchar(254) COLLATE "default",
	"planyear" varchar(50) COLLATE "default",
	"planname" varchar(50) COLLATE "default",
	"nameshort" varchar(50) COLLATE "default",
	"namecomple" varchar(50) COLLATE "default",
	"folder" varchar(50) COLLATE "default",
	"geodatabas" varchar(50) COLLATE "default",
	"layer" varchar(50) COLLATE "default",
	"globalidco" varchar(50) COLLATE "default",
	"geom" "public"."geometry"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."plannedline" OWNER TO "pg_power_user";

-- ----------------------------
--  Primary key structure for table plannedline
-- ----------------------------
ALTER TABLE "public"."plannedline" ADD PRIMARY KEY ("gid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Indexes structure for table plannedline
-- ----------------------------
CREATE INDEX  "plannedline_geom_gist" ON "public"."plannedline" USING gist(geom);
CREATE INDEX  "plannedline_gist" ON "public"."plannedline" USING gist(geom);


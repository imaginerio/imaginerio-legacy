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

 Date: 10/28/2014 10:41:43 AM
*/

-- ----------------------------
--  Table structure for plannedpoly
-- ----------------------------
DROP TABLE IF EXISTS "public"."plannedpoly";
CREATE TABLE "public"."plannedpoly" (
	"gid" int4 NOT NULL DEFAULT nextval('plannedpoly_gid_seq'::regclass),
	"planyear" varchar(50) COLLATE "default",
	"planname" varchar(50) COLLATE "default",
	"featuretyp" varchar(50) COLLATE "default",
	"folder" varchar(50) COLLATE "default",
	"geodatabas" varchar(50) COLLATE "default",
	"layer" varchar(50) COLLATE "default",
	"namecomple" varchar(50) COLLATE "default",
	"nameshort" varchar(50) COLLATE "default",
	"globalidco" varchar(50) COLLATE "default",
	"geom" "public"."geometry"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."plannedpoly" OWNER TO "pg_power_user";

-- ----------------------------
--  Primary key structure for table plannedpoly
-- ----------------------------
ALTER TABLE "public"."plannedpoly" ADD PRIMARY KEY ("gid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Indexes structure for table plannedpoly
-- ----------------------------
CREATE INDEX  "plannedpoly_geom_gist" ON "public"."plannedpoly" USING gist(geom);
CREATE INDEX  "plannedpoly_gist" ON "public"."plannedpoly" USING gist(geom);


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

 Date: 10/28/2014 11:08:11 AM
*/

-- ----------------------------
--  Table structure for basepoly
-- ----------------------------
DROP TABLE IF EXISTS "public"."basepoly";
CREATE TABLE "public"."basepoly" (
	"gid" int4 NOT NULL DEFAULT nextval('basepoly_gid_seq'::regclass),
	"featuretyp" varchar(50) COLLATE "default",
	"namecomple" varchar(100) COLLATE "default",
	"nameshort" varchar(100) COLLATE "default",
	"yearfirstd" int2,
	"yearlastdo" int2,
	"firstdispl" int2,
	"lastdispla" int2,
	"source" varchar(50) COLLATE "default",
	"folder" varchar(50) COLLATE "default",
	"geodatabas" varchar(50) COLLATE "default",
	"layer" varchar(50) COLLATE "default",
	"tablename" varchar(50) COLLATE "default",
	"globalidco" varchar(50) NOT NULL COLLATE "default",
	"geom" "public"."geometry",
	"uploaddate" int4,
	"notes" varchar(255) COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."basepoly" OWNER TO "pg_power_user";

-- ----------------------------
--  Primary key structure for table basepoly
-- ----------------------------
ALTER TABLE "public"."basepoly" ADD PRIMARY KEY ("gid", "globalidco") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Indexes structure for table basepoly
-- ----------------------------
CREATE INDEX  "basepoly_geom_gist" ON "public"."basepoly" USING gist(geom);
CREATE INDEX  "basepoly_gist" ON "public"."basepoly" USING gist(geom);
CREATE INDEX  "basepoly_layer" ON "public"."basepoly" USING btree(layer COLLATE "default" ASC NULLS LAST, firstdispl ASC NULLS LAST, lastdispla ASC NULLS LAST);


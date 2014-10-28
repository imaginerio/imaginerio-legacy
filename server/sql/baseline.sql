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

 Date: 10/28/2014 10:40:21 AM
*/

-- ----------------------------
--  Table structure for baseline
-- ----------------------------
DROP TABLE IF EXISTS "public"."baseline";
CREATE TABLE "public"."baseline" (
	"gid" int4 NOT NULL DEFAULT nextval('baseline_gid_seq'::regclass),
	"namecomple" varchar(50) COLLATE "default",
	"featuretyp" varchar(50) COLLATE "default",
	"nameshort" varchar(50) COLLATE "default",
	"yearfirstd" int2,
	"yearlastdo" int2,
	"firstdispl" int2,
	"lastdispla" int2,
	"source" varchar(50) COLLATE "default",
	"folder" varchar(50) COLLATE "default",
	"geodatabas" varchar(50) COLLATE "default",
	"layer" varchar(50) COLLATE "default",
	"tablename" varchar(50) COLLATE "default",
	"globalidco" varchar(50) COLLATE "default",
	"geom" "public"."geometry"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."baseline" OWNER TO "pg_power_user";

-- ----------------------------
--  Indexes structure for table baseline
-- ----------------------------
CREATE INDEX  "baseline_gist" ON "public"."baseline" USING gist(geom);
CREATE INDEX  "baseline_layer" ON "public"."baseline" USING btree(layer COLLATE "default" ASC NULLS LAST, firstdispl ASC NULLS LAST, lastdispla ASC NULLS LAST);


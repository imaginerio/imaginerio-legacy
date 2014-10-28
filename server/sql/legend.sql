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

 Date: 10/28/2014 10:41:23 AM
*/

-- ----------------------------
--  Table structure for legend
-- ----------------------------
DROP TABLE IF EXISTS "public"."legend";
CREATE TABLE "public"."legend" (
	"folder" varchar(255) COLLATE "default",
	"geodatabas" varchar(255) COLLATE "default",
	"layer" varchar(255) COLLATE "default",
	"featuretyp" varchar(255) COLLATE "default",
	"fill" varchar(255) COLLATE "default",
	"stroke" varchar(255) COLLATE "default",
	"shape" varchar(255) COLLATE "default",
	"id" varchar(255) COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."legend" OWNER TO "pg_power_user";


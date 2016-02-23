/* Color Definitions */

/* POLYGONS */
@openwater: #b9cee0;
@marsh: #a5d4cd;
@land: #e7ded6;
@land_outline: #a2aabc;
@lotslanduse: #edcfae;
@neighborhoods_inline: #977c53;
@neighborhoods_outline: #fff;
@cityblocks: #fff;
@greenspace:#ccd2aa;
@urbanspace: #fcf9d5;
@buildings: #cfa893;
@beach: #ffd270;

/* LINES */
@roads: #fff;

/* LABELS */
@roads_labels_dark: #574c3b;
@roads_labels_light: #7b6e5a;

Map {
  background-color: @openwater;
  buffer-size: 100;
}

#hillshade_2013{
  raster-opacity: 0.5;
  comp-op: overlay;
}

#mask {
  polygon-fill: #b4b4b4;
  opacity: 0.5;
  comp-op: overlay;
}
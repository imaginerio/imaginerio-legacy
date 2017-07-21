/* imagineRio Cone Collector */

/* -------------------------*/
/* Config Vars */
/* -------------------------*/

let maxAngleAllowed = 170;

/* -------------------------*/
/* Vars and Intialization */
/* -------------------------*/

let maxBounds = [[-23.10243406, -44.04944719], [-22.63003187, -42.65988214]];
let tileserver = 'http://imaginerio.axismaps.io:3001/tiles/';
let year;
let maxYear = 2017;
let tiles = {};
let shown = {};

/* General Map */
let map = L.map('map', {
  center: [-22.9046, -43.1919],
  zoom: 15,
  minZoom: 13,
  maxZoom: 18,
  doubleClickZoom: false,
  zoomControl: false,
  maxBounds: maxBounds
});

let base = L.tileLayer(tileserver + year + '/base/{z}/{x}/{y}.png').addTo(map);

/* Slider */
let pipValues = _.range(1500, 2025, 25);
pipValues.push(maxYear);

let slider = noUiSlider.create($('.slider')[0], {
  start: [1500],
  connect: false,
  step: 1,
  range: {
    min: [1500],
    max: [2017]
  },
  pips: {
    mode: 'values',
    filter: (val) => {
      if (val === maxYear) return 1;
      else if (val % 50) {
        if (val % 25) return 0;
        else return 2;
      } else return 1;
    },
    values: pipValues,
    density: 2
  },
  tooltips: true,
  format: {
    to: (value) => value,
    from: (value) => parseInt(value)
  }
});

slider.on('set', (y) => {
  updateYear(y[0]);
});

/* Leaflet Draw */
let editableLayer = new L.FeatureGroup();
let nonEditableLayer = new L.FeatureGroup();
map.addLayer(editableLayer);
map.addLayer(nonEditableLayer);

var drawControl = new L.Control.Draw({
  draw: false,
  edit: {
    edit: false,
    featureGroup: editableLayer,
    remove: false
  }
});
map.addControl(drawControl);

/* Sidebar */
document.querySelector('.sidebar--cancel').addEventListener('click', function (e) {
  e.preventDefault();

  // Clear cones
  editableLayer.clearLayers();
  nonEditableLayer.clearLayers();
  tooling = null;
  editing.disable();
  editing = null;
  newCone();

  // Clear form
  document.querySelectorAll('.sidebar--input, .sidebar--textarea').forEach(function (input) {
    input.value = '';
  });
});

/* -------------------------*/
/* Functions */
/* -------------------------*/

/* General Functions */
function updateYear(y) {
  if (year == y) return false;
  year = y;

  loadBase();
  loadTiles();
}

function mapLoading(show) {
  if (show && $('.loading').length == 0) {
    $('.map').append(
     $(document.createElement('div')).addClass('loading')
    );

    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
  } else if (show === false) {
    $('.loading').remove();
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
  }
}

/* Tile functions */

function loadBase() {
  if (map.hasLayer(base)) map.removeLayer(base);

  if (year == maxYear) {
    base = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);
  } else {
    base = L.tileLayer(tileserver + year + '/base/{z}/{x}/{y}.png').addTo(map);
  }
}

function loadTiles() {
  mapLoading(true);
  if (tiles[year]) {
    map.addLayer(tiles[year].setOpacity(0));
  } else {
    var t = L.tileLayer(tileserver  + year + '/all/{z}/{x}/{y}.png')
       .addTo(map)
       .setOpacity(0)
       .on('load', function () {
        showTiles(this);
      });

    tiles[year] = t;
  }
}

function showTiles(tile) {
  if (!_.isEqual(shown.tiles, tile)) {
    if (shown.tiles) map.removeLayer(tileFadeOut(shown.tiles));
    shown.tiles = tileFadeIn(tile);
  }
}

function tileFadeOut(tileOut) {
  var i = 1;
  var timer = setInterval(function () {
    i -= 0.1;
    if (i <= 0) clearInterval(timer);
    tileOut.setOpacity(Math.max(0, i));
  }, 50);

  return tileOut;
}

function tileFadeIn(tileIn) {
  var i = 0;
  var timer = setInterval(function () {
    i += 0.1;
    if (i >= 1) {
      clearInterval(timer);
      mapLoading(false);
    }

    tileIn.setOpacity(Math.min(1, i));
  }, 50);

  return tileIn;
}

/* Leaflet Draw Functions */
let tooling;
let genericIcon = L.divIcon({ className: 'cone-guidepoint', iconSize: 10 });
let majorPoints = [];
let controlPoint;
let line1;
let line2;
let finalCone;

function newCone() {
  let firstPoinIcon = L.divIcon({ className: 'cone-point', iconSize: 10 });
  tooling = new L.Draw.Marker(map, { icon: firstPoinIcon });
  tooling.enable();

  map.on('draw:created', firstPointCreated);
}

function firstPointCreated(e) {
  // Add point
  editableLayer.addLayer(e.layer);
  majorPoints[0] = e.layer.getLatLng();
  e.layer.dependentLayers = ['line1', 'line2', 'finalCone']; // for easier access during editing stage
  e.layer.pointIndex = 0;
  tooling.disable();

  // Turn off old events
  map.off('draw:created');

  // Start new point
  tooling = new L.Draw.Marker(map, { icon: genericIcon });
  tooling.enable();

  // Draw line between points
  line1 = L.polyline([], { className: 'cone-guideline' }).addTo(nonEditableLayer);

  // New events
  map.on('mousemove', (e) => updateLine(line1, e.latlng));
  map.on('draw:created', secondPointCreated);
}

function secondPointCreated(e) {
  // Add point
  editableLayer.addLayer(e.layer);
  majorPoints[1] = e.layer.getLatLng();
  e.layer.dependentLayers = ['line1', 'finalCone']; // for easier access during editing stage
  e.layer.pointIndex = 1;
  tooling.disable();

  // Turn off old events
  map.off('draw:created');
  map.off('mousemove');

  // Start new point
  tooling = new L.Draw.Marker(map, { icon: genericIcon });
  tooling.enable();

  // Draw line between points
  line2 = L.polyline([], { className: 'cone-guideline' }).addTo(nonEditableLayer);

  // New events
  map.on('mousemove', (e) => updateLine(line2, e.latlng));
  map.on('draw:created', thirdPointCreated);
}

function thirdPointCreated(e) {
  // Add point
  editableLayer.addLayer(e.layer);
  majorPoints[2] = e.layer.getLatLng();
  e.layer.dependentLayers = ['line2', 'finalCone']; // for easier access during editing stage
  e.layer.pointIndex = 2;
  tooling.disable();

  // Turn off old events
  map.off('draw:created');
  map.off('mousemove');

  // Start new point
  tooling = new L.Draw.Marker(map, { icon: genericIcon });
  tooling.enable();

  // Control point is for determining drawable area
  setControlPoint();

  let halfwayPoint = L.latLng((majorPoints[1].lat - majorPoints[2].lat) / 2 + majorPoints[2].lat, (majorPoints[1].lng - majorPoints[2].lng) / 2 + majorPoints[2].lng);

  // Draw polygon between points
  let points = [[majorPoints[0].lat, majorPoints[0].lng]].concat(generateCurvePoints([majorPoints[1], halfwayPoint, majorPoints[2]]));
  finalCone = L.polygon(points, { className: 'cone-guidepolygon' }).addTo(nonEditableLayer);

  // New events
  map.on('mousemove', (e) => updatePolygon(e.latlng));
  map.on('draw:created', fourthPointCreated);
}

function fourthPointCreated(e) {
  // Add point
  editableLayer.addLayer(e.layer);
  majorPoints[3] = e.layer.getLatLng();
  e.layer.dependentLayers = ['finalCone']; // for easier access during editing stage
  e.layer.pointIndex = 3;
  tooling.disable();

  // Turn off old events
  map.off('draw:created');
  map.off('mousemove');

  // Start editing
  editing = new L.EditToolbar.Edit(map, { featureGroup: editableLayer });
  editing.enable();

  editableLayer.eachLayer(function (layer) {
    layer.on('drag', function (e) {
      let dependentLayers = e.target.dependentLayers;

      // update point location
      majorPoints[e.target.pointIndex] = e.target.getLatLng();

      // update any lines affected
      let newLinePoint = e.target.pointIndex ? e.target.getLatLng() : null;
      if (dependentLayers.indexOf('line1') >= 0) updateLine(line1, newLinePoint);
      if (dependentLayers.indexOf('line2') >= 0) updateLine(line2, newLinePoint);

      // update the cone polygon
      if (dependentLayers.indexOf('finalCone') >= 0) {
        setControlPoint();
        updatePolygon(majorPoints[3]);
      }
    });
  });
}

let lastKnownLocation;
function updateLine(line, newMidPoint) {
  if (!newMidPoint) newMidPoint = line.getLatLngs()[1]; // if no newMidPoint, then updated point was majorPoints[0]

  let c = getMapEdgePoint(map.latLngToLayerPoint(majorPoints[0]), map.latLngToLayerPoint(newMidPoint));
  let previousLineLatLngs = line.getLatLngs();
  line.setLatLngs([majorPoints[0], newMidPoint, map.layerPointToLatLng(c)]);

  // Don't allow the line to extend beyond a given angle
  if (line1 && line2 && getAngle(line1, line2) > maxAngleAllowed) {
    line.setLatLngs(previousLineLatLngs);

    // console.log(tooling);
    // console.log(editing);
    if (editing) console.log('TODO - editing');
    else if (tooling) tooling._marker.setLatLng(lastKnownLocation);
  } else {
    lastKnownLocation = newMidPoint;
  }
}

function setControlPoint() {
  let option1 = L.latLng(majorPoints[1].lat, majorPoints[2].lng);
  let option2 = L.latLng(majorPoints[2].lat, majorPoints[1].lng);
  let line1LLs = line1.getLatLngs();
  let line2LLs = line2.getLatLngs();
  let line3LLs = [line1LLs[1], line2LLs[1]]; // new line between both line points

  if (isLeft(line3LLs[0], line3LLs[1], majorPoints[0]) === isLeft(line3LLs[0], line3LLs[1], option1)) {
    controlPoint = option2;
  } else {
    controlPoint = option1;
  }

  controlPoint.leftOfLine1 = isLeft(line1LLs[0], line1LLs[line1LLs.length - 1], controlPoint);
  controlPoint.leftOfLine2 = isLeft(line2LLs[0], line2LLs[line2LLs.length - 1], controlPoint);
  controlPoint.leftOfLine3 = isLeft(line3LLs[0], line3LLs[1], controlPoint);
}

function updatePolygon(curvePoint) {
  let halfwayPoint = L.latLng((majorPoints[1].lat - majorPoints[2].lat) / 2 + majorPoints[2].lat, (majorPoints[1].lng - majorPoints[2].lng) / 2 + majorPoints[2].lng);
  let pointToUse = halfwayPoint;
  let error = true;
  let line1LLs = line1.getLatLngs();
  let line2LLs = line2.getLatLngs();
  let line3LLs = [line1LLs[1], line2LLs[1]]; // new line between both line points

  if (isLeft(line1LLs[0], line1LLs[line1LLs.length - 1], curvePoint) === controlPoint.leftOfLine1 &&
    isLeft(line2LLs[0], line2LLs[line2LLs.length - 1], curvePoint) === controlPoint.leftOfLine2 &&
    isLeft(line3LLs[0], line3LLs[1], curvePoint) === controlPoint.leftOfLine3
  ) {
    pointToUse = curvePoint;
    error = false;
  }

  let newPoints = [[majorPoints[0].lat, majorPoints[0].lng]].concat(generateCurvePoints([majorPoints[1], pointToUse, majorPoints[2]]));
  finalCone.setLatLngs(newPoints);
  finalCone._path.classList.toggle('cone--error', error);
}

function getMapEdgePoint(a, b) {
  let length = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  let c = {};
  c.x = b.x + (b.x - a.x) / length * window.outerWidth;
  c.y = b.y + (b.y - a.y) / length * window.outerWidth;
  return c;
}

function getAngle(l1, l2) {
  let l1Points = l1.getLatLngs().map((ll) => map.latLngToLayerPoint(ll));
  let l2Points = l2.getLatLngs().map((ll) => map.latLngToLayerPoint(ll));
  let angle1 = Math.atan2(l1Points[0].y - l1Points[1].y, l1Points[0].x - l1Points[1].x);
  let angle2 = Math.atan2(l2Points[0].y - l2Points[1].y, l2Points[0].x - l2Points[1].x);

  let returnAngle = Math.round(Math.abs(angle1 - angle2) * 180 / Math.PI);
  return returnAngle > 180 ? 360 - returnAngle : returnAngle;
}

function isLeft(a, b, c) {
  return ((b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng)) > 0;
}

function generateCurvePoints(ptsArray) {
  let tension = 0.75;
  let numOfSegments = 32;

  let _pts;
  let result = [];
  let pl = ptsArray.length;

  // clone array so we don't change the original content
  _pts = _.flatten(ptsArray.map((pt) => [pt.lng, pt.lat]));

  // copy first point and insert at beginning
  _pts.unshift(ptsArray[0].lat);
  _pts.unshift(ptsArray[0].lng);

  // copy last point and append
  _pts.push(ptsArray[pl - 1].lng, ptsArray[pl - 1].lat);

  // 1. loop goes through point array
  // 2. loop goes through each segment between the two points + one point before and after
  for (let i = 2; i < (_pts.length - 4); i += 2) {
    let p0 = _pts[i];
    let p1 = _pts[i + 1];
    let p2 = _pts[i + 2];
    let p3 = _pts[i + 3];

    // calc tension vectors
    let t1x = (p2 - _pts[i - 2]) * tension;
    let t2x = (_pts[i + 4] - p0) * tension;

    let t1y = (p3 - _pts[i - 1]) * tension;
    let t2y = (_pts[i + 5] - p1) * tension;

    for (let t = 0; t <= numOfSegments; t++) {
      // calc step
      let st = t / numOfSegments;

      let pow2 = Math.pow(st, 2);
      let pow3 = pow2 * st;
      let pow23 = pow2 * 3;
      let pow32 = pow3 * 2;

      // calc cardinals
      let c1 = pow32 - pow23 + 1;
      let c2 = pow23 - pow32;
      let c3 = pow3 - 2 * pow2 + st;
      let c4 = pow3 - pow2;

      // calc x and y cords with common control vectors
      let x = c1 * p0 + c2 * p2 + c3 * t1x + c4 * t2x;
      let y = c1 * p1 + c2 * p3 + c3 * t1y + c4 * t2y;

      // store points in array
      result.push([y, x]);
    }
  }

  return result;
}

/* -------------------------*/
/* Start */
/* -------------------------*/
slider.set(2000);
newCone();

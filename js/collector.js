/* imagineRio Cone Collector */

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
let coneLayer = new L.FeatureGroup();
map.addLayer(coneLayer);

var drawControl = new L.Control.Draw({
  draw: false,
  edit: {
    edit: false,
    featureGroup: coneLayer,
    remove: false
  }
});
map.addControl(drawControl);

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
let firstPoint;
let secondPoint;
let thirdPoint;
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
  coneLayer.addLayer(e.layer);
  firstPoint = e.layer.getLatLng();
  tooling.disable();

  // Turn off old events
  map.off('draw:created');

  // Start new point
  tooling = new L.Draw.Marker(map, { icon: genericIcon });
  tooling.enable();

  // Draw line between points
  line1 = L.polyline([], { className: 'cone-guideline' }).addTo(coneLayer);

  // New events
  map.on('mousemove', (e) => {
    let c = getMapEdgePoint(map.latLngToLayerPoint(firstPoint), e.layerPoint);
    line1.setLatLngs([firstPoint, e.latlng, map.layerPointToLatLng(c)]);
  });
  map.on('draw:created', secondPointCreated);
}

function secondPointCreated(e) {
  // Add point
  coneLayer.addLayer(e.layer);
  secondPoint = e.layer.getLatLng();
  tooling.disable();

  // Turn off old events
  map.off('draw:created');
  map.off('mousemove');

  // Start new point
  tooling = new L.Draw.Marker(map, { icon: genericIcon });
  tooling.enable();

  // Draw line between points
  line2 = L.polyline([], { className: 'cone-guideline' }).addTo(coneLayer);

  // New events
  map.on('mousemove', (e) => {
    let c = getMapEdgePoint(map.latLngToLayerPoint(firstPoint), e.layerPoint);
    line2.setLatLngs([firstPoint, e.latlng, map.layerPointToLatLng(c)]);
  });

  map.on('draw:created', thirdPointCreated);
}

function thirdPointCreated(e) {
  // Add point
  coneLayer.addLayer(e.layer);
  thirdPoint = e.layer.getLatLng();
  tooling.disable();

  // Turn off old events
  map.off('draw:created');
  map.off('mousemove');

  // Start new point
  tooling = new L.Draw.Marker(map, { icon: genericIcon });
  tooling.enable();

  // Draw polygon between points
  finalCone = L.curve([], { className: 'cone-guidepolygon' }).addTo(coneLayer);

  // New events
  map.on('mousemove', (e) => {
    finalCone.setPath([
      'M', [firstPoint.lat, firstPoint.lng],
      'L', [secondPoint.lat, secondPoint.lng],
      'Q', [e.latlng.lat, e.latlng.lng],
      [thirdPoint.lat, thirdPoint.lng],
      'Z'
    ]);
  });

  map.on('draw:created', fourthPointCreated);
}

function fourthPointCreated(e) {
  // Add point
  coneLayer.addLayer(e.layer);
  tooling.disable();

  // Turn off old events
  map.off('draw:created');
  map.off('mousemove');

  // Remove all guide points/line (leaves polygon and cone focal point)
  coneLayer.eachLayer(function (l) {
    if (l.options.className && l.options.className === 'cone-guideline') l.remove();
    else if (l.options.icon && l.options.icon.options.className && l.options.icon.options.className === 'cone-guidepoint') l.remove();
  });
}

function getMapEdgePoint(a, b) {
  let length = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  let c = {};
  c.x = b.x + (b.x - a.x) / length * window.outerWidth;
  c.y = b.y + (b.y - a.y) / length * window.outerWidth;
  return c;
}

/* -------------------------*/
/* Start */
/* -------------------------*/
slider.set(2000);
newCone();

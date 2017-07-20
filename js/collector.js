/* imagineRio Cone Collector */

let maxBounds = [[-23.10243406, -44.04944719], [-22.63003187, -42.65988214]];
let tileserver = 'http://imaginerio.axismaps.io:3001/tiles/';
let year;
let maxYear = 2017;
let tiles = {};
let shown = {};

let pipValues = _.range(1500, 2025, 25);
pipValues.push(maxYear);

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

/* INIT HERE */
slider.set(2000);

/* General functions */
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

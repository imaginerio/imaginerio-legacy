var express = require('express'),
    fs = require( 'graceful-fs' ),
    images = require( 'images' ),
    mapnik = require('mapnik'),
    uuid = require('uuid');

var app = express();

app.use( function( req, res, next ){
  res.setHeader( 'Access-Control-Allow-Origin', '*' );
  next();
});

app.use( function(err, req, res, next) {
  console.error(err.stack);
  next(err);
});

app.use( function(err, req, res, next) {
  if (req.xhr) {
    res.send( 500, { error: 'Something blew up!' } );
  } else {
    next(err);
  }
});

app.use( function(err, req, res, next) {
  res.status( 500 );
  res.render( 'error', { error: err } );
});


mapnik.register_default_fonts();
mapnik.register_default_input_plugins();

app.get('/export/:lang/:year/:layer/:raster/:bounds/', function( req, res ){
  var id = uuid.v1();
  drawBase( req, res, id, drawLayers );
});

function drawBase( req, res, id, callback ){
  var map = new mapnik.Map( 1024, 768 );
  map.load( __dirname + "/cache/xml/" + req.params.year + "/base.xml", function( err, map ){
    if( err ) throw err;
    var bounds = req.params.bounds.split( ',' );
    var merc = geo_mercator( bounds[ 0 ], bounds[ 1 ] ).concat( geo_mercator( bounds[ 2 ], bounds[ 3 ] ) );
    map.extent = merc;
    var im = new mapnik.Image( 1024, 768 );
    map.render( im, function( err, im ){
      if( err ) throw err;
      im.encode( 'png', function( err, buffer ){
        if( err ) throw err;
        fs.writeFile( 'base' + id + '.png', buffer, function( err ){
          if( err ) throw err;
          console.log( 'Saved base image to base' + id + '.png');
          callback( req, res, id, drawRaster );
        });
      });
    });
  });
}

function drawLayers( req, res, id, callback ){
  var map = new mapnik.Map( 1024, 768 );
  map.load( __dirname + "/cache/xml/" + req.params.year + "/" + req.params.layer + ".xml", function( err, map ){
    if( err ) throw err;
    var bounds = req.params.bounds.split( ',' );
    var merc = geo_mercator( bounds[ 0 ], bounds[ 1 ] ).concat( geo_mercator( bounds[ 2 ], bounds[ 3 ] ) );
    map.extent = merc;
    var im = new mapnik.Image( 1024, 768 );
    map.render( im, function( err, im ){
      if( err ) throw err;
      im.encode( 'png', function( err, buffer ){
        if( err ) throw err;
        fs.writeFile( 'layers' + id + '.png', buffer, function( err ){
          if( err ) throw err;
          console.log( 'Saved base image to layers' + id + '.png');
          callback( req, res, id, combineImage );
        });
      });
    });
  });
}

function drawRaster( req, res, id, callback ){
  if( req.params.raster == 'null' ){
    callback( req, res, id );
  }
}

function combineImage( req, res, id ){
  images( 1024, 768 )
    .draw( images( 'base' + id + '.png' ), 0, 0 )
    .draw( images( 'layers' + id + '.png' ), 0, 0 )
    .draw( images( 'images/legend_' + req.params.lang + '.png' ), 0, 0 )
    .save( 'map' + id + '.png' );
}

function geo_mercator( lon_deg, lat_deg ){
  lon_rad = ( lon_deg / 180.0 * Math.PI );
  lat_rad = ( lat_deg / 180.0 * Math.PI );
  sm_a = 6378137;
  x = sm_a * lon_rad;
  y = sm_a * Math.log( ( Math.sin( lat_rad ) + 1 ) / Math.cos( lat_rad ) );
  return [ x, y ];
}

app.listen( 4001 );
console.log( 'Listening on port: ' + 4001 );

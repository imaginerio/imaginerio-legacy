var express = require('express'),
    fs = require( 'graceful-fs' ),
    mapnik = require('mapnik');

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

app.get('/export/:year/:layer/:raster/:bounds/', function( req, res ){
  
})

function drawBase( req, res, callback ){
  
}

function drawLayers( req, res, callback ){
  
}

function drawRaster( req, res, callback ){
  
}

function combineImage( req, res, callback ){
  
}

app.listen( 4001 );
console.log( 'Listening on port: ' + 4001 );

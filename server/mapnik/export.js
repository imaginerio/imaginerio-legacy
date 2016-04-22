var Canvas = require( 'canvas' ),
    express = require('express'),
    fs = require( 'fs' ),
    //images = require( 'images' ),
    mapnik = require('mapnik'),
    uuid = require('uuid');

var app = express();

var dimensions = { x : 1024, y : 768 },
    titleHeight = 50;

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

app.get('/export/:lang/:year/:layer/:raster/:bounds/', function( req, res ){
  mapnik.register_default_fonts();
  mapnik.register_system_fonts()
  mapnik.register_default_input_plugins();
  
  var id = uuid.v1();
  drawBase( req, res, id, drawLayers );
});

function drawBase( req, res, id, callback ){
  var map = new mapnik.Map( dimensions.x, dimensions.y );
  map.load( __dirname + "/cache/xml/" + req.params.year + "/base.xml", function( err, map ){
    if( err ) throw err;
    var bounds = req.params.bounds.split( ',' );
    var merc = geo_mercator( bounds[ 0 ], bounds[ 1 ] ).concat( geo_mercator( bounds[ 2 ], bounds[ 3 ] ) );
    map.extent = merc;
    var im = new mapnik.Image( dimensions.x, dimensions.y );
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
  var map = new mapnik.Map( dimensions.x, dimensions.y );
  map.load( __dirname + "/cache/xml/" + req.params.year + "/" + req.params.layer + ".xml", function( err, map ){
    if( err ) throw err;
    var bounds = req.params.bounds.split( ',' );
    var merc = geo_mercator( bounds[ 0 ], bounds[ 1 ] ).concat( geo_mercator( bounds[ 2 ], bounds[ 3 ] ) );
    map.extent = merc;
    var im = new mapnik.Image( dimensions.x, dimensions.y );
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
  var Image = Canvas.Image,
      canvas = new Canvas( dimensions.x, dimensions.y ),
      context = canvas.getContext( '2d' );
    
  fs.readFile( 'base' + id + '.png', function( err, base ){
    if (err) throw err;
    img = new Image;
    img.src = base;
    context.drawImage( img, 0, 0, dimensions.x, dimensions.y );
    
    fs.readFile( 'layers' + id + '.png', function( err, layers ){
      if (err) throw err;
      img = new Image;
      img.src = layers;
      context.drawImage( img, 0, 0, dimensions.x, dimensions.y );
      
      fs.readFile( 'images/legend_' + req.params.lang + '.png', function( err, legend ){
        if (err) throw err;
        img = new Image;
        img.src = legend;
        context.drawImage( img, 0, titleHeight, 235, 768 );
    
        context.fillStyle = 'rgba( 230, 230, 230, 0.8 )';
        context.fillRect( 0, 0, dimensions.x, titleHeight );
        context.fillStyle = '#666';
        context.fillRect( 0, titleHeight - 1, dimensions.x, 1 );
        context.font = '100 30px Raleway';
        context.fillText( req.params.lang == 'en' ? 'imagineRio' : 'imagináRio', 20, 35 );
		
        context.font = 'bold 20px Raleway';
        context.fillText( req.params.year, dimensions.x - 100, 35 );
        
        res.set({
          'Content-type': 'image/png',
          'Content-Disposition': 'attachment; filename=rio-' + req.params.year + '.png'
        })
        res.send( new Buffer( canvas.toDataURL().substr( 22 ), 'base64' ) );
      });
    });
  });
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

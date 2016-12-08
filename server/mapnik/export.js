var Canvas = require( 'canvas' ),
    fs = require( 'fs' ),
    mapnik = require('mapnik'),
    uuid = require('uuid');

exports.exportMap = function( req, res ){
  var dimensions = { x : 1024, y : 768 },
      titleHeight = 50;
  
  mapnik.register_default_fonts();
  mapnik.register_system_fonts()
  mapnik.register_default_input_plugins();
  
  var id = uuid.v1();
    drawBase( req, res, id, drawLayers );
  
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
    } else {
      var map = new mapnik.Map( dimensions.x, dimensions.y );
      map.load( __dirname + "/cache/raster/" + req.params.raster + "/raster.xml", function( err, map ){
        if( err ) throw err;
        var bounds = req.params.bounds.split( ',' );
        var merc = geo_mercator( bounds[ 0 ], bounds[ 1 ] ).concat( geo_mercator( bounds[ 2 ], bounds[ 3 ] ) );
        map.extent = merc;
        var im = new mapnik.Image( dimensions.x, dimensions.y );
        map.render( im, function( err, im ){
          if( err ) throw err;
          im.encode( 'png', function( err, buffer ){
            if( err ) throw err;
            fs.writeFile( 'raster' + id + '.png', buffer, function( err ){
              if( err ) throw err;
              console.log( 'Saved base image to raster' + id + '.png');
              callback( req, res, id, combineImage );
            });
          });
        });
      });
    }
  }
  
  function combineImage( req, res, id ){
    var Image = Canvas.Image,
        canvas = new Canvas( dimensions.x, dimensions.y ),
        context = canvas.getContext( '2d' );
      
    var base = new Image;
    base.src = fs.readFileSync( 'base' + id + '.png' );
    context.drawImage( base, 0, 0, dimensions.x, dimensions.y );
    
    if( req.params.raster != 'null' ){
      var raster = new Image;
      raster.src = fs.readFileSync( 'raster' + id + '.png' );
      context.globalAlpha = 0.75;
      context.drawImage( raster, 0, 0, dimensions.x, dimensions.y );
      context.globalAlpha = 1;
    }
    
    var layers = new Image;
    layers.src = fs.readFileSync( 'layers' + id + '.png' );
    context.drawImage( layers, 0, 0, dimensions.x, dimensions.y );
    
//    var legend = new Image;
//    legend.src = fs.readFileSync( __dirname + '/images/legend_' + req.params.lang + '.png' );
//    context.drawImage( legend, 0, titleHeight, 235, 768 );
      
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
    });
    res.send( new Buffer( canvas.toDataURL().substr( 22 ), 'base64' ) );
    
    fs.unlinkSync( 'base' + id + '.png' );
    if( req.params.raster != 'null' ) fs.unlinkSync( 'raster' + id + '.png' );
    fs.unlinkSync( 'layers' + id + '.png' );
  }
  
  function geo_mercator( lon_deg, lat_deg ){
    lon_rad = ( lon_deg / 180.0 * Math.PI );
    lat_rad = ( lat_deg / 180.0 * Math.PI );
    sm_a = 6378137;
    x = sm_a * lon_rad;
    y = sm_a * Math.log( ( Math.sin( lat_rad ) + 1 ) / Math.cos( lat_rad ) );
    return [ x, y ];
  }
}

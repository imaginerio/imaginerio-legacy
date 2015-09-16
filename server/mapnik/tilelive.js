var express = require('express'),
    tilelive = require('tilelive'),
    fs = require( 'graceful-fs' ),
    xml = require( 'libxmljs' ),
    _ = require( 'underscore' ),
    pg = require( 'pg' ),
    AWS = require( 'aws-sdk' ),
    dev,
    conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/rio",
    hillshade = [ { year : 1960, file : '../../../../../raster/Hillshade_WGS84_1960_2013.tif' }, { year : 1921, file : '../../../../../raster/Hillshade_WGS84_1921_1959.tif' }, { year : 1906, file : '../../../../../raster/Hillshade_WGS84_1906_1920.tif' }, { year : 1500, file : '../../../../../raster/Hillshade_WGS84_1500_1905.tif' } ];
    
var app = express();

app.use( function( req, res, next )
{
    res.setHeader( 'Access-Control-Allow-Origin', '*' );
    next();
});

app.use( function(err, req, res, next) {
  console.error(err.stack);
  next(err);
});

app.use( function(err, req, res, next) {
  if (req.xhr) {
    res.send(500, { error: 'Something blew up!' });
  } else {
    next(err);
  }
});

app.use( function(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
});

require('tilelive-mapnik').registerProtocols(tilelive);

//loading AWS config
AWS.config.loadFromPath( './aws-config.json' );
var s3 = new AWS.S3();

//postgres connect
var client = new pg.Client( conn );
client.connect();

app.get('/tiles/:year/:layer/:z/:x/:y.*', function( req, res ){
  dev = req.headers.host.match( /-dev/ ) ? true : false;
  var png = "cache/png/" + req.params.year + "/" + req.params.layer + "/" + req.params.z + "/" + req.params.x + "/" + req.params.y + ".png",
      exists = false,
      query = client.query( "SELECT id FROM cache WHERE year = " + req.params.year + " AND layer = '" + req.params.layer + "' AND z = " + req.params.z + " AND x = " + req.params.x + " AND y = " + req.params.y );
      
  query.on( 'row', function( result ){
		exists = result.id;
	});
	
	query.on( 'end', function(){
  	  if( exists && dev === false ){
      res.redirect( "http://d3unofsdy0zxgc.cloudfront.net/" + png );
    }
    else{
      parseXML( req, res, renderTile );
    }
  });
});

app.get( '/raster/:id/:z/:x/:y.*', function( req, res ){
  dev = req.headers.host.match( /-dev/ ) ? true : false;
  var png = "cache/raster/" + req.params.id + "/" + req.params.z + "/" + req.params.x + "/" + req.params.y + ".png",
      exists = false,
      query = client.query( "SELECT id FROM cache WHERE year IS NULL AND layer = '" + req.params.id + "' AND z = " + req.params.z + " AND x = " + req.params.x + " AND y = " + req.params.y );
      
  query.on( 'row', function( result ){
		exists = result.id;
	});
	
	query.on( 'end', function(){
  	  if( exists ){
      res.redirect( "http://d3unofsdy0zxgc.cloudfront.net/" + png );
    }
    else{
      req.params.year = null;
      parseRasterXML( req, res, renderTile );
    }
  });
})

function parseXML( req, res, callback ){
	var file = dev ? __dirname + "/cache/xml/" + req.params.year + "/" + req.params.layer + "-dev.xml" : __dirname + "/cache/xml/" + req.params.year + "/" + req.params.layer + ".xml";
		
	if( fs.existsSync( file ) ){
		callback( file, req.params, res );
	}
	else{
		var data = fs.readFileSync( req.params.layer == "base" ? "base.xml" : "stylesheet.xml", 'utf8' );	
    var xmlDoc = xml.parseXml( data );
    var sources = xmlDoc.find( "//Parameter[@name='table']" );
    var dbname = xmlDoc.find( "//Parameter[@name='dbname']" );
			
		_.each( sources, function( item ){
			var t = item.text();
			item.text( t.replace( /99999999/g, req.params.year ) );
		});
		
    if( dev ){
      _.each( dbname, function( item ){
      		var t = item.text();
        item.text( t + 'dev' );
      });
    }

		var off = req.params.layer.split( "," );
		_.each( off, function( l ){
			sources = xmlDoc.find( "//Layer[@name='" + l + "']" );
			_.each( sources, function( item ){
				item.attr( { "status" : "off" } );
			})
		});
			
		var hs = xmlDoc.find( "//Parameter[@name='file']" );
		_.each( hs, function( item ){
			if( item.text().match( /hillshade/ ) ) item.text( _.find( hillshade, function( h ){ return h.year <= req.params.year } ).file );
		});
			
    mkdir( "cache/xml/" + req.params.year );
			
    fs.writeFileSync( file, xmlDoc.toString() );
    callback( file, req.params, res );
  }
}

function parseRasterXML( req, res, callback ){
  var file = __dirname + "/cache/raster/" + req.params.id + "/raster.xml";
  
  if( fs.existsSync( file ) ){
		callback( file, req.params, res );
	}
	else{
  	  var data = fs.readFileSync( "raster.xml", 'utf8' );
  	  var xmlDoc = xml.parseXml( data );
  	  var sources = xmlDoc.find( "//Parameter[@name='file']" );
				
    sources[ 0 ].text( "../../../../../raster/" + req.params.id + ".tif" );
		mkdir( "cache/raster/" + req.params.id );
		
		fs.writeFileSync( file, xmlDoc.toString() );
    callback( file, req.params, res );
	}
}

function mkdir(path, root) {
  var dirs = path.split('/'), dir = dirs.shift(), root = (root||'')+dir+'/';
  try { fs.mkdirSync(root); }
  catch (e) {
    //dir wasn't made, something went wrong
    if(!fs.statSync(root).isDirectory()) throw new Error(e);
  }
  return !dirs.length||mkdir(dirs.join('/'), root);
}

function renderTile( filename, params, res ){
  tilelive.load('mapnik://' + filename, function( err, source ){
    if( err ){
      console.log( err );
      res.status( 500 ).send( 'Error reading XML' );
    }
    source.getTile( params.z, params.x, params.y, function( err, tile, headers ){
      if( !err ){
        res.send( tile );
        if( dev === false ) saveTile( params, tile, res );
      }
      else {
        console.log( err );
        res.status( 500 ).send( 'Error writing tile' );
      }
    });
  });
}

function saveTile( params, tile, res ){
  var png = "cache/png/" + params.year + "/" + params.layer + "/" + params.z + "/" + params.x + "/" + params.y + ".png";
  var p = { Bucket : 'imagine-rio', Key : png, Body : tile, ACL : 'public-read' };
  s3.putObject( p, function( err, data ){
    if( err ) return console.log( err );
      
    var query = client.query( "INSERT INTO cache ( year, layer, z, x, y ) VALUES ( " + params.year + ", '" + params.layer + "', " + params.z + ", " + params.x + ", " + params.y + " )" );
    query.on( 'end', function(){
      console.log( png + " uploaded to S3" );
    });
  });
}

app.listen( 3001 );
console.log( 'Listening on port: ' + 3001 );

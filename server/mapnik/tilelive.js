var express = require('express'),
    tilelive = require('tilelive'),
    fs = require( 'graceful-fs' ),
    xml = require( 'libxmljs' ),
    _ = require( 'underscore' ),
    //pg = require( 'pg' ),
    //conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/rio",
    hillshade = [ { year : 1960, file : '../../../../../raster/Hillshade_WGS84_1960_2013.tif' }, { year : 1921, file : '../../../../../raster/Hillshade_WGS84_1921_1959.tif' }, { year : 1906, file : '../../../../../raster/Hillshade_WGS84_1906_1920.tif' }, { year : 1500, file : '../../../../../raster/Hillshade_WGS84_1500_1905.tif' } ];
    
var app = express();
var filename = __dirname + '/cache/xml/1952/base.xml';
require('tilelive-mapnik').registerProtocols(tilelive);

app.get('/:year/:layer/:z/:x/:y.*', function(req, res) {
  parseXML( req, function( filename, params ){
    tilelive.load('mapnik://' + filename, function(err, source) {
      if (err) throw err;
      source.getTile( params.z, params.x, params.y, function( err, tile, headers ){
        if (!err) {
          res.send( tile );
        } else {
          res.send('Tile rendering error: ' + err + '\n');
        }
      });
    });
  });
});

var parseXML = function( req, callback ){
	var file = __dirname + "/cache/xml/" + req.params.year + "/" + req.params.layer + ".xml";
		
	if( fs.existsSync( file ) ){
		callback( file, req.params );
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
			
/*
    if( dev ){
      _.each( dbname, function( item ){
      		var t = item.text();
        item.text( t + 'dev' );
      });
    }
*/

		var off = req.params.layer.split( "," );
		_.each( off, function( l )
		{
			sources = xmlDoc.find( "//Layer[@name='" + l + "']" );
			_.each( sources, function( item )
			{
				item.attr( { "status" : "off" } );
			})
		});
			
		var hs = xmlDoc.find( "//Parameter[@name='file']" );
		_.each( hs, function( item )
		{
			if( item.text().match( /hillshade/ ) ) item.text( _.find( hillshade, function( h ){ return h.year <= req.params.year } ).file );
		});
			
    mkdir( "cache/xml/" + req.params.year );
			
    fs.writeFileSync( file, xmlDoc.toString() );
		console.log( "Wrote file: " + file );
    callback( file, req.params );
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

console.log('Listening on port: ' + 8888);
app.listen( 8888 );
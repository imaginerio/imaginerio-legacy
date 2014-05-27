var mapnik = require( 'mapnik' ),
	mercator = require( './utils/sphericalmercator' ),
	mappool = require( './utils/pool.js' ),
	http = require( 'http' ),
	fs = require( 'fs' ),
	xml = require( 'libxmljs' ),
	_ = require( 'underscore' ),
	parseXYZ = require( './utils/tile.js' ).parseXYZ;

// register plugins
if( mapnik.register_default_input_plugins ) mapnik.register_default_input_plugins();
if( mapnik.register_default_fonts ) mapnik.register_default_fonts();
if( mapnik.register_system_fonts ) mapnik.register_system_fonts();

var TMS_SCHEME = false;

// create a pool of 5 maps to manage concurrency under load
var maps = mappool.create_pool( 5 );

var usage = 'usage: app.js <stylesheet> <port>\ndemo:  app.js ../../stylesheet.xml 8000';

var base = process.argv[ 2 ];

if( !base )
{
   console.log( usage );
   process.exit( 1 );
}

var port = process.argv[ 3 ];

if( !port )
{
	console.log( usage );
	process.exit( 1 );
}

var parseXML = function( req, year, options, callback )
{
	var file = "cache/xml/" + year + ".xml";
	fs.exists( file, function( exists )
	{
		if( exists )
		{
			console.log( "File exists!" );
			callback( file, options );
		}
		else
		{
			fs.readFile( base, 'utf8', function( err, data )
			{
				if( err ) return console.log( err );
				
				var xmlDoc = xml.parseXml( data );
				var sources = xmlDoc.find( "//Parameter[@name='table']" );
				
				_.each( sources, function( item )
				{
					var t = item.text();
					item.text( t.replace( /99999999/g, year ) );
				});
				
				fs.writeFile( file, xmlDoc.toString(), function( err )
				{
					if( err )
					{
						console.log( err );
					}
					else
					{
						console.log( "Wrote file: " + file );
						callback( file, options );
					}
				});
			});
		}
	});
}

var aquire = function( id, options, callback )
{
	methods = {
		create : function( cb )
		{
			var obj = new mapnik.Map( options.width || 256, options.height || 256 );
			obj.load( id, { strict : true }, function( err, obj )
			{
				if( options.bufferSize ) obj.bufferSize = options.bufferSize;
                cb(err,obj);
			});
		},
		destroy : function( obj )
		{
			delete obj;
		}
    };
    maps.acquire( id, methods, function( err, obj )
    {
      callback( err, obj );
    });
};


http.createServer( function( req, res )
{
	parseXYZ( req, TMS_SCHEME, function( err, params )
	{
		if( err )
		{
			res.writeHead( 500, { 'Content-Type' : 'text/plain' } );
			res.end( err.message );
        }
        else
        {
			parseXML( req, params.year, {}, function( stylesheet, options )
			{
				aquire( stylesheet, options, function( err, map )
				{
					if( err )
					{
						process.nextTick( function()
						{
							maps.release( stylesheet, map );
						});
						res.writeHead( 500, { 'Content-Type': 'text/plain' } );
	                    res.end( err.message );
					}
	                else
					{
	                    // bbox for x,y,z
						var bbox = mercator.xyz_to_envelope( params.x, params.y, params.z, TMS_SCHEME );
						map.extent = bbox;
						var im = new mapnik.Image( map.width, map.height );
						map.render( im, function( err, im )
						{
							process.nextTick( function()
							{
								maps.release( stylesheet, map );
							});
							if( err )
							{
								res.writeHead( 500, { 'Content-Type' : 'text/plain' } );
								res.end( err.message );
							}
							else
							{
								res.writeHead( 200, { 'Content-Type' : 'image/png' } );
								res.end( im.encodeSync( 'png' ) );
							}
						});
					}
				});
			});
		}
	});

}).listen( port );

console.log('Test server listening on port %d', port);
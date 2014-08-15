var mapnik = require( 'mapnik' ),
	mercator = require( './utils/sphericalmercator' ),
	mappool = require( './utils/pool.js' ),
	http = require( 'http' ),
	fs = require( 'graceful-fs' ),
	xml = require( 'libxmljs' ),
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

var parseXML = function( req, id, options, callback )
{
	var file = "cache/raster/" + id + "/raster.xml";
	fs.exists( file, function( exists )
	{
		if( exists )
		{
			callback( file, options );
		}
		else
		{
			fs.readFile( base, 'utf8', function( err, data )
			{
				if( err ) return console.log( err );
				
				var xmlDoc = xml.parseXml( data );
				var sources = xmlDoc.find( "//Parameter[@name='file']" );
				
				sources[ 0 ].text( "../../../../../raster/" + id + ".tif" );
				
				mkdir( "cache/raster/" + id );
				
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

function mkdir(path, root) {

    var dirs = path.split('/'), dir = dirs.shift(), root = (root||'')+dir+'/';

    try { fs.mkdirSync(root); }
    catch (e) {
        //dir wasn't made, something went wrong
        if(!fs.statSync(root).isDirectory()) throw new Error(e);
    }

    return !dirs.length||mkdir(dirs.join('/'), root);
}

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
			var png = "cache/raster/" + params.raster + "/" + params.z + "/" + params.x + "/" + params.y + ".png";
			fs.exists( png, function( exists )
			{
				if( exists )
				{
					res.writeHead( 302, {
						"Location": "http://rio-server.axismaps.com:8080" + png.replace( /^cache/, "" ),
						"Access-Control-Allow-Origin" : "*"
					});
					res.end();
				}
				else
				{			
					var t = process.hrtime();
					parseXML( req, params.raster, {}, function( stylesheet, options )
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
								try
								{
									map.extent = bbox;
								}
								catch( err )
								{
									res.writeHead( 500, { 'Content-Type' : 'text/plain' } );
									res.end( "Undefined extent" );
								}
								
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
										var imagedata = im.encodeSync( 'png' );
										res.writeHead( 200, {
											'Content-Type' : 'image/png',
											"Access-Control-Allow-Origin" : "*"
										});
										res.end( im.encodeSync( 'png' ) );
										
										t = process.hrtime( t );
											var sec = Math.round( ( t[ 0 ] + ( t[ 1 ] / 1000000000 ) ) * 100 ) / 100;
											console.log( png + ' saved in ' + sec + ' seconds.' );
										
										mkdir( "cache/raster/" + params.raster + "/" + params.z + "/" + params.x );
										fs.writeFile( png, imagedata, 'binary', function( err )
										{
											if( err ) return console.log( err );
										});
									}
								});
							}
						});
					});
				}
			});
		}
	});

}).listen( port );

console.log('Test server listening on port %d', port);
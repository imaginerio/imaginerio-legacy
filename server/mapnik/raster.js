var mapnik = require( 'mapnik' ),
	mercator = require( './utils/sphericalmercator' ),
	mappool = require( './utils/pool.js' ),
	http = require( 'http' ),
	fs = require( 'graceful-fs' ),
	xml = require( 'libxmljs' ),
	parseXYZ = require( './utils/tile.js' ).parseXYZ,
	pg = require( 'pg' ),
	AWS = require( 'aws-sdk' ),
	conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/rio",
	dev;

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

//loading AWS config
AWS.config.loadFromPath( './aws-config.json' );
var s3 = new AWS.S3();

//postgres connect
var client = new pg.Client( conn );
client.connect();

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
      dev = req.headers.host.match( /-dev/ ) ? true : false;
			var png = "cache/raster/" + params.raster + "/" + params.z + "/" + params.x + "/" + params.y + ".png",
				exists = false,
				query = client.query( "SELECT id FROM cache WHERE year IS NULL AND layer = '" + params.raster + "' AND z = " + params.z + " AND x = " + params.x + " AND y = " + params.y );
			
			query.on( 'row', function( result )
			{
				exists = result.id;
			});
			query.on( 'end', function()
			{
				if( exists && dev === false )
				{
					console.log( png + ' exists.' );
					res.writeHead( 302, {
						"Location": "http://d3unofsdy0zxgc.cloudfront.net/" + png
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
									var im = new mapnik.Image( map.width, map.height );
								}
								catch( err )
								{
									res.writeHead( 500, { 'Content-Type' : 'text/plain' } );
									res.end( "Undefined extent" );
									console.log( "Bad request for " + params.raster );
                  return false;
								}
								
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
										
										if( dev ){
										  return console.log( png + " dev tile created" );
										}
										
										t = process.hrtime( t );
										var sec = Math.round( ( t[ 0 ] + ( t[ 1 ] / 1000000000 ) ) * 100 ) / 100;
										console.log( png + ' saved in ' + sec + ' seconds.' );
										
										mkdir( "cache/raster/" + params.raster + "/" + params.z + "/" + params.x );
										fs.writeFile( png, imagedata, 'binary', function( err )
										{
											if( err )
											{
												return console.log( err );
											}
											else
											{
												var p = { Bucket : 'imagine-rio', Key : png, Body : imagedata, ACL : 'public-read' };
												s3.putObject( p, function( err, data )
												{
											    	if( err )       
													{
														console.log( err );
													}
													else
													{
														var query = client.query( "INSERT INTO cache ( layer, z, x, y ) VALUES ( '" + params.raster + "', " + params.z + ", " + params.x + ", " + params.y + " )" );
														query.on( 'end', function()
														{
															console.log( png + " uploaded to S3" );
															fs.unlink( png, function( err )
															{
																if( err ) console.log( err );
															});
															
														});
													}
												});
											}
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
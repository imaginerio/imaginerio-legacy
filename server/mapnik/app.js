var mapnik = require( 'mapnik' ),
	mercator = require( './utils/sphericalmercator' ),
	mappool = require( './utils/pool.js' ),
	http = require( 'http' ),
	fs = require( 'graceful-fs' ),
	xml = require( 'libxmljs' ),
	_ = require( 'underscore' ),
	parseXYZ = require( './utils/tile.js' ).parseXYZ,
	pg = require( 'pg' ),
	AWS = require( 'aws-sdk' ),
	conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/rio",
	hillshade = [ { year : 1960, file : '../../../../../raster/Hillshade_WGS84_1960_2013.tif' }, { year : 1921, file : '../../../../../raster/Hillshade_WGS84_1921_1959.tif' }, { year : 1906, file : '../../../../../raster/Hillshade_WGS84_1906_1920.tif' }, { year : 1500, file : '../../../../../raster/Hillshade_WGS84_1500_1905.tif' } ];

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

var parseXML = function( req, year, layer, options, callback )
{
	var file = "cache/xml/" + year + "/" + layer + ".xml";
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
				var sources = xmlDoc.find( "//Parameter[@name='table']" );
				
				_.each( sources, function( item )
				{
					var t = item.text();
					item.text( t.replace( /99999999/g, year ) );
				});
				
				var off = layer.split( "," );
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
					item.text( _.find( hillshade, function( h ){ return h.year <= year } ).file );
				});
				
				mkdir( "cache/xml/" + year );
				
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
			params.layer = params.layer.split( "," ).sort().join( "," );
			
			var png = "cache/png/" + params.year + "/" + params.layer + "/" + params.z + "/" + params.x + "/" + params.y + ".png",
				exists = false,
				query = client.query( "SELECT id FROM cache WHERE year = " + params.year + " AND layer = '" + params.layer + "' AND z = " + params.z + " AND x = " + params.x + " AND y = " + params.y );

			query.on( 'row', function( result )
			{
				exists = result.id;
			});
			query.on( 'end', function()
			{
				if( exists )
				{
					console.log( png + ' exists.' );
					res.writeHead( 302, {
						"Location": "http://imagine-rio2.s3-website-us-west-2.amazonaws.com/" + png
					});
					res.end();
				}
				else
				{			
					var t = process.hrtime();
					parseXML( req, params.year, params.layer, {}, function( stylesheet, options )
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
											
											mkdir( "cache/png/" + params.year + "/" + params.layer + "/" + params.z + "/" + params.x );
											fs.writeFile( png, imagedata, 'binary', function( err )
											{
												if( err )
												{
													return console.log( err );
												}
												else
												{
													var p = { Bucket : 'imagine-rio2', Key : png, Body : imagedata, ACL : 'public-read' };
													s3.putObject( p, function( err, data )
													{
												    	if( err )       
														{
															console.log( err );
														}
														else
														{
															var query = client.query( "INSERT INTO cache ( year, layer, z, x, y ) VALUES ( " + params.year + ", '" + params.layer + "', " + params.z + ", " + params.x + ", " + params.y + " )" );
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
								catch( err )
								{
									res.writeHead( 500, { 'Content-Type' : 'text/plain' } );
									res.end( "Undefined extent" );
								}
							}
						});
					});
				}
			});
		}
	});

}).listen( port );

console.log('Test server listening on port %d', port);
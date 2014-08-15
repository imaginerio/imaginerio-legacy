var mapnik = require( 'mapnik' ),
	mercator = require( './utils/sphericalmercator' ),
	mappool = require( './utils/pool.js' ),
	fs = require( 'graceful-fs' ),
	xml = require( 'libxmljs' ),
	_ = require( 'underscore' ),
	pg = require( 'pg' ),
	AWS = require( 'aws-sdk' ),
	conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/rio";
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

//loading AWS config
AWS.config.loadFromPath( './aws-config.json' );
var s3 = new AWS.S3();

var parseXML = function( year, layer, options, callback )
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

function render_tile( year, layer, z, x, y, callback )
{
	if( layer === undefined ) return false;
	layer = layer.split( "," ).sort().join( "," );
	
	var png = "cache/png/" + year + "/" + layer + "/" + z + "/" + x + "/" + y + ".png",
		exists = false,
		query = client.query( "SELECT id FROM cache WHERE year = " + year + " AND layer = '" + layer + "' AND z = " + z + " AND x = " + x + " AND y = " + y );
		
	query.on( 'row', function( result )
	{
		exists = result.id;
	});
	query.on( 'end', function()
	{
		if( exists )
		{
			console.log( png + ' exists.' );
			callback( years[ 0 ], combo[ 0 ], zs[ 0 ], xs[ 0 ], ys.shift(), callback );
		}
		else
		{
			var t = process.hrtime();
			parseXML( year, layer, {}, function( stylesheet, options )
			{
				aquire( stylesheet, options, function( err, map )
				{
					if( err )
					{
						process.nextTick( function()
						{
							maps.release( stylesheet, map );
						});
						console.log( "ERROR 149" );
					}
			        else
					{
			        	// bbox for x,y,z
						var bbox = mercator.xyz_to_envelope( x, y, z, TMS_SCHEME );
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
									console.log( "ERROR 167" );
								}
								else
								{
									var imagedata = im.encodeSync( 'png' );
											
									mkdir( "cache/png/" + year + "/" + layer + "/" + z + "/" + x );
									fs.writeFile( png, imagedata, 'binary', function( err )
									{
										if( err ) return console.log( err );
										t = process.hrtime( t );
										var sec = Math.round( ( t[ 0 ] + ( t[ 1 ] / 1000000000 ) ) * 100 ) / 100;
										console.log( png + ' saved in ' + sec + ' seconds' );
										
										var params = { Bucket : 'imagine-rio2', Key : png, Body : imagedata };
										s3.putObject( params, function( err, data )
										{
									    	if( err )       
											{
												console.log( err );
											}
											else
											{
												var query = client.query( "INSERT INTO cache ( year, layer, z, x, y ) VALUES ( " + year + ", '" + layer + "', " + z + ", " + x + ", " + y + " )" );
												query.on( 'end', function()
												{
													console.log( png + " uploaded to S3" );
													callback( years[ 0 ], combo[ 0 ], zs[ 0 ], xs[ 0 ], ys.shift(), callback );
												});
											}
									
									   });
									});
								}
							});
						}
						catch( err )
						{
							console.log( err );
						}
					}
				});
			});
		}
	});
}

function tile_coords( lat, lon, zoom )
{
	var originShift = 2 * Math.PI * 6378137 / 2.0,
		initialResolution = 2 * Math.PI * 6378137 / 256; //tilesize

	var mx = lon * originShift / 180.0,
		my = Math.log(Math.tan((90 + lat) * Math.PI / 360.0)) / (Math.PI / 180.0);

	my = my * originShift / 180.0;

	//MetersToPixel(mx, my, zooma)
	var res = initialResolution / (Math.pow(2, zoom)),
		px = (mx + originShift) / res,
		py = (my + originShift) / res;

	//PixelsToTile(px, py)
	var tx = Math.ceil(px / parseFloat(256)) - 1,
		ty = Math.ceil(py / parseFloat(256)) - 1;
	ty = (Math.pow(2, zoom) - 1) - ty;
	
	return { x : tx, y : ty }
}

function next_tile( year, layer, z, x, y, callback )
{
	if( y === undefined )
	{
		xs.shift();
		x = xs[ 0 ];
		ys = _.range( min.y, max.y + 1 );
		y = ys.shift();
	}
	
	if( x === undefined )
	{
		z = zs.shift();
		z = zs[ 0 ];
		if( z === undefined )
		{
			combo.shift();
			layer = combo[ 0 ];
			zs = _.range( minz, maxz + 1 );
			z = zs[ 0 ];
			if( layer === undefined )
			{
				years.shift();
				year = years[ 0 ];
				get_layers( year );
				return false;
			}
		}
		min = tile_coords( miny, minx, z );
		max = tile_coords( maxy, maxx, z );
		xs = _.range( min.x, max.x + 1 ),
		ys = _.range( min.y, max.y + 1 );
		x = xs[ 0 ];
		y = ys.shift();
	}
	render_tile( year, layer, z, x, y, callback );
}

function get_layers( year )
{
	var layers = [],
		big = [ 'buildings', 'lotslanduse', 'roads_labels,roads', 'neighborhoods_labels,neighborhoods' ],
		query = client.query( "SELECT id FROM basepoly INNER JOIN legend ON basepoly.layer = legend.layer WHERE firstdispl <= " + year + " AND lastdispla >= " + year + " AND ID IS NOT NULL GROUP BY id UNION SELECT id FROM baseline INNER JOIN legend ON baseline.layer = legend.layer WHERE firstdispl <= " + year + " AND lastdispla >= " + year + " AND ID IS NOT NULL GROUP BY id" );
	
	query.on( 'row', function( result )
	{
		layers.push( result.id );
	});
	query.on( 'end', function()
	{
		combo = combinations( _.intersection( layers, big ) );
		combo = _.map( combo, function( val ){ return val.replace( /^,/gi, ""); } );
		combo.push( "all" );
		console.log( combo );
		
		next_tile( years[ 0 ], combo[ 0 ], zs[ 0 ], xs[ 0 ], ys.shift(), next_tile );
		next_tile( years[ 0 ], combo[ 0 ], zs[ 0 ], xs[ 0 ], ys.shift(), next_tile );
		next_tile( years[ 0 ], combo[ 0 ], zs[ 0 ], xs[ 0 ], ys.shift(), next_tile );
		next_tile( years[ 0 ], combo[ 0 ], zs[ 0 ], xs[ 0 ], ys.shift(), next_tile );
		next_tile( years[ 0 ], combo[ 0 ], zs[ 0 ], xs[ 0 ], ys.shift(), next_tile );
	});
	
	function combinations( str )
	{
    	if( str.length == 1 ) return str;
    	
    	var fn = function( active, rest, a )
    	{
        	if( active.length == 0 && rest.length == 0 )
            	return;
			if( rest.length == 0 )
			{
            	a.push( active );
        	}
        	else
        	{
            	fn( active + "," + rest[ 0 ], rest.slice( 1 ), a );
				fn( active, rest.slice( 1 ), a );
        	}
			return a;
    	}
		return fn( "", str, [] );
	}
}

var client = new pg.Client( conn );
client.connect();
	
var years = [],
	minx = -43.3,
	maxx = -43.1,
	maxy = -23.0,
	miny = -22.8,
	minz = 14,
	maxz = 18,
	min = tile_coords( miny, minx, minz ),
	max = tile_coords( maxy, maxx, minz ),
	xs = _.range( min.x, max.x + 1 ),
	ys = _.range( min.y, max.y + 1 ),
	zs = _.range( minz, maxz + 1 ),
	combo = [];
	
	
var query = client.query( "SELECT * FROM ( SELECT firstdispl  AS year FROM basepoint UNION SELECT lastdispla AS year FROM basepoint UNION SELECT firstdispl AS year FROM baseline UNION SELECT lastdispla AS year FROM baseline UNION SELECT firstdispl AS year FROM basepoly UNION SELECT lastdispla AS year FROM basepoly UNION SELECT earliestda AS year FROM visualpoly UNION SELECT latestdate AS year FROM visualpoly ) as q ORDER BY year" );
	
query.on( 'row', function( result )
{
	years.push( result.year );
});
	
query.on( 'end', function()
{
	//years.reverse();
	console.log( years );
	
	get_layers( years[ 0 ] );
});
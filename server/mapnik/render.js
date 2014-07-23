var mapnik = require( 'mapnik' ),
	mercator = require( './utils/sphericalmercator' ),
	mappool = require( './utils/pool.js' ),
	fs = require( 'graceful-fs' ),
	xml = require( 'libxmljs' ),
	_ = require( 'underscore' ),
	pg = require( 'pg' ),
	conn = "postgres://axismaps:U6glEdd0igS2@rio2.c1juezxtnbot.us-west-2.rds.amazonaws.com/rio",
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

function render_tile( year, layer, z, x, y )
{
	var png = "cache/png/" + year + "/" + layer + "/" + z + "/" + x + "/" + y + ".png";
	fs.exists( png, function( exists )
	{
		if( exists )
		{
			console.log( png + ' exists.' );
		}
		else
		{
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
						console.log( "ERROR" );
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
									console.log( "ERROR" );
								}
								else
								{
									var imagedata = im.encodeSync( 'png' );
											
									mkdir( "cache/png/" + year + "/" + layer + "/" + z + "/" + x );
									fs.writeFile( png, imagedata, 'binary', function( err )
									{
										if( err ) return console.log( err );
										console.log( png + ' saved.' );
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

function render_year( years, y, callback )
{
	var minx = -43.9,
		maxx = -43,
		maxy = -23.2,
		miny = -22.6,
		year = years[ y ];
	console.log( year );
		
	for( var z = 14; z <= 18; z++ )
	{
		var min = tile_coords( miny, minx, z ),
			max = tile_coords( maxy, maxx, z );
		
		console.log( min );
		console.log( max );
			
		for( var x = min.x; x <= max.x; x++ )
		{
			for( var y = min.y; y <= max.y; y++ )
			{
				render_tile( year, "all", z, x, y );
			}
		}
	}
	y++;
	if( y < years.length ) callback( years, y, callback );
}

var client = new pg.Client( conn );
client.connect();
	
var years = [],
	y = 0;
	
var query = client.query( "SELECT * FROM ( SELECT firstdispl  AS year FROM basepoint UNION SELECT lastdispla AS year FROM basepoint UNION SELECT firstdispl AS year FROM baseline UNION SELECT lastdispla AS year FROM baseline UNION SELECT firstdispl AS year FROM basepoly UNION SELECT lastdispla AS year FROM basepoly UNION SELECT earliestda AS year FROM visualpoly UNION SELECT latestdate AS year FROM visualpoly ) as q ORDER BY year" );
	
query.on( 'row', function( result )
{
	years.push( result.year );
});
	
query.on( 'end', function()
{
	console.log( years );

	render_year( years, y, render_year );
	
});
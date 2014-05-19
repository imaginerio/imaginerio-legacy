var pg = require( 'pg' ),
	postgeo = require( 'postgeo' ),
	_ = require( 'underscore' ),
	conn = "postgres://axismaps:U6glEdd0igS2@rio2.c1juezxtnbot.us-west-2.rds.amazonaws.com/rio";
	
exports.bounds = function( req, res )
{
	var client = new pg.Client( conn );
	client.connect();
	
	var year = req.params.year;
	var query = client.query( "SELECT ST_Extent( geom ) AS extent FROM basepoly WHERE firstdispl <= " + year + " AND lastdispla >= " + year );
	
	query.on( 'row', function( result )
	{
		var bounds = result.extent.replace( /(BOX\(|\))/gi, "" ).split( "," );
		bounds = _.map( bounds, function( d ){ return _.map( d.split( " " ).reverse(), function( n ){ return parseFloat( n ) } ) } );
		res.send( bounds );
		client.end();
	});
}

exports.probe = function( req, res )
{
	var client = new pg.Client( conn );
	client.connect();
	
	var year = req.params.year,
		coords = req.params.coords,
		results = [];
	
	var query = client.query( "SELECT id, name FROM ( SELECT globalidco AS id, namecomple AS name, geom FROM baseline WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT globalidco AS id, namecomple AS name, geom FROM basepoly WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT globalidco AS id, namecomple AS name, geom FROM basepoint WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " ) as q WHERE ST_DWithin( geom, ST_SetSRID( ST_MakePoint( " + coords + " ), 4326 ), 0.0005 )" );
	
	query.on( 'row', function( result )
	{
		results.push( result );
	})
	
	query.on( 'end', function()
	{
		res.send( results );
		client.end();
	});
}

exports.draw = function( req, res )
{
	postgeo.connect( conn );
	
	var id = _.reduce( req.params.id.split( "," ), function( memo, i ){ return memo += "'" + i + "',"; }, "ANY(ARRAY[" ).replace( /,$/, "])" ); 

	postgeo.query( "SELECT id, ST_AsGeoJSON( geom ) AS geometry FROM ( SELECT globalidco AS ID, geom FROM baseline WHERE globalidco = " + id + " UNION SELECT globalidco AS ID, geom FROM basepoly WHERE globalidco = " + id + " UNION SELECT globalidco AS ID, geom FROM basepoint WHERE globalidco = " + id + " ) AS q", "geojson", function( data )
	{
		res.send( data );
	});
}

exports.visual = function( req, res )
{
	postgeo.connect( conn );
	
	var year = req.params.year;
	
	postgeo.query( "SELECT ssid AS id, ST_AsGeoJSON( ST_Collect( ST_SetSRID( ST_MakePoint( longitude, latitude ), 4326 ), geom ) ) AS geometry FROM visualpoly WHERE layer = 'ImageViewshedsPoly' AND earliestda <= " + year + " AND latestdate >= " + year, "geojson", function( data )
	{
		res.send( data );
	});
}

exports.plan = function( req, res )
{
	postgeo.connect( conn );
	
	var plan = decodeURI( req.params.name );
	
	postgeo.query( "SELECT globalidco AS id, namecomple AS name, ST_AsGeoJSON( geom ) AS geometry FROM plannedline WHERE planname = '" + plan + "' UNION SELECT globalidco AS id, namecomple AS name, ST_AsGeoJSON( geom ) AS geometry FROM plannedpoly WHERE planname = '" + plan + "'", "geojson", function( data )
	{
		res.send( data );
	});
}
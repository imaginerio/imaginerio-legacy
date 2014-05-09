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
	postgeo.connect( conn );
	
	var year = req.params.year;
	var coords = req.params.coords;
	
	postgeo.query( "SELECT gid, ST_AsGeoJSON( geom ) AS geometry FROM ( SELECT gid, geom FROM baseline WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT gid, geom FROM basepoly WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT gid, geom FROM basepoint WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " ) as q WHERE ST_DWithin(geom, ST_SetSRID( ST_MakePoint( " + coords + " ), 4326 ), 0.0005 )", "geojson", function( data )
	{
		res.send( data );
		postgeo.end();
	})
}
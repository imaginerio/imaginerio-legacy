var pg = require( 'pg' ),
	_ = require( 'underscore' ),
	conn = "postgres://localhost/rio";
	
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
	});
}

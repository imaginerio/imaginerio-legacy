var pg = require( 'pg' ),
	conn = "postgres://localhost/rio";
	
exports.timeline = function( req, res )
{
	var client = new pg.Client( conn );
	client.connect();
	
	var query = client.query( "SELECT MIN( firstdispl ) AS min, MAX( firstdispl ) as max FROM ( SELECT firstdispl FROM basepoint UNION SELECT firstdispl FROM baseline UNION SELECT firstdispl FROM basepoly ) as q" );
	
	query.on( 'row', function( result )
	{
		res.send( result );
	});
}
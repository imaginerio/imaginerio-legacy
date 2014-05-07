var pg = require( 'pg' ),
	_ = require( 'underscore' ),
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

exports.layers = function( req, res )
{
	var client = new pg.Client( conn );
	client.connect();

	var year = req.params.year;
	var q = "SELECT * FROM ( SELECT folder, geodatabas, layer, featuretyp FROM baseline WHERE firstdispl <= " + year + " AND lastdispla >= " + year + " GROUP BY folder, geodatabas, layer, featuretyp UNION SELECT folder, geodatabas, layer, featuretyp FROM basepoint WHERE firstdispl <= " + year + " AND lastdispla >= " + year + " GROUP BY folder, geodatabas, layer, featuretyp UNION SELECT folder, geodatabas, layer, featuretyp FROM basepoly WHERE firstdispl <= " + year + " AND lastdispla >= " + year + " GROUP BY folder, geodatabas, layer, featuretyp ) as q ORDER BY folder, geodatabas, layer, featuretyp";
	
	var query = client.query( q ),
		arr = [],
		layers = {};
	query.on( 'row', function( result )
	{
		arr.push( result );
	});
	
	query.on( 'end', function()
	{
		_.each( arr, function( val )
		{			
			if( !layers[ val.folder ] ) layers[ val.folder ] = {};
			if( !layers[ val.folder ][ val.geodatabas ] ) layers[ val.folder ][ val.geodatabas ] = {};
			if( !layers[ val.folder ][ val.geodatabas ][ val.layer ] ) layers[ val.folder ][ val.geodatabas ][ val.layer ] = [];
			if( val.featuretyp ) layers[ val.folder ][ val.geodatabas ][ val.layer ].push( val.featuretyp );
		});
		
		res.send( layers );
	});
}
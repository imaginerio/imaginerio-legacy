var pg = require( 'pg' ),
	_ = require( 'underscore' ),
	conn = "postgres://axismaps:U6glEdd0igS2@rio2.c1juezxtnbot.us-west-2.rds.amazonaws.com/rio";
	
exports.timeline = function( req, res )
{
	var client = new pg.Client( conn );
	client.connect();
	
	var years = [];
	
	var query = client.query( "SELECT * FROM ( SELECT firstdispl  AS year FROM basepoint UNION SELECT lastdispla + 1 AS year FROM basepoint UNION SELECT firstdispl  AS year FROM baseline UNION SELECT lastdispla + 1 AS year FROM baseline UNION SELECT firstdispl  AS year FROM basepoly UNION SELECT lastdispla + 1 AS year FROM basepoly ) as q ORDER BY year" );
	
	query.on( 'row', function( result )
	{
		years.push( result.year );
	});
	
	query.on( 'end', function()
	{
		years.pop();
		res.send( [ 1567, 1819, 1903, 1982, 2013 ] );
		client.end();
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
		client.end();
	});
}

exports.names = function( req, res )
{
	var client = new pg.Client( conn );
	client.connect();

	var year = req.params.year,
		word = req.params.word;
		
	var q = "SELECT array_agg( gid ) as gid, namecomple FROM ( SELECT gid, namecomple FROM basepoint WHERE namecomple ILIKE '%" + word + "%' UNION SELECT gid, namecomple FROM baseline WHERE namecomple ILIKE '%" + word + "%' UNION SELECT gid, namecomple FROM basepoly WHERE namecomple ILIKE '%" + word + "%' ) as q GROUP BY namecomple";
	
	var query = client.query( q ),
		names = {};
	
	query.on( 'row', function( result )
	{
		names[ result.namecomple ] = result.gid;
	});
	
	query.on( 'end', function()
	{
		res.send( names );
		client.end();
	});
}
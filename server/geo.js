var pg = require( 'pg' ),
	postgeo = require( 'postgeo' ),
	_ = require( 'underscore' ),
	conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/rio";

exports.probe = function( req, res )
{
	var client = new pg.Client( conn );
	client.connect();
	
	var year = req.params.year,
		coords = req.params.coords,
		radius = req.params.radius / 1000,
		results = [];
	
	var query = client.query( "SELECT array_agg( id ) AS id, name, layer FROM ( SELECT globalid AS id, namecomple AS name, layer, geom FROM baseline WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT globalid AS id, namecomple AS name, layer, geom FROM basepoly WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT globalid AS id, namecomple AS name, layer, geom FROM basepoint WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " ORDER BY layer ) as q WHERE ST_DWithin( geom, ST_SetSRID( ST_MakePoint( " + coords + " ), 4326 ), " + radius + " ) GROUP BY name, layer ORDER BY layer" );
	
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
	
	postgeo.query( "SELECT id, ST_AsGeoJSON( geom ) AS geometry FROM ( SELECT globalid AS ID, geom FROM baseline WHERE globalid = " + id + " UNION SELECT globalid AS ID, geom FROM basepoly WHERE globalid = " + id + " UNION SELECT globalid AS ID, geom FROM basepoint WHERE globalid = " + id + " ) AS q", "geojson", function( data )
	{
		if( data.features[ 0 ].geometry.type == "Point" )
		{
			var coords = data.features[ 0 ].geometry.coordinates.join( " " ),
				id = data.features[ 0 ].properties.id;
			postgeo.query( "SELECT '" + id + "' AS id, ST_AsGeoJSON( ST_Buffer( ST_GeomFromText( 'POINT(" + coords + ")' ), 0.0005 ) ) AS geometry", "geojson", function( data )
			{
				res.send( data );
			});
		}
		else
		{
			res.send( data );
		}
	});
}

exports.visual = function( req, res )
{
	postgeo.connect( conn );
	
	var year = req.params.year;
	
	postgeo.query( "SELECT imageid AS id, firstdispl || ' - ' || lastdispla AS date, creator, imageviewd AS description, ST_AsGeoJSON( ST_Collect( ST_SetSRID( ST_MakePoint( longitude, latitude ), 4326 ), geom ) ) AS geometry FROM visualpoly WHERE layer = 'ImageViewshedsPoly' AND firstdispl <= " + year + " AND lastdispla >= " + year, "geojson", function( data )
	{
		res.send( data );
	});
}

exports.plan = function( req, res )
{
	postgeo.connect( conn );
	
	var plan = decodeURI( req.params.name );
	
	postgeo.query( "SELECT globalid AS id, namecomple AS name, ST_AsGeoJSON( geom ) AS geometry FROM plannedline WHERE planname = '" + plan + "' UNION SELECT globalid AS id, namecomple AS name, ST_AsGeoJSON( geom ) AS geometry FROM plannedpoly WHERE planname = '" + plan + "'", "geojson", function( data )
	{
		res.send( data );
	});
}

exports.feature = function( req, res )
{
	postgeo.connect( conn );
	
	var year = req.params.year,
		id = req.params.id;
	
	postgeo.query( "SELECT ST_AsGeoJSON( geom ) AS geometry FROM ( SELECT geom FROM baseline WHERE featuretyp = '" + id + "' AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT geom FROM basepoly WHERE featuretyp = '" + id + "' AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT geom FROM basepoint WHERE featuretyp = '" + id + "' AND firstdispl <= " + year + " AND lastdispla >= " + year + " ) AS q", "geojson", function( data )
	{
		res.send( data );
	});
}
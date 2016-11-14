var pg = require( 'pg' ),
	postgeo = require( 'postgeo' ),
	_ = require( 'underscore' ),
	db = require( './db' ),
	dev = require( './dev' );

exports.probe = function( req, res ){
	var client = new pg.Client( db.conn );
	client.connect();
	
	var year = req.params.year,
			coords = req.params.coords,
			radius = req.params.radius / 1000,
			layers = req.params.layers,
			results = [],
			q = dev.checkQuery( "SELECT array_agg( id ) AS id, name, layer FROM ( SELECT globalid AS id, namecomple AS name, layer, geom FROM baseline WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT globalid AS id, namecomple AS name, layer, geom FROM basepoly WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT globalid AS id, namecomple AS name, layer, geom FROM basepoint WHERE namecomple IS NOT NULL AND firstdispl <= " + year + " AND lastdispla >= " + year + " ORDER BY layer ) as q WHERE ST_DWithin( geom, ST_SetSRID( ST_MakePoint( " + coords + " ), 4326 ), " + radius + " ) GROUP BY name, layer ORDER BY layer", req );
	
	var query = client.query( q );
	
	query.on( 'row', function( result ){
		if( layers === undefined || layers.indexOf( result.grouping ) == -1 ) results.push( _.omit( result, 'grouping' ) );
	});
	
	query.on( 'end', function(){
		res.send( results );
		client.end();
	});
}

exports.draw = function( req, res ){
	postgeo.connect( db.conn );
	
	var id = req.params.id,
	    year = req.params.year,
	    q = dev.checkQuery( "SELECT name, ST_AsGeoJSON( geom ) AS geometry FROM ( SELECT name, ST_Union( geom ) AS geom FROM ( SELECT namecomple AS name, geom FROM baseline WHERE namecomple = '" + id + "' AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT namecomple AS name, geom FROM basepoly WHERE namecomple = '" + id + "' AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT namecomple AS name, geom FROM basepoint WHERE namecomple = '" + id + "' AND firstdispl <= " + year + " AND lastdispla >= " + year + " ) AS q GROUP BY name ) AS q1", req );
	
	postgeo.query( q, "geojson", function( data ){
		if( data.features[ 0 ].geometry.type == "Point" ){
			var coords = data.features[ 0 ].geometry.coordinates.join( " " ),
				  id = data.features[ 0 ].properties.id;
			
			postgeo.query( "SELECT '" + id + "' AS id, ST_AsGeoJSON( ST_Buffer( ST_GeomFromText( 'POINT(" + coords + ")' ), 0.0005 ) ) AS geometry", "geojson", function( data ){
				res.send( data );
			});
		}
		else if( data.features[ 0 ].geometry.type == "MultiLineString" ){
  		var client = new pg.Client( db.conn );
      client.connect();
      
      var query = client.query( "SELECT ST_AsGeoJSON( ST_LineMerge( ST_GeomFromGeoJSON( '" + JSON.stringify( data.features[ 0 ].geometry ) + "' ) ) ) AS geom" );
    		
      query.on( 'row', function( results ){
        data.features[ 0 ].geometry = JSON.parse( results.geom );
      });
    		
      query.on( 'end', function(){
        res.send( data );
      });
		} else {
      res.send( data );
		}
	});
}

exports.visual = function( req, res ){
	postgeo.connect( db.conn );
	
	var year = req.params.year,
			q = dev.checkQuery( "SELECT imageid AS id, firstdispl || ' - ' || lastdispla AS date, creator, title AS description, ST_AsGeoJSON( ST_Collect( ST_SetSRID( ST_MakePoint( longitude, latitude ), 4326 ), geom ) ) AS geometry FROM viewsheds WHERE firstdispl <= " + year + " AND lastdispla >= " + year, req );
	
	postgeo.query( q, "geojson", function( data ){
		res.send( data );
	});
}

exports.plan = function( req, res ){
	postgeo.connect( db.conn );
	
	var plan = decodeURI( req.params.name ),
			q = dev.checkQuery( "SELECT globalid AS id, namecomple AS name, ST_AsGeoJSON( geom ) AS geometry FROM plannedline WHERE planname = '" + plan + "' UNION SELECT globalid AS id, namecomple AS name, ST_AsGeoJSON( geom ) AS geometry FROM plannedpoly WHERE planname = '" + plan + "'", req )
	
	postgeo.query( q, "geojson", function( data ){
		res.send( data );
	});
}

exports.feature = function( req, res ){
	postgeo.connect( db.conn );
	
	var year = req.params.year,
			id = req.params.id,
			q = dev.checkQuery( "SELECT ST_AsGeoJSON( geom ) AS geometry FROM ( SELECT geom FROM baseline WHERE featuretyp = '" + id + "' AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT geom FROM basepoly WHERE featuretyp = '" + id + "' AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT geom FROM basepoint WHERE featuretyp = '" + id + "' AND firstdispl <= " + year + " AND lastdispla >= " + year + " ) AS q", req );
	
	postgeo.query( q, "geojson", function( data ){
		res.send( data );
	});
}
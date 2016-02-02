var pg = require( 'pg' ),
	_ = require( 'underscore' ),
	conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/rio";
	
_.mixin({
  // ### _.objMap
  // _.map for objects, keeps key/value associations
  objMap: function (input, mapper, context) {
    return _.reduce(input, function (obj, v, k) {
             obj[k] = mapper.call(context, v, k, input);
             return obj;
           }, {}, context);
  },
  // ### _.objFilter
  // _.filter for objects, keeps key/value associations
  // but only includes the properties that pass test().
  objFilter: function (input, test, context) {
    return _.reduce(input, function (obj, v, k) {
             if (test.call(context, v, k, input)) {
               obj[k] = v;
             }
             return obj;
           }, {}, context);
  }
});
	
exports.timeline = function( req, res )
{
	if( req.headers.host.match( /-dev/ ) ) conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/riodev";
	var client = new pg.Client( conn );
	client.connect();
	
	var years = [];
	
	var query = client.query( "SELECT * FROM ( SELECT firstdispl AS year FROM basepoint UNION SELECT lastdispla AS year FROM basepoint UNION SELECT firstdispl AS year FROM baseline UNION SELECT lastdispla AS year FROM baseline UNION SELECT firstdispl AS year FROM basepoly UNION SELECT lastdispla AS year FROM basepoly UNION SELECT firstdispl AS year FROM mapsplans UNION SELECT lastdispla AS year FROM mapsplans UNION SELECT firstdispl AS year FROM viewsheds UNION SELECT lastdispla AS year FROM viewsheds ) as q ORDER BY year" );
	
	query.on( 'row', function( result )
	{
		if( result.year > 0 ) years.push( result.year );
	});
	
	query.on( 'end', function()
	{
		years.pop();
		res.send( years );
		client.end();
	});
}

exports.layers = function( req, res )
{
	if( req.headers.host.match( /-dev/ ) ) conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/riodev";
	var client = new pg.Client( conn );
	client.connect();

	var year = req.params.year;	
	var q = "SELECT folder, geo.layer, geo.featuretyp, geo.stylename, fill, stroke, shape FROM ( SELECT layer, featuretyp, stylename FROM baseline WHERE firstdispl <= " + year + " AND lastdispla >= " + year + " GROUP BY layer, featuretyp, stylename  UNION SELECT layer, featuretyp, stylename FROM basepoint WHERE firstdispl <= " + year + " AND lastdispla >= " + year + " GROUP BY layer, featuretyp, stylename  UNION SELECT layer, featuretyp, stylename FROM basepoly WHERE firstdispl <= " + year + " AND lastdispla >= " + year + " GROUP BY layer, featuretyp, stylename ) AS geo INNER JOIN legend2 ON geo.stylename = legend2.stylename INNER JOIN layers ON geo.layer = layers.layer AND geo.featuretyp = layers.featuretyp WHERE geo.featuretyp IS NOT NULL ORDER BY sort";
	
	var query = client.query( q ),
		arr = [],
		layers = {};
	query.on( 'row', function( result ){
		arr.push( result );
	});
	
	query.on( 'end', function(){
		_.each( arr, function( val ){
			if( !layers[ val.folder ] ) layers[ val.folder ] = {};
			if( !layers[ val.folder ][ val.layer ] ){
				layers[ val.folder ][ val.layer ] = {};
				layers[ val.folder ][ val.layer ].id = val.stylename;
				layers[ val.folder ][ val.layer ].features = [];
			}
			
			if( val.shape ) layers[ val.folder ][ val.layer ].style = { fill : val.fill, stroke : val.stroke, shape : val.shape };
			if( val.featuretyp ) layers[ val.folder ][ val.layer ].features.push( val.featuretyp );
		});
		
		res.send( layers );
		client.end();
	});
}

exports.raster = function( req, res )
{
	if( req.headers.host.match( /-dev/ ) ) conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/riodev";
	var client = new pg.Client( conn );
	client.connect();

	var year = req.params.year,
		q = "SELECT imageid AS id, 'SSID' || globalid AS file, firstdispl AS date, creator, title AS description, layer FROM mapsplans WHERE firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT imageid AS id, 'SSID' || globalid AS file, firstdispl AS date, creator, title AS description, layer FROM viewsheds WHERE firstdispl <= " + year + " AND lastdispla >= " + year + " ORDER BY layer";
	
	var query = client.query( q ),
		arr = [];
	
	query.on( 'row', function( result )
	{
		arr.push( result );
	});
	
	query.on( 'end', function()
	{
		res.send( arr );
		client.end();
	});
}

exports.search = function( req, res )
{
	if( req.headers.host.match( /-dev/ ) ) conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/riodev";
	var client = new pg.Client( conn );
	client.connect();

	var year = req.params.year,
		word = req.params.word;
		
	var q = "SELECT array_agg( id ) as gid, namecomple, layer FROM ( SELECT globalid AS id, namecomple, layer FROM basepoint WHERE namecomple ILIKE '%" + word + "%' AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT globalid AS id, namecomple, layer FROM baseline WHERE namecomple ILIKE '%" + word + "%' AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT globalid AS id, namecomple, layer FROM basepoly WHERE namecomple ILIKE '%" + word + "%' AND firstdispl <= " + year + " AND lastdispla >= " + year + " ) as q GROUP BY namecomple, layer ORDER BY layer LIMIT 5";
	
	var query = client.query( q ),
		names = {};
	
	query.on( 'row', function( result )
	{
		names[ result.namecomple ] = { id : result.gid, layer : result.layer };
	});
	
	query.on( 'end', function()
	{
		res.send( names );
		client.end();
	});
}

exports.plans = function( req, res )
{
	if( req.headers.host.match( /-dev/ ) ) conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/riodev";
	var client = new pg.Client( conn );
	client.connect();
	
	var plans = [];
	
	var query = client.query( "SELECT planyear, planname FROM plannedline UNION SELECT planyear, planname FROM plannedpoly" );
	
	query.on( 'row', function( result )
	{
		plans.push( result );
	});
	
	query.on( 'end', function()
	{
		plans = _.sortBy( plans, function( n ){ return parseInt( n.planyear.replace( /[^0-9].*/gi, "" ) ) } ); 
		res.send( plans );
		client.end();
	});
}

exports.details = function( req, res )
{
	if( req.headers.host.match( /-dev/ ) ) conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/riodev";
	var client = new pg.Client( conn );
	client.connect();
		
	var id = _.reduce( req.params.id.split( "," ), function( memo, i ){ return memo += "'" + i + "',"; }, "ANY(ARRAY[" ).replace( /,$/, "])" ),
		details = [];
	
	var query = client.query( "SELECT creator, firstowner, owner, occupant, address, firstdispl, lastdispla, globalid FROM basepoint WHERE globalid = " + id + " UNION SELECT creator, firstowner, owner, occupant, address, firstdispl, lastdispla, globalid FROM baseline WHERE globalid = " + id + " UNION SELECT creator, firstowner, owner, occupant, address, firstdispl, lastdispla, globalid FROM basepoly WHERE globalid = " + id );
	
	query.on( 'row', function( result )
	{
		if( result.lastdispla == 8888 ) result.lastdispla = 'Present';
		result.year = result.firstdispl + " - " + result.lastdispla;
		result = _.objFilter( _.omit( result, [ "globalid", "firstdispl", "lastdispla", ] ), function( value )
		{
			return value != null;
		});
		details.push( result );
	});
	
	query.on( 'end', function()
	{
		res.send( details );
		client.end();
	});
}
exports.names = function( req, res )
{
	if( req.headers.host.match( /-dev/ ) ) conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/riodev";
	var client = new pg.Client( conn );
	client.connect();
	
	var names = {},
		lang = req.params.lang;
	
	var query = client.query( "SELECT text, name_en, name_pr FROM names" );
	
	query.on( 'row', function( result )
	{
		names[ result.text ] = result[ "name_" + lang ];
	});
	
	query.on( 'end', function()
	{
		res.send( names );
		client.end();
	});
}

exports.save = function( req, res )
{
	var b64string = req.body.imgdata.replace( " ", "+" );
	var buf = new Buffer( b64string, 'base64' );
	
	res.setHeader( 'Content-type', 'image/png' );
	res.setHeader( 'Content-Disposition', 'attachment; filename="' + req.body.name + '"' );
	res.send( buf );
}

var pg = require( 'pg' ),
	_ = require( 'underscore' ),
	conn = "postgres://axismaps:U6glEdd0igS2@rio2.c1juezxtnbot.us-west-2.rds.amazonaws.com/rio";
	
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

exports.search = function( req, res )
{
	var client = new pg.Client( conn );
	client.connect();

	var year = req.params.year,
		word = req.params.word;
		
	var q = "SELECT array_agg( id ) as gid, namecomple FROM ( SELECT globalidco AS id, namecomple FROM basepoint WHERE namecomple ILIKE '%" + word + "%' AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT globalidco AS id, namecomple FROM baseline WHERE namecomple ILIKE '%" + word + "%' AND firstdispl <= " + year + " AND lastdispla >= " + year + " UNION SELECT globalidco AS id, namecomple FROM basepoly WHERE namecomple ILIKE '%" + word + "%' AND firstdispl <= " + year + " AND lastdispla >= " + year + " ) as q GROUP BY namecomple LIMIT 5";
	
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

exports.plans = function( req, res )
{
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
	var client = new pg.Client( conn );
	client.connect();
		
	var id = _.reduce( req.params.id.split( "," ), function( memo, i ){ return memo += "'" + i + "',"; }, "ANY(ARRAY[" ).replace( /,$/, "])" ),
		details = [];
	
	var query = client.query( "SELECT * FROM ( SELECT yearfirstd, yearlastdo, globalidco FROM basepoint WHERE globalidco = " + id + " UNION SELECT yearfirstd, yearlastdo, globalidco FROM baseline WHERE globalidco = " + id + " UNION SELECT yearfirstd, yearlastdo, globalidco FROM basepoly WHERE globalidco = " + id + ") AS q LEFT OUTER JOIN details AS d ON q.globalidco = d.globalidco" );
	
	query.on( 'row', function( result )
	{
		result.year = result.yearfirstd + " - " + result.yearlastdo;
		result = _.objFilter( _.omit( result, [ "globalidco", "yearfirstd", "yearlastdo" ] ), function( value )
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
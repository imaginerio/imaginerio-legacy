var pg = require( 'pg' ),
	_ = require( 'underscore' ),
	conn = "postgres://pg_query_user:U6glEdd0igS2@localhost/rio",
	tables = [ "basepoly", "baseline", "basepoint" ],
	cache = [];
	
var client = new pg.Client( conn );
client.connect();

clean_cache( tables.pop() )

function clean_cache( table )
{
	console.log( "- Cleaning " + table + ":" );
	var query = client.query(
		"SELECT \
			MIN( firstdispl ) AS first, \
			MAX( lastdispla ) AS last, \
			COALESCE( id, 'base' ) AS id \
		FROM " + table + " AS t \
		INNER JOIN legend \
			ON t.layer = legend.layer \
		WHERE gid NOT IN ( \
			SELECT gid \
			FROM " + table + " AS t1 \
			INNER JOIN ( \
				SELECT \
					globalidco, \
					MAX (uploaddate) AS maxdate \
				FROM " + table + " \
				GROUP BY globalidco \
			) AS q \
				ON t1.globalidco = q.globalidco \
					AND t1.uploaddate = q.maxdate \
		) \
		OR uploaddate > ( \
			SELECT MAX (uploaddate) \
			FROM uploads \
		) \
		GROUP BY id"
	);
	
	query.on( 'row', function( result )
	{
		cache.push( result );
		console.log( "    Found changes in " + result.id + ": " + result.first + " - " + result.last );
	});
	query.on( 'end', function( result )
	{
		delete_records( table );
	});
}

function delete_records( table )
{
	var query = client.query(
		"DELETE FROM " + table + " \
		WHERE gid NOT IN ( \
			SELECT gid \
			FROM " + table + " AS t \
			INNER JOIN ( \
				SELECT \
					globalidco, \
					MAX (uploaddate) AS maxdate \
				FROM " + table + " \
				GROUP BY globalidco \
			) AS q \
				ON t.globalidco = q.globalidco \
					AND t.uploaddate = q.maxdate \
		) \
			OR uploaddate = 99999999"
	);
	
	query.on( 'end', function( result )
	{
		console.log( "    Deleted " + result.rowCount + " rows from " + table );
		if( tables.length > 0 )
		{
			clean_cache( tables.pop() );
		}
		else
		{
			console.log( "- Cleaning tile cache:" );
			empty_cache( cache.pop() );
		}
	});
}

function empty_cache( row )
{
	var q = "DELETE FROM cache WHERE layer";
	q += row.id == 'base' ? " = 'base'" : " NOT LIKE '%" + row.id + "%' AND layer != 'base'";
	q += " AND year >= " + row.first + " AND year <= " + row.last;
	
	var query = client.query( q );
	
	query.on( 'end', function( result )
	{
		console.log( "    Removed " + result.rowCount + " tiles from cache" );
		if( cache.length > 0 )
		{
			empty_cache( cache.pop() );
		}
		else
		{
			update_upload();
		}
	});
}

function update_upload()
{
	var date = new Date(),
		num = parseInt( date.getFullYear().toString() + ( "0" + ( date.getMonth() + 1 ) ).slice( -2 )  + ( "0" + date.getDate() ).slice( -2 ) );
		
	var query = client.query( "INSERT INTO uploads VALUES ( " + num + " )" );
	
	query.on( 'end', function( result )
	{
		console.log( " " );
		console.log( "**PROCESS COMPLETE**" );
		client.end();
	});
}
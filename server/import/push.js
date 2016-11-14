var pg = require( 'pg' ),
		_ = require( 'underscore' ),
    chalk = require( 'chalk' );
    	
exports.pushDB = function( client ){
  getTables( client, copyDev );
}

exports.pullDB = function( client ){
	getTables( client, copyLive );
}

function getTables( client, callback ){
	var tables = [];
  
  console.log( "Getting information about " + chalk.yellow( "development" ) + " tables" );
  
  var query = client.query( "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%_dev'" );
  
	query.on( 'row', function( result ){
		tables.push( result.table_name );
	});

  query.on( 'error', function( error ){
		console.log( error );
		resetDB( client, tables, '' );
  });
  
  query.on( 'end', function(){
		callback( client, tables );
	});
}

function copyDev( client, tables ){
	var q = _.reduce( tables, function( q, t ){
		var name = t.replace( /_dev$/, '' );
		  return q += "ALTER TABLE " + name + " RENAME TO " + name + "_old; ";
	}, "BEGIN; " ) + "COMMIT;";
	  
	console.log( chalk.green( "Backing up" ) + " live tables" );
	  
	var query = client.query( q );
	  
  query.on( 'error', function( error ){
	  console.log( error );
	  resetDB( client, tables, '' );
  });
	  
	query.on( 'end', function(){
		var q = _.reduce( tables, function( q, t ){
			var name = t.replace( /_dev$/, '' );
			return q += "CREATE TABLE " + name + " ( LIKE " + t + " INCLUDING ALL ); INSERT INTO " + name + " SELECT * FROM " + t + "; ";
		  }, "BEGIN; " ) + "COMMIT;";
		  
		console.log( chalk.green( "Copying" ) + " development tables to live" );
		  
		var query = client.query( q );
		  
		query.on( 'error', function( error ){
			console.log( error );
			resetDB( client, tables, '' );
		});
		  
		query.on( 'end', function(){
			var q = _.reduce( tables, function( q, t ){
				var name = t.replace( /_dev$/, '_old' );
				return q += "DROP TABLE " + name + "; ";
			}, "BEGIN; " ) + "TRUNCATE cache; COMMIT;";
			  
			var query = client.query( q );
			  
			console.log( "Tile cache " + chalk.green( "successfully cleared." ) );
      client.end();
		});
	})
}

function copyLive( client, tables ){
	var q = _.reduce( tables, function( q, t ){
		var name = t.replace( /_dev$/, '' );
		  return q += "ALTER TABLE " + t + " RENAME TO " + name + "_old; ";
	}, "BEGIN; " ) + "COMMIT;";
	  
	console.log( chalk.green( "Backing up" ) + " live tables" );
	  
	var query = client.query( q );
	  
  query.on( 'error', function( error ){
	  console.log( error );
	  resetDB( client, tables, '' );
  });
	  
	query.on( 'end', function(){
		var q = _.reduce( tables, function( q, t ){
			var name = t.replace( /_dev$/, '' );
			return q += "CREATE TABLE " + t + " ( LIKE " + name + " INCLUDING ALL ); INSERT INTO " + t + " SELECT * FROM " + name + "; ";
		  }, "BEGIN; " ) + "COMMIT;";
		  
		console.log( chalk.green( "Copying" ) + " development tables to live" );
		  
		var query = client.query( q );
		  
		query.on( 'error', function( error ){
			console.log( error );
			resetDB( client, tables, '' );
		});
		  
		query.on( 'end', function(){
			var q = _.reduce( tables, function( q, t ){
				var name = t.replace( /_dev$/, '_old' );
				return q += "DROP TABLE " + name + "; ";
			}, "BEGIN; " ) + "COMMIT;";
			  
			var query = client.query( q );
			  
			console.log( "Development database " + chalk.green( "successfully reset." ) );
      client.end();
		});
	})
}

function resetDB( client, tables, suffix ){
	var q = _.reduce( tables, function( q, t ){
	  var old = t.replace( /_dev$/, '_old' );
	  var name = t.replace( /_dev$/, suffix );
	  return q += "ALTER TABLE " + old + " RENAME TO " + name + "; ";
  }, "BEGIN; " ) + "COMMIT;";
  
  var query = client.query( q );
  
  query.on( 'end', function(){
	  console.log( chalk.red( "ERROR DETECTED: " ) + "Tables have been reset" );
	  client.end();
  })
}

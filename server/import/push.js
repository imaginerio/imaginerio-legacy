var pg = require( 'pg' ),
    sys = require( 'sys' ),
    exec = require( 'child_process' ).exec,
    db = require( './db' ),
    chalk = require( 'chalk' );
    	
exports.copyDB = function( to, from ){
  var pushClient = new pg.Client( db.conn + from );
  pushClient.connect();
  
  console.log( "Dumping " + chalk.green( from ) + " database structure and data..." );
  exec( "pg_dump " + from + " | gzip > " + from + ".gz", function ( error, stdout, stderr ){
    if( error !== null ){
      	console.log( chalk.red( "ERROR: " ) + error );
    }
    else{
      console.log( "Dropping database connections to " + chalk.green( to ) + "...");
  
      var query = pushClient.query( "UPDATE pg_database SET datallowconn = 'false' WHERE datname = '" + to + "'; SELECT pg_terminate_backend( pid ) FROM pg_stat_activity WHERE datname = '" + to + "';" );
      
      query.on( 'error', function( error ){
        console.log( error );
        client.end();
      });
      
      query.on( 'end', function(){
        console.log( "Dropping " + chalk.green( to ) + " database..." );
        	var query = pushClient.query( "DROP DATABASE " + to );
        	
        	query.on( 'error', function( error ){
          console.log( error );
          pushClient.end();
        });
        	
        	query.on( 'end', function(){
          console.log( "Creating empty " + chalk.green( to ) + " database..." );
          exec( "createdb -T template0 " + to, function( error, stdout, stderr ){
            	if( error !== null ){
              console.log( chalk.red( "ERROR: " ) + error );
              pushClient.end();
            }
            else{
              console.log( "Restoring data..." );
              exec( "gunzip -c " + from + ".gz | psql " + to, function( error, stdout, stderr ){
                	if( error !== null ){
                  console.log( chalk.red( "ERROR: " ) + error );
                  pushClient.end();
                }
                else{
                  console.log( "Database " + chalk.green( from ) + " successfully copied to " + chalk.yellow( to ) );
                  exec( 'psql -d ' + to + ' -c "TRUNCATE cache;"', function( error, stdout, stderr ){
                    if( error !== null ){
                      console.log( chalk.red( "ERROR: " ) + error );
                      pushClient.end();
                    }
                    else {
                      console.log( "Tile cache " + chalk.green( "successfully cleared." ) );
                      pushClient.end();
                    }
                  });
                }
              });
            }
          });
        });
      });
    }
  });
}
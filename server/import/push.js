var sys = require( 'sys' ),
    	exec = require( 'child_process' ).exec,
    	chalk = require( 'chalk' );
    	
exports.copyDB = function( client, to, from ){
  console.log( "Dumping " + chalk.green( from ) + " database structure and data..." );
  exec( "pg_dump " + from + " | gzip > " + from + ".gz", function ( error, stdout, stderr ){
    if( error !== null ){
      	console.log( chalk.red( "ERROR: " ) + error );
    }
    else{
      console.log( "Dropping database connections to " + chalk.green( to ) + "...");
  
      var query = client.query( "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'TARGET_DB' AND pid <> pg_backend_pid();" );
      
      query.on( 'error', function( error ){
        console.log( error );
        client.end();
      });

      console.log( "Dropping " + chalk.green( to ) + " database..." );
      	exec( "dropdb " + to, function( error, stdout, stderr ){
        	if( error !== null ){
          console.log( chalk.red( "ERROR: " ) + error );
          client.end();
        }
        else{
          console.log( "Creating empty " + chalk.green( to ) + " database..." );
          exec( "createdb " + to, function( error, stdout, stderr ){
            	if( error !== null ){
              console.log( chalk.red( "ERROR: " ) + error );
              client.end();
            }
            else{
              console.log( "Restoring data..." );
              exec( "gunzip -c " + from + ".gz | psql " + to, function( error, stdout, stderr ){
                	if( error !== null ){
                  console.log( chalk.red( "ERROR: " ) + error );
                  client.end();
                }
                else{
                  console.log( "Database " + chalk.green( from ) + " successfully copied to " + chalk.yellow( to ) );
                  client.end();
                }
              });
            }
          });
        }
      });
    }
  });
}
#!/usr/bin/env node

var pg = require( 'pg' ),
    _ = require( 'underscore' ),
    fs = require( 'fs' ),
    async = require( 'async' ),
    conn = "postgres://pg_power_user:XfAfooM4zUD8HG@localhost/rio",
    inquirer = require( 'inquirer' ),
    chalk = require( 'chalk' ),
    shapefile  = require( 'shapefile' ),
    questions = require( './questions' );
    
_.mixin({
  // ### _.objMap
  // _.map for objects, keeps key/value associations
  objMap: function (input, mapper, context) {
    return _.reduce(input, function (obj, v, k) {
             obj[k] = mapper.call(context, v, k, input);
             return obj;
           }, {}, context);
  }
});

var testFile = function( client, ans, callback ) {
  try {
    // Query the entry
    stats = fs.lstatSync( ans.file + ".shp" );
  }
  catch( e ) {
    callback( ans.file + ".shp does not exist", client );
  }
  callback( null, client, ans );
};

var testLayer = function( client, ans, callback ) {
  var count = 0,
      query = client.query( "SELECT COUNT(*) FROM " + ans.geom + " WHERE layer = '" + ans.layer + "'" );
  
  query.on( 'row', function( result ){
		count = result.count;
	});
	
	query.on( 'error', function( error ) {
  	  callback( error, client );
	})
	
	query.on( 'end', function(){
		if( count > 0 ) {
  		  callback( null, client, ans, count );
		}
		else {
  		  callback( "Layer " + ans.layer + " not found in " + ans.geom, client );
		}
	});
}

var deleteLayer = function( client, ans, count, callback ) {
  var query = client.query( "DELETE FROM " + ans.geom + " WHERE layer = '" + ans.layer + "'" );
  
  query.on( 'error', function( error ) {
    callback( error, client );
  });
  
  query.on( 'end', function() {
    console.log( chalk.green( count ) + " records removed from the database" );
    callback( null, client, ans );
  });
}

var newLayer = function( client, ans, callback ) {
  var reader = shapefile.reader( ans.file ),
      count = { success : 0, error : 0 };
      
  reader.readHeader( function( error, header ) {
    if( error ) {
      callback( error, client );
    }
    else {
      reader.readRecord( recordReader )
    }
  })
  
  var recordReader = function( error, record ) {
    if( record == shapefile.end ) {
      console.log( chalk.green( count.success ) + " records were imported into the database" );
      if( count.error > 0 ) {
        console.log( chalk.red( count.error ) + " records were not imported due to errors" );
      }
      callback( null, client );
    }
    else if( recordTest( record.properties ) ) {
      addRecord( record, reader, ans, client, callback );
    }
    else{
      console.log( record.properties );
      count.error++;
      reader.readRecord( recordReader );
    }
  }
  
  var recordTest = function( props ) {
    if( props.FirstDispl < 1500 || props.LastDispla < 1500 ) return false;
    if( ( props.FirstDispl > new Date().getFullYear() && props.FirstDispl != 8888 ) || ( props.LastDispla > new Date().getFullYear() && props.LastDispla != 8888 ) ) return false;
    if( props.FirstDisplay > props.LastDispla ) return false;
    return true;
  }
  
  var processRecord = function( value ) {
    if( typeof value == "string" ) {
      return "'" + value.replace( /'/g, "''" ) + "'";
    }
    return value;
  }
  
  var addRecord = function( record, reader, ans, client, callback ){
    var date = new Date(),
    			num = parseInt( date.getFullYear().toString() + ( "0" + ( date.getMonth() + 1 ) ).slice( -2 )  + ( "0" + date.getDate() ).slice( -2 ) ),
    			props = _.objMap( record.properties, processRecord );
    
    var q = "INSERT INTO " + ans.geom + " (featuretyp, namecomple, nameshort, yearlastdo, firstdispl, lastdispla, notes, creator, firstowner, owner, occupant, address, geom, uploaddate, globalid, layer) VALUES ( " + props.FeatureTyp + ", " + props.NameComple + ", " + props.NameShort + ", " + props.YearLastDo + ", " + props.FirstDispl + ", " + props.LastDispla + ", " + props.Notes + ", " + props.Creator + ", " + props.FirstOwner + ", " + props.Owner + ", " + props.Occupant + ", " + props.Address + ", ST_GeomFromGeoJSON('" + JSON.stringify( record.geometry ) + "'), " + num + ", 'missing-id', '" + ans.layer + "')";

    var query = client.query( q );
    
    query.on( 'error', function( error ) {
      console.log( q ); //Remove this when finished debugging
      callback( error, client );
    });
    
    query.on( 'end', function() {
      count.success++;
      reader.readRecord( recordReader );
    });
  }
}

var waterfallExit = function( err, client ) {
  if( err ) console.log( chalk.red( "ERROR: " ) + err );
  client.end();
}

//result function sequences
var replaceSeq = function( ans, client ) {
      async.waterfall([
          function( callback ) {
            callback( null, client, ans );
          },
          testFile,
          testLayer,
          deleteLayer,
          newLayer
        ],
        waterfallExit
      );
    }
    newSeq = function( ans, client ) {
      async.waterfall([
          function( callback ) {
            callback( null, client, ans );
          },
          testFile,
          newLayer
        ],
        waterfallExit
      );
    },
    deleteSeq = function( ans, client ) {
      async.waterfall([
          function( callback ) {
            callback( null, client, ans );
          },
          testLayer,
          deleteLayer
        ],
        waterfallExit
      );
    },
    pushDB = function( ans ) {
      
    },
    pullDB = function( ans ) {
      
    },
    tasks = {
      'replace' : replaceSeq,
      'new' : newSeq,
      'delete' : deleteSeq,
      'push' : pushDB,
      'pull' : pullDB
    };

inquirer.prompt( questions.q, function( ans ) {
  if( ans.confirm ){
    var client = new pg.Client( conn );
    client.connect();
    tasks[ ans.task ]( ans, client );
  }
});

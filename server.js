var express = require( 'express' ),
    meta = require( './server/meta' ),
    geo = require( './server/geo' );

var app = express();

app.get( '/timeline', meta.timeline );
app.get( '/layers/:year', meta.layers );
//app.get( '/countries/:id/polygon', geo.polygon);
//app.get( '/countries/:id/polygon/:srid', geo.polygonSrid);

app.listen( 3000 );
console.log( 'Listening on port 3000...' );
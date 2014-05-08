var express = require( 'express' ),
    meta = require( './server/meta' ),
    geo = require( './server/geo' );

var app = express();

app.get( '/timeline', meta.timeline );
app.get( '/layers/:year', meta.layers );
app.get( '/names/:year/:word', meta.names );
app.get( '/mapnik', geo.mapnik_test );

app.listen( 3000 );
console.log( 'Listening on port 3000...' );

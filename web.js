var express = require( 'express' ),
	logfmt = require( 'logfmt' ),
    meta = require( './server/meta' ),
    geo = require( './server/geo' );

var app = express();
app.use( logfmt.requestLogger() );

app.get( '/timeline', meta.timeline );
app.get( '/layers/:year', meta.layers );
app.get( '/names/:year/:word', meta.names );
app.get( '/mapnik', geo.mapnik );

var port = Number( process.env.PORT || 5000 );
app.listen( port, function()
{
  console.log( "Listening on " + port );
});
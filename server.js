var express = require( 'express' ),
	  bodyParser = require( 'body-parser' ),
	  http = require( 'http' ),
    meta = require( './server/meta' ),
    geo = require( './server/geo' ),
    download = require( './server/mapnik/export' );

var app = express();

app.use( function( req, res, next )
{

    // Website you wish to allow to connect
    res.setHeader( 'Access-Control-Allow-Origin', '*' );

    // Request methods you wish to allow
    //res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    //res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    //res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use( function(err, req, res, next) {
  console.error(err.stack);
  next(err);
});

app.use( function(err, req, res, next) {
  if (req.xhr) {
    res.send(500, { error: 'Something blew up!' });
  } else {
    next(err);
  }
});

app.use( function(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
});

//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit: 10000000}));

app.get( '/timeline', meta.timeline );
app.get( '/layers/:year', meta.layers );
app.get( '/search/:year/:word', meta.search );
app.get( '/probe/:year/:radius/:coords/:layers?', geo.probe );
app.get( '/draw/:year/:id', geo.draw );
app.get( '/visual/:year', geo.visual );
app.get( '/raster/:year', meta.raster );
app.get( '/plans', meta.plans );
app.get( '/plan/:name', geo.plan );
app.get( '/details/:id', meta.details );
app.get( '/names/:lang', meta.names );
app.get( '/feature/:year/:id', geo.feature );
app.get( '/export/:lang/:year/:layer/:raster/:bounds/', download.exportMap )


app.listen( 3000 );
console.log( 'Listening on port 3000...' );

//http.createServer( urlRedirect ).listen( 80 );

function urlRedirect( req, res ){
  res.writeHead(302, {
    'Location': 'http://imaginerio.org'
  });
  res.end();
}

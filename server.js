var express = require( 'express' ),
    meta = require( './server/meta' ),
    geo = require( './server/geo' );

var app = express();

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader( 'Access-Control-Allow-Origin', 'http://localhost' );

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

app.get( '/timeline', meta.timeline );
app.get( '/layers/:year', meta.layers );
app.get( '/names/:year/:word', meta.names );
app.get( '/bounds/:year', geo.bounds );
//app.get( '/countries/:id/polygon/:srid', geo.polygonSrid);

app.listen( 3000 );
console.log( 'Listening on port 3000...' );

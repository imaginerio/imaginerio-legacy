exports.checkQuery = function( query, req ){
	if( req.headers.host.match( /-dev/ ) ){
		query = query.replace( /(FROM (?=[a-z])|INNER JOIN (?=[a-z]))([a-z]*)/g, '\$1\$2_dev' );
	}
	
	return query;
}

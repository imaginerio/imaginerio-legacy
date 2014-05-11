var search;

function init_search()
{
	search = new Bloodhound({
		datumTokenizer : Bloodhound.tokenizers.obj.whitespace('value'),
		queryTokenizer : Bloodhound.tokenizers.whitespace,
		remote : {
			url : server + '/search/year/%QUERY',
			replace : function( url, uriEncodedQuery ){ return url.replace( '/year/', '/' + year + '/' ).replace( '%QUERY', uriEncodedQuery ) },
			filter : function( json )
			{
				return _.map( json, function( value, key ){ return { 'name' : key, 'id' : value } } );
			}
		}
	});
	
	search.initialize();
	
	$( "#search input").keyup( function()
	{
		var q = $( this ).val();
		if( q.length > 2 )
		{
			search.get( $( this ).val(), function( d )
			{
				$( "#probe" ).empty();
				_.each( d, function( val ){ add_result( val.name, val.id, new RegExp( q, "gi" ), $( "#probe" ) ) } );
			});
		}
	});
}

function add_result( name, id, reg, div )
{
	div.append( 
		$( document.createElement( 'div' ) )
			.attr( "data-id", id.join( "," ) )
			.addClass( "result" )
			.html( name.replace( reg, function( m ){ return "<b>" + m + "</b>" } ) )
	);
}
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
				$( "#results .search" ).empty();
				_.each( d, function( val ){ add_result( val.name, val.id, $( "#results .search" ), new RegExp( q, "gi" ) ) } );
			});
		}
	});
}

function add_result( name, id, div, reg )
{ 	
	var result = $( document.createElement( 'div' ) )
					.attr( "data-id", _.isArray( id ) ? id.join( "," ) : id )
					.addClass( "result" )
					.html( reg ? name.replace( reg, function( m ){ return "<b>" + m + "</b>" } ) : name )
					.appendTo( div );
	
	get_details( id, result );
}

function get_details( id, div )
{
	id = _.isArray( id ) ? id.join( "," ) : id;
	
	$.getJSON( server + "/details/" + id, function( json )
	{
		if( json.length > 0 )
		{
			json = _.first( json );
			div.addClass( "expand" )
				.click( function()
				{
					if( $( this ).hasClass( "open" ) )
					{
						$( this ).animate( { height : 20 } );
						$( this ).removeClass( "open" );
					}
					else
					{
						$( ".expand.open" ).click();
						$( this ).animate( { height : "+=" + $( this ).children( ".details" ).attr( "data-height" ) } )
						$( this ).addClass( "open" );
						draw( $( this ).attr( "data-id" ), "draw" );
					}
				})
			
			var details = $( document.createElement( 'div' ) )
							.addClass( "details" )
							.appendTo( div );
			
			if( json.yearfirstd ) details.append( "<h4>" + json.years + "</h4>" );
			
			_.each( json, function( val, key )
			{
				if( key != "years" ) details.append( key + ": <b>" + val + "</b><br />" );
			});
			
			details.attr( "data-height", details.outerHeight() + 20 );
		}
	});
}

function clear_results()
{
	$( ".result" ).remove();
}
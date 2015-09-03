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
				return _.map( json, function( value, key ){ return { 'name' : key, 'data' : value } } );
			}
		}
	});
	
	search.initialize();
	
	$( "#search" ).submit( function( e )
	{
		e.preventDefault();
		return false;
	});
	
	$( "#search input").keyup( function()
	{
		$( "#search #clear" ).show();
		var q = $( this ).val();
		if( q.length > 2 )
		{
			search.get( $( this ).val(), function( d )
			{
				clear_results( "search" );
				$( "#search #clear" ).show();
				_.each( d, function( val ){ add_result( val.name, val.data.id, val.data.layer, $( "#results .search" ), new RegExp( q, "gi" ) ) } );
			});
		}
		else
		{
			clear_results( "search" );
		}
	});
	
	$( "#search #clear" ).click( function()
	{
		$( "#search input").val( '' );
		clear_results( "search" );
	})
}

function add_result( name, id, layer, div, reg )
{ 	
	if( $( ".header[name=" + layer + "]" ).length == 0 ) add_header( layer, div );
	var result = $( document.createElement( 'div' ) )
					.attr( "data-id", name )
					.addClass( "result" )
					.html( reg ? name.replace( reg, function( m ){ return "<b>" + m + "</b>" } ) : name )
					.appendTo( div );
	
	get_details( id, result );
	
	function add_header( layer, div )
	{
		$( document.createElement( 'div' ) )
			.attr({
				"class" : "header",
				"name" : layer
			})
			.html( names[ layer ] )
			.appendTo( div );
	}
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
						clear_highlight();
						$( this ).animate( { height : 20 } );
						$( this ).removeClass( "open loaded" );
					}
					else
					{
						$( ".expand.open" ).click();
						$( this ).animate( { height : "+=" + $( this ).children( ".details" ).attr( "data-height" ) } )
						$( this ).addClass( "open" );
						draw( $( this ).attr( "data-id" ), "draw", $( this ), search_loaded );
            $( ".drawn" ).removeClass( "drawn" );
					}
				})
			
			var details = $( document.createElement( 'div' ) )
							.addClass( "details" )
							.appendTo( div );
			
			if( json.yearfirstd ) details.append( "<h4>" + json.years + "</h4>" );
			
			_.each( json, function( val, key )
			{
				if( key != "years" ) details.append( "<b>" + names[ key ] + ":</b> " + val + "<br />" );
			});
			
			details.attr( "data-height", details.outerHeight() + 20 );
		}
	});
}

function clear_results( type )
{
	$( "." + type + " .result, ." + type + " .header" ).remove();
	$(  ).remove();
	if( type == "search" )
	{
		$( "#search #clear" ).hide();
	}
}

function search_loaded( el )
{
	el.addClass( "loaded" );
}
function init_layers()
{
	build_layers();
}

function build_layers()
{
	$.getJSON( server + "/layers/" + year, function( json )
	{
		_.each( json, function( val, key )
		{
			var folder = $( document.createElement( 'div' ) )
							.addClass( "folder" )
							.html( "<h4>" + key + "</h4>" )
							.appendTo( $( "#list" ) );
			_.each( val, function( val, key )
			{
				add_check( "geodb", key, folder );
				_.each( val, function( val, key )
				{
					add_check( "layer", key, folder );
					_.each( val, function( l )
					{
						$( document.createElement( 'div' ) )
							.addClass( "feature" )
							.html( l )
							.appendTo( folder )
					});
				});
			});
		});
	});
	
	function add_check( cclass, html, parent )
	{
		$( document.createElement( 'label' ) )
			.addClass( cclass )
			.html( html )
			.prepend(
				$( document.createElement( 'input' ) )
					.attr({
						"type" : "checkbox",
						"val" : html,
						"checked" : "checked"
					})
			)
			.appendTo( parent );
	}
}
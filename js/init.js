function init()
{
	resize();
	init_map();
	init_timeline();
	
	$( window ).resize( resize );
}

function resize()
{
	var h = $( window ).height();
	$( "#map" ).height( h - 100 );
	build_timeline();
}

function cursor_loading( show, p )
{
	if( show )
	{
		$( "#map" ).append( 
			$( document.createElement( 'div' ) )
				.attr( "id", "click" )
				.css({
					"top" : p.y + 100,
					"left" : p.x
				})
		)
		$( "#click" ).fadeIn();
	}
	else
	{
		$( "#click" ).fadeOut( function()
		{
			$( this ).remove();
		});
	}
}

init();
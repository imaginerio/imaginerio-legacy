var server = "http://ec2-54-186-6-23.us-west-2.compute.amazonaws.com:3000";

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
		);
	}
	else
	{
		$( "#click" ).remove();
	}
}

init();
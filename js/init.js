var server = "http://rio-server.axismaps.com:3000",
	tileserver = "http://rio-server.axismaps.com:8000/";
	
//	server = "http://localhost:3000";
//	tileserver = "http://localhost:8000/";

function init()
{
	resize();
	init_map();
	init_layers();
	init_plans();
	init_timeline();
	init_search();
	
	$( window ).resize( resize );
}

function resize()
{
	var h = $( window ).height();
	$( "#map" ).height( h - 100 );
	$( "#layers" ).height( h - 200 );
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

function map_loading( show )
{
	if( show && $( "#loading" ).length == 0 )
	{
		$( "#map" ).append(
			$( document.createElement( 'div' ) ).attr( "id", "loading" )
		);
	}
	else if( show === false )
	{
		$( "#loading" ).remove();
	}
}

init();
var year = 2013;

function init()
{
	resize();
	build_map();
	init_timeline();
	
	$( window ).resize( resize );
}

function resize()
{
	var h = $( window ).height();
	$( "#map" ).height( h - 100 );
	build_timeline();
}

init();
var year = 2013;

function init()
{
	resize();
	build_map();
	
	$( window ).resize( resize );
}

function resize()
{
	var h = $( window ).height();
	$( "#map" ).height( h - 100 );
	build_timeline();
}

init();
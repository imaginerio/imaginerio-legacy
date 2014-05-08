var year = 2013;

function init()
{
	resize();
	build_map();
}

function resize()
{
	var h = $( window ).height();
	$( "#map" ).height( h - 100 );
}

init();
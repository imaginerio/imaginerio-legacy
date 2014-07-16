var server = "http://rio-server.axismaps.com:3000",
	tileserver = "http://rio-server.axismaps.com:8000/",
	rasterserver = "http://rio-server.axismaps.com:9000/";
	
//	server = "http://localhost:3000";
//	tileserver = "http://localhost:8000/";
//	rasterserver = "http://localhost:9000/";

function init()
{
	if( gup( 'year' ) ) year = gup( 'year' );
	
	resize();
	init_map();
	init_layers();
	init_plans();
	init_timeline();
	init_search();
	
	$( window ).resize( resize );
	
	$( "#enter" ).click( function()
	{
		$( "#intro" ).fadeOut( "slow" );
	})
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
				.attr( "class", "animated zoomIn" )
				.css({
					"top" : p.y + 100,
					"left" : p.x
				})
		);
	}
	else
	{
		$( ".zoomIn" ).remove();
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

function gup( name )
{
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if( results == null )
		return "";
	else
		return results[1];
}

init();
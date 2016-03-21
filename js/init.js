var server = "http://imaginerio.rice.edu:3000",
	  tileserver = "http://imaginerio.rice.edu:3001/tiles/",
    rasterserver = "http://imaginerio.rice.edu:3001/raster/";

var lang,
	pr = {
		"h1" : "imagináRio",
		"#enter" : "Ver o mapa <span></span>",
		"#plans" : "Projetos Urbanos",
		"#switch" : "Legenda do Mapa",
		"#instruction" : "Clique no mapa para explorar...",
		"#export" : "Exportar o mapa <span></span>"
	};

function init()
{
	L_PREFER_CANVAS = true;
	L.Icon.Default.imagePath = 'img';
	
	lang = gup( 'lang' ) == "pr" ? "pr" : "en";
	if( gup( 'dev' ) == 'true' ){
    server = "http://imaginerio-dev.rice.edu:3000";
	  tileserver = "http://imaginerio-dev.rice.edu:3001/tiles/";
    rasterserver = "http://imaginerio-dev.rice.edu:3001/raster/";
	}
	
	set_language();
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
	});
}

function resize()
{
	var h = $( window ).height();
	$( "#map" ).height( h - 100 );
	$( "#layers" ).height( h - 210 );
	build_timeline();
	snap_timeline( year, 0 );
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
    
    $( "#loading" ).mouseover( function( e ){
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    });    
	}
	else if( show === false )
	{
		$( "#loading" ).remove();
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
	}
}

function set_language()
{
	if( lang == "pr" )
	{
		$( "#language span" ).html( "Versão em Português ▼" );
		$( "#language a" )
			.html( "English Version" )
			.attr( "href", "index.html?lang=en" );
		_.each( pr, function( text, sel )
		{
			$( sel ).html( text );
		});
		
		$( "#search input" ).attr( "placeholder", "Pesquisa..." );
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
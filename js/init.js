var server = "http://54.244.196.135:3000",
	  tileserver = "http://54.244.196.135:3001/tiles/",
    rasterserver = "http://54.244.196.135:3001/raster/";

var mobileSize = 800;
var mobile = $( window ).width() <= mobileSize;
var showIntro = gup( 'intro' ) ? gup( 'intro' ) == 'true' : true;
var params = {};

var lang,
	pr = {
		"h1" : "imagináRio",
		"#enter" : "Ver o mapa <span></span>",
		"#plans" : "Projetos Urbanos  &nbsp;&#9662;",
		"#switch" : "Legenda do Mapa",
		"#instruction" : "Clique no mapa para explorar...",
		"#export" : "Exportar o mapa <span></span>",
		"#tagline" : "Um Atlas ilustrado e diacronico da evolução social e urbana do Rio de Janeiro",
		"locationOutsideBounds" : "A sua localização não está no mapa",
		"locationError" : "A sua localização não está disponível",
		"#disclaimer" : "Este produto tem fins informativos e não foi preparado nem é adequado para fins legais, de engenharia ou de levantamento topográfico. Não representa um estudo in sitiu e apenas representa localizações relativas aproximadas. Não há qualquer garantia referente à precisão específica ou ao caráter integral deste produto e a Rice University assim como a equipe de pesquisa de imagineRio não assumem qualquer responsabilidade nem respondem por danos decorrentes de erros e omissões."
	};

	en = {
		"locationOutsideBounds" : "Your location is not within the bounds of the map.",
		"locationError" : "Sorry, we were not able to find your location."
	}

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
	check_hash();
	init_map();
	init_layers();
	init_plans();
	init_timeline();
	init_search();

	// Mobile start
	if( mobile ) $('.open').removeClass('open');

	$( window ).resize( resize );

	$( "#enter" ).click( function()
	{
		if( mobile ) {
			if( window.location.search ) window.open( window.location.href + window.location.search + '&intro=false', '_blank' )
			else window.open( window.location.href + '?intro=false', '_blank' );
		}
		else $( "#intro" ).fadeOut( "slow" );
	});

	resize();
	map.invalidateSize();

	if( !showIntro )
	{
		$( "#intro" ).hide();
	}
}

function resize()
{
	var h = $( window ).height();

	//mobile
	if( mobile )
	{
		if( $( "#results" ).hasClass( "open-probe" ) )
		{
			var probeh = $( ".open-probe" ).height();
			$( "#wrapper" ).height( h - 70 - probeh );
			$( "#map" ).height( h - 41 - probeh );
		}
		else
		{
			$( "#wrapper" ).height( h - 70 );
			$( "#map" ).height( h - 41 );
		}
	}
	else
	{
		$( "#map" ).height( h - 100 );
		$( "#layers" ).height( h - 210 );
	}

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

function check_hash(){
	var hash = window.location.hash.replace( '#', '' ).split( '/' );
	if( hash.length == 4 ){
		params.year = parseInt( hash[ 0 ], 10 );
		params.zoom = parseInt( hash[ 1 ] );
		params.center = [ parseFloat( hash[ 2 ] ), parseFloat( hash[ 3 ] ) ];
	}
}

init();

var map,
	tiles = {},
	shown,
	highlight;

function init_map()
{
	map = L.map( 'map', {
		center: [ -22.9046, -43.1919 ],
		zoom: 15,
		minZoom : 14,
		maxZoom : 17
	})
	.on( "click", probe );
}

function load_tiles()
{
	if( tiles[ year ] )
	{
		show_tiles( tiles[ year ] );
	}
	else
	{
		tiles[ year ] = L.tileLayer( 'tiles/' + year + '/{z}/{x}/{y}.png' )
							.addTo( map )
							.on( "load", function()
							{
								show_tiles( this );
								this.off( "load" );
							});
	}
}

function show_tiles( tile )
{
	if( shown ) tile_fadeOut( shown );
	shown = tile_fadeIn( tile );
}

function get_maxBounds()
{
	$.getJSON( "http://localhost:3000/bounds/" + year, function( json )
	{
		map.setMaxBounds( json )
	});
}

function probe( e )
{
	cursor_loading( true, e.containerPoint );
	if( map.hasLayer( highlight ) ) map.removeLayer( highlight );
	
	highlight = omnivore.geojson( "http://localhost:3000/probe/" + year + "/" + e.latlng.lng + "," + e.latlng.lat )
		.on( 'ready', function()
		{
			cursor_loading( false );
		})
		.addTo( map );
}

function tile_fadeOut( tile_out )
{
	var i = 1;
	var timer = setInterval( function()
	{
		i -= 0.1;
		if( i <= 0 ) clearInterval( timer );
		tile_out.setOpacity( Math.max( 0, i ) );
	}, 5 );
	
	return tile_out;
}

function tile_fadeIn( tile_in )
{
	var i = 0;
	var timer = setInterval( function()
	{
		i += 0.1;
		if( i >= 1 ) clearInterval( timer );
		tile_in.setOpacity( Math.min( 1, i ) );
	}, 5 );
	
	return tile_in;
}
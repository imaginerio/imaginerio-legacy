var map,
	tiles = {},
	visual = {},
	shown = {},
	highlight;

function init_map()
{
	map_loading( true );
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
	clear_highlight();
	map_loading( true );
	if( tiles[ year ] )
	{
		show_tiles( tiles[ year ] );
	}
	else
	{
		tiles[ year ] = L.tileLayer( tileserver + 'tiles/' + year + '/{z}/{x}/{y}.png' )
							.addTo( map )
							.setOpacity( 0  )
							.on( "load", function()
							{
								show_tiles( this );
								this.off( "load" );
							});
	}
	load_visual();
}

function show_tiles( tile )
{
	if( shown.tiles ) tile_fadeOut( shown.tiles );
	shown.tiles = tile_fadeIn( tile );
}

function get_maxBounds()
{
	$.getJSON( server + "/bounds/" + year, function( json )
	{
		map.setMaxBounds( json )
	});
}

function probe( e )
{
	cursor_loading( true, e.containerPoint );
	clear_highlight();
	$( "#results .probe" ).empty();
	
	$.getJSON( server + "/probe/" + year + "/" + e.latlng.lng + "," + e.latlng.lat, function( json )
	{
		_.each( json, function( l ){ add_result( l.name, l.id, $( "#results .probe" ) ); });
		cursor_loading( false );
	})
}

function draw( id )
{
	clear_highlight();
	highlight = omnivore.geojson( server + "/draw/" + id )
				.on( 'ready', function()
				{
					map.fitBounds( this.getBounds() );
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
		if( i >= 1 )
		{
			clearInterval( timer );
			map_loading( false );
		}
		tile_in.setOpacity( Math.min( 1, i ) );
	}, 5 );
	
	return tile_in;
}

function clear_highlight()
{
	if( !map.hasLayer( highlight ) ) return false;
	map.removeLayer( highlight );
}
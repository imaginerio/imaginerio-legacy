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
	if( visual[ year ] )
	{
		if( map.hasLayer( visual[ year ] ) ) map.removeLayer( visual[ year ] );
		map.addLayer( visual[ year ] );
	}
	else
	{
		visual[ year ] = omnivore.geojson( server + "/visual/" + year )
			.on( 'ready', function()
			{
				_.each( this.getLayers(), draw_visual );
			})
			.addTo( map );
	}
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
	
	highlight = omnivore.geojson( server + "/probe/" + year + "/" + e.latlng.lng + "," + e.latlng.lat )
		.on( 'ready', function()
		{
			_.each( this.getLayers(), function( l )
			{
				add_result( l.feature.properties.name, l.feature.properties.id, $( "#results .probe" ) );
			});
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

function draw_visual( layer )
{
	layer.on( "click", function( e )
	{
		if( visual.active ) visual.active.setStyle( { fillOpacity : 0 } );
		
		this.bringToFront();
		_.each( this.getLayers(), function( l )
		{
			if( l instanceof L.Marker === false )
			{
				l.setStyle( { fillOpacity : 0.65 } );
				visual.active = l;
			}
		} )
	});

	_.each( layer.getLayers(), function( l )
	{
		if( l instanceof L.Marker )
		{
			l.setIcon( new L.icon({
				iconUrl : "img/viewpoint.png",
				iconSize : [ 25, 22 ],
				iconAnchor : [ 12, 11 ]
			}));
		}
		else
		{
			l.setStyle({
				fillColor : "#FFFFFF",
				fillOpacity : 0,
				opacity : 0
			});
		}
	});
}
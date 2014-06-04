var map,
	tiles = {},
	visual = {},
	shown = {},
	highlight = {};

function init_map()
{
	map_loading( true );
	map = L.map( 'map', {
		center: [ -22.9046, -43.1919 ],
		zoom: 15,
		minZoom : 14,
		maxZoom : 17,
		maxBounds : [ [ -23.10243406, -44.04944719  ], [ -22.63003187, -42.65988214 ] ]
	})
	.on( "click", probe );
}

function load_tiles()
{
	clear_highlight();
	map_loading( true );
	if( tiles[ year ] && off.length == 0 )
	{
		show_tiles( tiles[ year ] );
	}
	else
	{
		var t = L.tileLayer( tileserver + 'tiles/' + year + '/{z}/{x}/{y}.png?layer=' + off.join( "," )  )
					.addTo( map )
					.setOpacity( 0 )
					.on( "load", function()
					{
						show_tiles( this );
						this.off( "load" );
					});
		
		if( off.length == 0 ) tiles[ year ] = t;
	}
	load_visual();
}

function show_tiles( tile )
{
	if( shown.tiles ) map.removeLayer( tile_fadeOut( shown.tiles ) );
	shown.tiles = tile_fadeIn( tile );
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

function draw( id, route )
{
	clear_highlight();
	
	route = route ? route : "draw";
	var styles = get_styles( "#1a1a1a" );
	
	highlight.bottom = omnivore.geojson( server + "/" + route + "/" + id, null, styles.bottom )
				.on( 'ready', function()
				{
					map.fitBounds( this.getBounds() );
				})
				.addTo( map );
	highlight.top = omnivore.geojson( server + "/" + route + "/" + id, null, styles.top ).addTo( map );
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
	if( !map.hasLayer( highlight.top ) ) return false;
	map.removeLayer( highlight.top );
	map.removeLayer( highlight.bottom );
}

function get_styles( color )
{
	var topLayer = L.geoJson( null, {
	    style : function( feature )
	    {
        	return { 
        		color: color,
        		fillColor: color,
        		fillOpacity : 0.2,
        		weight : 2
        	};
		}
	});
	
	var bottomLayer = L.geoJson( null, {
	    style : function( feature )
	    {
        	return { 
        		color: color,
        		fillColor: color,
        		fillOpacity : 0,
        		opacity : 0.2,
        		weight : 6 
        	};
		}
	});
	
	return { top : topLayer, bottom : bottomLayer };
}
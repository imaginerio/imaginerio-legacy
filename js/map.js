var map,
	tiles = {},
	visual = {},
	rasters = {},
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
	
	$( "#export" ).click( export_map );
}

function load_tiles()
{
	clear_highlight();
	map_loading( true );
	if( tiles[ year ] && off.length == 0 )
	{
		map.addLayer( tiles[ year ].setOpacity( 0 ) );
	}
	else
	{
		var t = L.tileLayer( tileserver + 'tiles/' + year + '/{z}/{x}/{y}.png?layer=' + off.join( "," )  )
					.addTo( map )
					.setOpacity( 0 )
					.on( "load", function()
					{
						show_tiles( this );
					});
		
		if( off.length == 0 ) tiles[ year ] = t;
	}
	load_visual();
}

function show_tiles( tile )
{
	if( !_.isEqual( shown.tiles, tile ) )
	{
		if( shown.tiles ) map.removeLayer( tile_fadeOut( shown.tiles ) );
		shown.tiles = tile_fadeIn( tile );
	}
}

function probe( e )
{
	cursor_loading( true, e.containerPoint );
	clear_highlight();
	clear_results( "probe" );
	
	$.getJSON( server + "/probe/" + year + "/" + e.latlng.lng + "," + e.latlng.lat, function( json )
	{
		_.each( json, function( l ){ add_result( l.name, l.id, l.layer, $( "#results .probe" ) ); });
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

function load_raster( id )
{
	if( map.hasLayer( shown.raster ) ) map.removeLayer( shown.raster );
	if( id !== false )
	{
		if( rasters[ id ] )
		{
			map.addLayer( rasters[ id ] );
		}
		else
		{
			rasters[ id ] = L.tileLayer( rasterserver + 'tiles/?z={z}&x={x}&y={y}&raster=' + id ).addTo( map ).setOpacity( 0.35 );
		}
		shown.raster = rasters[ id ];
	}
}

function tile_fadeOut( tile_out )
{
	var i = 1;
	var timer = setInterval( function()
	{
		i -= 0.1;
		if( i <= 0 ) clearInterval( timer );
		tile_out.setOpacity( Math.max( 0, i ) );
	}, 50 );
	
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
	}, 50 );
	
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

function export_map()
{
	var dimensions = map.getSize();
	dimensions.y += 100;
	
	$( "#export" ).addClass( "loading" );
	
	leafletImage( map, dimensions, function( err, canvas )
	{
	    var context = canvas.getContext( "2d" );
		context.fillStyle = '#eee';
		context.fillRect( 0, 0, dimensions.x, 100 );
		context.fillStyle = '#666';
		context.fillRect( 0, 99, dimensions.x, 1 );
		context.font = '100 60px Helvetica Neue, HelveticaNeue, TeXGyreHeros, FreeSans, Nimbus Sans L, Liberation Sans, Arimo, Helvetica, Arial, sans-serif';
		context.fillText( "imagineRio", 20, 70 );
		
		context.font = 'bold 30px Helvetica Neue, HelveticaNeue, TeXGyreHeros, FreeSans, Nimbus Sans L, Liberation Sans, Arimo, Helvetica, Arial, sans-serif';
		context.fillText( year, dimensions.x - 100, 70 ); 
	    
	    savePNG( canvas.toDataURL(), "rio-" + year + ".png");
	});
	
	function savePNG( data, fname )
	{
        var pom = document.createElement('a');
		pom.setAttribute( 'href', data );
    	pom.setAttribute( 'download', fname );
	    pom.click();
        
        $( "#export" ).removeClass( "loading" );
    };
}
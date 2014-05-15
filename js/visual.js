load_visual()
{
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
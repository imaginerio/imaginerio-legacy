function load_visual()
{
	clear_visual();
	if( visual[ year ] )
	{
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
	layer
		.on( "mouseover", function( e )
		{	
			this.bringToFront();
			_.each( this.getLayers(), function( l )
			{
				if( l instanceof L.Marker === false ) l.setStyle( { fillOpacity : 0.65 } );
			});
			show_visual_details( this.feature.properties.id, e.containerPoint );
		})
		.on( "mouseout", function( e )
		{
			_.each( this.getLayers(), function( l )
			{
				if( l instanceof L.Marker === false ) l.setStyle( { fillOpacity : 0 } );
			});
			$( ".visual_probe" ).remove();
		});

	layer.eachLayer( function( l )
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

function show_visual_details( ssid, e )
{
	
	var probe = $( document.createElement( 'div' ) )
					.addClass( "visual_probe" )
					.appendTo( $( ".wrapper" ) );
					
	$.ajax( "http://www.sscommons.org/openlibrary/secure/metadata/" + ssid,{
		dataType : "json",
		success : function( json )
		{					
			var data = {};
			_.each( 
				_.filter( 
					json.metaData,
					function( i )
					{
						return _.contains( [ "Title", "Date", "Description" ], i.fieldName );
					}
				),
				function( j )
				{
					data[ j.fieldName ] = j.fieldValue; 
				}
			);
			
			probe.html( "<b>" + data.Date + "</b><p>" + data.Title + "<p><i>Click for details</i>" );
			
			probe.css({
				"background-image" : "url( http://www.sscommons.org/" + json.imageUrl + " )",
				"top" : e.y > $( window ).height() / 2 ? e.y - 20 : e.y + probe.outerHeight() + 20,
				"left" : e.x > $( window ).width() / 2 ? e.x - probe.outerWidth() : e.x
			});
		}
	});
}

function clear_visual()
{
	if( map.hasLayer( visual[ year ] ) ) map.removeLayer( visual[ year ] );
}
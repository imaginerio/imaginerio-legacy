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

			show_visual_details( this.feature.properties, e.containerPoint );
		})
		.on( "mouseout", function( e )
		{
			_.each( this.getLayers(), function( l )
			{
				if( l instanceof L.Marker === false ) l.setStyle( { fillOpacity : 0 } );
			});
			$( ".visual_probe" ).remove();
		})
		.on( "click", show_image );

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

function show_visual_details( properties, e )
{

	var probe = $( document.createElement( 'div' ) )
					.addClass( "visual_probe" )
					.html( "<b>" + properties.creator + "</b><p>" + properties.description + "<p><i>Click for details</i>" )
					.appendTo( $( ".wrapper" ) );
					
					
	$.ajax( "http://www.sscommons.org/openlibrary/secure/metadata/" + properties.id,{
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
			
			
			
			probe.css({
				"background-image" : "url( http://www.sscommons.org/" + json.imageUrl + " )",
				"top" : e.y > $( window ).height() / 2 ? e.y - 20 : e.y + probe.outerHeight() + 20,
				"left" : e.x > $( window ).width() / 2 ? e.x - probe.outerWidth() : e.x
			});
		}
	});
}

function show_image()
{
	$.fancybox.showLoading();
	var data = this.feature.properties;
	
	$.getJSON( "http://www.sscommons.org/openlibrary/secure/imagefpx/" + data.id + "/7729935/5", function( json )
	{
		$.fancybox.open({
			href : json[ 0 ].imageServer + json[ 0 ].imageUrl + "&&wid=" + json[ 0 ].width + "&hei=" + json[ 0 ].height + "&rgnn=0,0,1,1&cvt=JPEG",
			type : 'image',
			title : "<b>" + data.creator + "</b> - " + data.date + "<br />" + data.description,
			helpers:  {
		        title : {
		            type : 'inside'
		        },
		        overlay : {
		            showEarly : false
		        }
		    }
		});
	});
}

function clear_visual()
{
	if( map.hasLayer( visual[ year ] ) ) map.removeLayer( visual[ year ] );
}
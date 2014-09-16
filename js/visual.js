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
	layer.eachLayer( function( l )
	{
		if( l instanceof L.Marker )
		{
			l.setIcon( new L.icon({
				iconUrl : "img/viewpoint.png",
				iconSize : [ 25, 22 ],
				iconAnchor : [ 12, 11 ]
			}));
			
			l.layer = layer;
			
			l.on( "mouseover", function( e )
			{	
				this.layer.bringToFront();
				_.each( this.layer.getLayers(), function( l )
				{
					if( l instanceof L.Marker === false ) l.setStyle( { fillOpacity : 0.2 } );
				});
	
				show_visual_details( this.layer.feature.properties, map.latLngToContainerPoint( e.latlng ) );
			});
			l.on( "mouseout", function( e )
			{
				_.each( this.layer.getLayers(), function( l )
				{
					if( l instanceof L.Marker === false ) l.setStyle( { fillOpacity : 0 } );
				});
				$( ".visual_probe" ).remove();
			});
			l.on( "click", function()
			{
				show_image( this.layer.feature.properties );
			});
		}
		else
		{
			l.setStyle({
				fillColor : "#000000",
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

function show_image( data )
{	
	console.log( data.description );
	
	$.getJSON( "http://www.sscommons.org/openlibrary/secure/imagefpx/" + data.id + "/7729935/5", function( json )
	{
		var dim = scale_image( json[ 0 ].width, json[ 0 ].height );
		$.featherlight( '<img src="' + json[ 0 ].imageServer + json[ 0 ].imageUrl + "&&wid=" + dim.w + "&hei=" + dim.h + "&rgnn=0,0,1,1&cvt=JPEG" + '"><p><b>' + data.creator + '</b> - ' + data.date + '<br />' + data.description + '</p>' );
	});
}

function clear_visual()
{
	if( map.hasLayer( visual[ year ] ) ) map.removeLayer( visual[ year ] );
}

function scale_image( width, height )
{
	var maxWidth = Math.floor( $( window ).width() * 0.9 ) - 100,
		maxHeight = $( window ).height() - 150,
		ratio = 0;
	
	if( width > maxWidth )
	{
		ratio = maxWidth / width;
		height = height * ratio;
		width = width * ratio;
	}
	
	if( height > maxHeight )
	{
		ratio = maxHeight / height;
		width = width * ratio;
		height = height * ratio;
	}
	
	return { w : Math.round( width ), h : Math.round( height ) };
}
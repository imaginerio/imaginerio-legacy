var names = {},
	off = [];

function init_layers()
{
	$.getJSON( server + "/names", function( json )
	{
		names = json;
		build_layers();
	})
	
	$( "#switch" ).click( function()
	{
		if( $( "#layers" ).hasClass( "open" ) )
		{
			$( "#layers, #switch, .leaflet-control-zoom" ).removeClass( "open" );
		}
		else
		{
			$( "#layers, #switch, .leaflet-control-zoom" ).addClass( "open" );
		}
	});
	$( "#layers" ).on( "click", ".folder h4", function()
	{
		var folder = $( this ).parent();
		if( folder.hasClass( "open" ) )
		{
			folder.removeClass( "open" );
		}
		else
		{
			folder.addClass( "open" );
		}
	});
	$( "#layers" ).on( "click", ".feature", function( e )
	{
		draw( $( this ).attr( "id" ), "feature/" + year, $( this ) );
		$( this ).addClass( "loading" );
		e.stopPropagation();
	});
}

function build_layers()
{
	$.getJSON( server + "/layers/" + year, function( json )
	{
		$( "#list" ).empty();
		
		_.each( json, function( val, key )
		{
			var folder = $( document.createElement( 'div' ) )
							.addClass( "folder open" )
							.html( "<h4>" + names[ key ] + "</h4>" )
							.appendTo( $( "#list" ) );
							
			_.each( val, function( val, key )
			{
				if( key == "VisualDocuments" )
				{
					build_visual( val, folder )
				}
				else
				{
					add_check( "geodb", key, folder );
					_.each( val, function( val, key )
					{
						var label = add_check( "layer", key, val.id ).appendTo( folder );
						delete val.id;
						
						if( val.style ) label.append( add_swatch( val.style ) );
						if( val.features )
						{
							_.each( val.features, function( name )
							{
								$( document.createElement( 'div' ) )
									.addClass( "feature" )
									.attr( "id", name )
									.html( names[ name ] )
									.appendTo( folder );
							});
						}
					});
				}
			});
		});
	});
	
	function build_visual( r, div )
	{
		var docs = {};
		_.each( r, function( val, key )
		{
			docs[ key ] = _.filter( _.keys( val ), function( i ){ return i != "id" } )[ 0 ];
		})

		_.each( docs, function( val, key )
		{
			var label = $( document.createElement( 'label' ) )
							.html( val )
							.appendTo( div )
							.prepend(
								$( document.createElement( 'input' ) )
									.attr({
										"type" : "checkbox",
										"class" : "raster",
										"value" : key
									})
									.click( function( e )
									{
										if( $( this ).is( ":checked" ) )
										{
											$( "input.raster:checked" ).not( this ).removeAttr( "checked" );
											load_raster( $( this ).val() );
										}
										else
										{
											load_raster( false );
										}
												
										e.stopPropagation();
									})
							);
							
			$.getJSON( "http://www.sscommons.org/openlibrary/secure/imagefpx/" + key + "/7729935/5", function( json )
			{
				var w = json[ 0 ].width,
					h = json[ 0 ].height,
					s = Math.max( 120 / h, 185 / w );
					
				label.after(
					$( document.createElement( 'img' ) ).attr( "src", json[ 0 ].imageServer + json[ 0 ].imageUrl + "&&wid=" + Math.round( w * s )  + "&hei=" + Math.round( h * s ) + "&rgnn=0,0,1,1&cvt=JPEG" )
				);
			});			
		})
	}
	
	function add_check( cclass, html, id )
	{
		var label = $( document.createElement( 'label' ) )
						.addClass( cclass )
						.html( names[ html ] );
		
		if( id )
		{
			label.prepend(
				$( document.createElement( 'input' ) )
					.attr({
						"type" : "checkbox",
						"value" : id,
						"checked" : !_.contains( off, id )
					})
					.click( switch_layers )
			);
		}
		
		return label;
	}
	
	function switch_layers( e )
	{
		off = [];
		$( ".feature.off" ).removeClass( "off" );
		
		$( "#layers input:not( :checked )" ).each( function()
		{
			off = off.concat( $( this ).val().split( "," ) );
			$( this ).parent().nextUntil( "label.layer" ).addClass( "off" );
		});
		
		e.stopPropagation();
		load_tiles();
	}
	
	function add_swatch( style )
	{
		var swatch = $( document.createElement( 'div' ) ).addClass( "swatch" );
		if( style.shape.match( /svg$/ ) )
		{
			swatch.load( "img/legend/" + style.shape );
		}
		else
		{
			swatch.append(
				$( document.createElement( 'img' ) ).attr( "src", "img/legend/" + style.shape )
			);
		}

		swatch.css( style );
		
		return swatch;
	}
}
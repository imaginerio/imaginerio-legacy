var names = {},
	off = [];

function init_layers()
{
	$.getJSON( server + "/names/" + lang, function( json )
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
		if( $( this ).hasClass( "drawn" ) )
		{
			clear_highlight();
		}
		else
		{
			draw( $( this ).attr( "id" ), "feature/" + year, $( this ), feature_drawn );
			$( this ).addClass( "loading" );
		}
		
		$( ".drawn" ).removeClass( "drawn" );
		e.stopPropagation();
	});
}

function build_layers()
{
	$( "#list" ).empty();
	
	$.getJSON( server + "/raster/" + year, function( json )
	{
		if( json.length > 0 )
		{
			var folder = build_folder( names.VisualDocuments ),
				  raster = json;
				
			if( raster.length < json.length )
			{
				var label = add_check( "layer visual", "ImageViewshedsPoly", "viewsheds", function()
				{
					if( $( ".visual" ).children( "input" ).is( ":checked" ) )
					{
						map.addLayer( visual[ year ] );
					}
					else
					{
						if( map.hasLayer( visual[ year ] ) ) map.removeLayer( visual[ year ] );
					}
				}).appendTo( folder );
				label.prepend( add_swatch( { shape : "../viewpoint.png" } ) );
			}
			_.each( raster, function( val )
			{
				build_visual( val, folder );
			});
		}
		
		$.getJSON( server + "/layers/" + year, function( json )
		{	
			_.each( json, function( val, key )
			{
				var folder = build_folder( names[ key ] );
								
				_.each( val, function( val, key )
				{
					add_check( "geodb", key, folder, switch_layers );
					_.each( val, function( val, key )
					{
						var label = add_check( "layer", key, val.id, switch_layers ).appendTo( folder );
						delete val.id;
						
						if( val.style ) label.prepend( add_swatch( val.style ) );
						if( val.features )
						{
							_.each( val.features, function( name )
							{
								$( document.createElement( 'div' ) )
									.addClass( "feature" )
									.attr( "id", name )
									.html( names[ name ] )
									.prepend( "<span>Clear</span>" )
									.appendTo( folder );
							});
						}
					});
				});
			});
      
      $( "#layers label:not( .visual ) input:not( :checked )" ).each( function()
      {
        $( this ).parent().nextUntil( "label.layer" ).addClass( "off" );
      });
		});
	});
	
	function build_folder( name )
	{
		return $( document.createElement( 'div' ) )
					.addClass( "folder open" )
					.html( "<h4>" + name + "</h4>" )
					.appendTo( $( "#list" ) );
	}
	
	function build_visual( r, div )
	{
		var label = $( document.createElement( 'label' ) )
						.html( '<span>' + r.description + '</span>' )
						.addClass( "visual" )
						.appendTo( div )
						.prepend(
							$( document.createElement( 'input' ) )
								.attr({
									"type" : "checkbox",
									"class" : "raster",
									"value" : r.file
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
		$.getJSON( "http://www.sscommons.org/openlibrary/secure/imagefpx/" + r.id + "/7729935/5", function( json )
		{
			var w = json[ 0 ].width,
				h = json[ 0 ].height,
				s = Math.max( 120 / h, 185 / w );
			
      $.ajax( "http://www.sscommons.org/openlibrary/secure/metadata/" + r.id + "?_method=FpHtml",
      {
        dataType : "html",
        success : function( html )
        {
          var href = $( html ).find( "td" ).last().text().replace( /\s/gm, "" );
          label.after(
            $( document.createElement( 'a' ) )
              .attr({
                  "href" : "http://www.sscommons.org/openlibrary/" + href + "&fs=true",
                  "class" : "visual-link",
                  "target" : "_blank"
              })
              .text( "View full image" )
              .append(
                $( document.createElement( 'img' ) )
                  .attr({
                    "src" : "img/External_link.png"
                  })
              )
              
          );
          
          label.after(
            $( document.createElement( 'img' ) )
              .attr( "src", json[ 0 ].imageServer + json[ 0 ].imageUrl + "&&wid=" + Math.round( w * s )  + "&hei=" + Math.round( h * s ) + "&rgnn=0,0,1,1&cvt=JPEG" )
              .data( r )
              .click( function()
              {
                show_image( $( this ).data() );
              })
          );
        }
      });
		});
	}
	
	function add_check( cclass, html, id, on_click )
	{
		var label = $( document.createElement( 'label' ) )
						.addClass( cclass )
						.html( "<span>" + names[ html ] + "</span>" );
		
		if( id )
		{
			label.prepend(
				$( document.createElement( 'input' ) )
					.attr({
						"type" : "checkbox",
						"value" : id,
						"checked" : !_.contains( off, id )
					})
					.click( on_click )
			);
		}
		
		return label;
	}
	
	function switch_layers( e )
	{
		off = [];
		$( ".feature.off" ).removeClass( "off" );
		
		$( "#layers label:not( .visual ) input:not( :checked )" ).each( function()
		{
			off = off.concat( $( this ).val() );
			$( this ).parent().nextUntil( "label.layer" ).addClass( "off" );
		});
		
    clear_results( "probe" );
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

function feature_drawn( el )
{
	el.removeClass( "loading" );
	el.addClass( "drawn" );
}
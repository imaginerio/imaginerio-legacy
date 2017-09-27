var names = {},
	off = [];

var hamburgerTimeout;
var layersInitialCheck = true;

function init_layers()
{
	$.ajax({
		url: server + "/names/" + lang,
		dataType: 'json',
		success: function( json ){
			names = json;
		},
		error: function( data ){
			serverError();
		}
	});

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

	$( "#hamburger" ).click( function ()
	{
		if( $( "#layers" ).hasClass( "open" ) )
		{
			clearTimeout(hamburgerTimeout);
			$( "#layers, .mobile-wrapper" ).removeClass( "open" );
			$( ".mobile-wrapper" ).css( "width", "100%" );
			$( "#hamburger" ).removeClass( "open" );
			$( ".social-media-button" ).show();
			$( "#year, .leaflet-bar, header h1" ).show();
			resize();
			map.invalidateSize();
			$( ".mobile-wrapper" ).off( "swipeleft" );
		}
		else
		{
			$( "#layers, .mobile-wrapper" ).addClass( "open" );
			hamburgerTimeout = setTimeout(function () {
				$( ".mobile-wrapper" ).width(50);
				$( ".social-media-button" ).hide();
				$( "#year, .leaflet-bar, header h1" ).hide();
				$( "#hamburger" ).addClass( "open" );

				$( ".mobile-wrapper" ).on( "swipeleft", function ()
				{
					$( "#hamburger" ).click();
				});
			}, 1000);
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
			draw( $( this ).attr( "id" ), "feature", $( this ), feature_drawn );
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
			var folder = build_folder( names[ "iconography" ] ),
				  raster = _.filter( json, function( val ){ return val.layer != "viewsheds" } );

			if( raster.length < json.length )
			{
				add_check( "geodb", "views" ).appendTo( folder );
				var label = add_check( "layer visual", "ImageViewshedsPoly", "viewsheds", function()
				{
					if( $( ".layer.visual" ).children( "input" ).is( ":checked" ) )
					{
						map.addLayer( visual[ year ] );
					}
					else
					{
						if( map.hasLayer( visual[ year ] ) ) map.removeLayer( visual[ year ] );
					}
					update_hash();
				}).appendTo( folder );
				label.prepend( add_swatch( { shape : "../viewpoint.png" } ) );
			}

			var type = '';
			_.each( raster, function( val )
			{
				if( val.layer != type ){
					add_check( "geodb", val.layer ).appendTo( folder );
					type = val.layer;
				}
				build_visual( val, folder );
			});
		}

		$.getJSON( server + "/layers/" + year, function( json )
		{
			_.each( json, function( val, key )
			{
				var folder = build_folder( names[ key.toLowerCase() ] );

				_.each( val, function( val, key )
				{
  				//add_check( "geodb", key ).appendTo( folder );
					_.each( val, function( val, key )
					{
						var label = add_check( "layer", key, val.id, switch_layers ).appendTo( folder );
						if ( layersInitialCheck && params.layers && params.layers.length > 0 )
						{
							label.find( 'input' ).prop( 'checked', _.contains( params.layers, label.find( 'input' ).attr( 'value' ) ) );
						}
						delete val.id;

						if( val.style ) label.prepend( add_swatch( val.style ) );
						if( val.features )
						{
							_.each( val.features, function( name )
							{
								$( document.createElement( 'div' ) )
									.addClass( "feature" )
									.attr( "id", name )
									.html( "<i>" + names.highlight + "</i> " + names[ name.toLowerCase() ] )
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

			layersInitialCheck = false;
			switch_layers();
			update_hash();
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
								.prop( 'checked', function()
								{
									if ( layersInitialCheck && params.raster && params.raster === r.file )
									{
										load_raster( r.file );
										return true;
									}
									return false;
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
									update_hash();
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
              .text( names.viewfull )
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

	function add_check( cclass, html, id, on_click ){
		var label = $( document.createElement( 'label' ) )
						.addClass( cclass )
						.html( "<span>" + names[ html.toLowerCase() ] + "</span>" );

		if( id ){
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
		if ( e ) e.stopPropagation();
		load_tiles();
		update_hash();
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

		if( style.fill || style.stroke ) swatch.css( style );

		return swatch;
	}
}

function feature_drawn( el )
{
	el.removeClass( "loading" );
	el.addClass( "drawn" );
}

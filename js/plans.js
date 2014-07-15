var plans = [];

function init_plans()
{
	$( "#plans" ).click( function()
	{
		if( $( "#menu" ).hasClass( "open" ) )
		{
			$( "#menu" )
				.slideUp()
				.removeClass( "open" );
		}
		else if( $( this ).hasClass( "back" ) )
		{
			clear_plan();
		}
		else
		{
			$( "#menu" )
				.slideDown()
				.addClass( "open" );
		}
	});
	
	$.getJSON( server + "/plans", function( json )
	{
		_.each( json, function( p )
		{	
			p.description = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
			
			$( "#menu" ).append(
				$( document.createElement( 'div' ) )
					.html( p.planname + " " + p.planyear )
					.attr( "data-plan", plans.length )
					.click( function()
					{
						load_plan( plans[ parseInt( $( this ).attr( "data-plan" ) ) ] );
						$( "#menu" )
							.slideUp()
							.removeClass( "open" );
					})
			);
			
			plans.push( p );
		});
	});
}

function load_plan( plan )
{
	draw_plan( plan );
	$( "#track, #puck" ).fadeOut( function()
	{
		$( "#plans" )
			.addClass( "back" )
			.html( "Clear project" );
			
		$( "#plan_info" )
			.show()
			.html( plan.planname + ", " + plan.planyear );
	})
}

function draw_plan( plan )
{
	var styles = get_styles( "#875353" );
	
	if( plan.geo )
	{
		map.addLayer( plan.geo );
		map.addLayer( plan.geo2 );
	}
	else
	{
		plan.geo = omnivore.geojson( server + "/plan/" + encodeURI( plan.planname ), null, styles.bottom ).addTo( map );
		plan.geo2 = omnivore.geojson( server + "/plan/" + encodeURI( plan.planname ), null, styles.top ).addTo( map );
	}
}

function clear_plan()
{
	_.each( plans, function( p )
	{
		if( p.geo && map.hasLayer( p.geo ) ) map.removeLayer( p.geo );
		if( p.geo2 && map.hasLayer( p.geo2 ) ) map.removeLayer( p.geo2 );
	});
	
	$( "#plans" )
		.removeClass( "back" )
		.html( "Urban Projects &nbsp;&#9662;" );
		
	$( "#plan_info" ).hide();
	$( "#track, #puck" ).fadeIn();
}
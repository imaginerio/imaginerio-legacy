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
			$( "#menu" ).append(
				$( document.createElement( 'div' ) )
					.html( p.planname + " " + p.planyear )
					.attr( "data-plan", p.planname )
					.click( function()
					{
						load_plan( $( this ).attr( "data-plan" ) );
					})
			);
		});
	});
}

function load_plan( plan )
{

}
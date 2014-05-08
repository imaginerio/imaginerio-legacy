var years = [],
	min = -Infinity,
	max = Infinity,
	interval = [ 1, 5, 10, 20, 50, 100, 200, 500, 1000 ];

function build_timeline()
{
	$( "#timeline" ).empty();
	if( years.length == 0 )
	{
		get_timeline();
		return false;
	}
	
	var w = $( "#timeline" ).width();
		x = w / ( max - min );
		gap = _.find( interval, function( i ){ return x * i > 50; } ),
		y = min;
		
	while( Math.round( y / gap ) != y / gap )
	{
		y++;
	}
	
	for( var i = y; i <= max; i += gap )
	{
		$( "#timeline" ).append( add_tick( i ) );
	}
	
	function get_timeline()
	{
		$.getJSON( "http://localhost:3000/timeline", function( json )
		{
			years = json;
			min = _.first( years );
			max = _.last( years );
			
			build_timeline();
		});
	}
	
	function add_tick( i )
	{
		var div = $( document.createElement( 'div' ) )
					.html( "<span>" + i + "</span>" )
					.addClass( "tick" )
					.width( Math.floor( gap * x ) );
		if( i - min < gap )
		{
			div.width( ( i - min ) * x );
		}
		else
		{
			div.prepend(
				$( document.createElement( 'div' ) )
					.addClass( "minor" )
					.html( "<span>" + ( i - ( gap / 2 ) ) + "</span>" )
			);
		}
		
		return div;
	}
}
var years = [],
	min = -Infinity,
	max = Infinity,
	interval = [ 1, 5, 10, 20, 50, 100, 200, 500, 1000 ];

function init_timeline()
{
	$.getJSON( "http://localhost:3000/timeline", function( json )
	{
		years = json;
		min = _.first( years );
		max = _.last( years );
		
		build_timeline();
	});
}

function build_timeline()
{
	$( "#track" ).empty();
	
	if( years.length == 0 ) return false;
	
	var w = $( "#timeline" ).width();
		x = w / ( max - min );
		gap = _.find( interval, function( i ){ return x * i > 60; } ),
		y = min;
		
	while( Math.round( y / gap ) != y / gap )
	{
		y++;
	}
	
	for( var i = y; i <= max; i += gap )
	{
		$( "#track" ).append( add_tick( i ) );
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
		if( i - min > ( gap / 2 ) )
		{
			div.prepend(
				$( document.createElement( 'div' ) )
					.addClass( "minor" )
					.html( "<span>" + ( i - ( gap / 2 ) ) + "</span>" )
					.width( i - min < gap ? Math.floor( ( gap * x ) - ( ( i - min ) * x ) ) : "50%" )
			);
		}
		
		return div;
	}
}
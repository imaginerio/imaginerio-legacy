var year = 0,
	years = [],
	min = -Infinity,
	max = Infinity,
	px = 0,
	interval = [ 1, 5, 10, 20, 50, 100, 200, 500, 1000 ];

function init_timeline()
{
	$.getJSON( server + "/timeline", function( json )
	{
		years = json;
		min = _.first( years ),
		max = _.last( years ) + 1,
		year = Math.max( year, min );
		years.push( max );
		
		build_timeline();
		update_year( year );
		snap_timeline( year );
	});
	
	$( "#puck" ).mousedown( function()
	{
		$( "#puck span" ).fadeIn( "fast" );
		$( "#timeline" ).mousemove( function( e )
		{
			var pos = Math.max( 0, Math.min( e.clientX - 300, $( this ).width() ) );
			$( "#puck" ).css( "left", pos );
			$( "#puck span" ).html( get_timeline_year() );
		});
		
		$( window ).mouseup( function()
		{
			$( "#timeline" ).unbind( "mousemove" );
			$( window ).unbind( "mouseup" );
			$( "#puck span" ).fadeOut( "fast" );
			
			update_year( snap_timeline() );
		})
	});
	
	$( "#year div" ).click( function()
	{
		if( $( this ).attr( "id" ) == "next" )
		{
			var y = _.find( years, function( y ){ return y >= year + 10; } );
			y = y ? y : max;
		}
		else
		{
			years.reverse();
			var y = _.find( years, function( y ){ return y <= year - 10; } );
			y = y ? y : min;
			years.reverse();
		}
		if( y !== undefined )
		{
			update_year( y );
			snap_timeline( y );
		}
	})
}

function update_year( y )
{
	clear_visual();
	clear_results( "shadow");
	
	year = y;
	$( "#year span, #puck span" ).html( year );
	
	load_tiles();
	build_layers();
	clear_highlight();
}

function build_timeline()
{
	$( "#track" ).empty();
	
	if( years.length == 0 ) return false;
	
	var w = $( "#timeline" ).width(),
		y = min;
	
	px = w / ( max - min );
	var gap = _.find( interval, function( i ){ return px * i > 65; } );
		
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
					.width( Math.floor( gap * px ) );
		if( i - min < gap )
		{
			div.width( ( i - min ) * px );
		}
		if( i - min > ( gap / 2 ) )
		{
			div.prepend(
				$( document.createElement( 'div' ) )
					.addClass( "minor" )
					.html( "<span>" + ( i - ( gap / 2 ) ) + "</span>" )
					.width( i - min < gap ? Math.floor( ( gap * px ) - ( ( i - min ) * px ) ) : "50%" )
			);
		}
		return div;
	}
}

function get_timeline_year()
{
	var l = $( "#puck" ).css( "left" ).replace( "px", "" );
	return Math.round( l / px ) + min;
}

function snap_timeline( set )
{
	var y = set ? set : get_timeline_year();
	if( y > year )
	{
		y = _.find( years, function( d ){ return d >= y } );
	}
	else if( y < year )
	{
		y = _.find( _.clone( years ).reverse(), function( d ){ return d <= y } );
	}
	
	$( "#puck" ).stop().animate( { "left" : ( y - min ) * px }, "fast" );
	
	return y;
}
var map;

function build_map()
{
	map = L.map( 'map', {
		center: [ -22.9046, -43.1919 ],
		zoom: 15,
		minZoom : 14,
		maxZoom : 17
	})
	map.whenReady( get_maxBounds );
	
	L.tileLayer( 'tiles/' + year + '/{z}/{x}/{y}.png' ).addTo( map );
}

function get_maxBounds()
{
	$.getJSON( "http://localhost:3000/bounds/" + year, function( json )
	{
		map.setMaxBounds( json )
	});
}
var map;

function build_map()
{
	var map = L.map( 'map', {
		center: [ -22.9046, -43.1919 ],
		zoom: 14,
		minZoom : 14,
		maxZoom : 17
	});
	
	L.tileLayer( 'tiles/2013/{z}/{x}/{y}.png' ).addTo( map );
}
const mapElement = document.getElementById('map');
const pointsData = mapElement.getAttribute('data-points');
const points = JSON.parse(pointsData);
var map = L.map('map').setView([points[0].latitude, points[0].longitude], 14); // Default center and zoom level
map.getRenderer(map).options.padding = 100;
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    noWrap: true,
    dragging: true
}).addTo(map);
var worldPolygon = turf.polygon([[[-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180]]]);
const maxDistance = 8; //max distance in km between two points
var segments = [];
var segment = [points[0]];

for (let i = 1; i < points.length; i++) {
    const point1 = turf.point([segment[segment.length - 1].longitude, segment[segment.length - 1].latitude]);
    const point2 = turf.point([points[i].longitude, points[i].latitude]);
    const distance = turf.distance(point1, point2);

    if (distance > maxDistance) {
        segments.push(segment);
        segment = [points[i]];
    } else {
        segment.push(points[i]);
    }
}
segments.push(segment);

segments.forEach(segment => {
    if (segment.length > 1) {
        // var simplifiedSegment = simplify(segment.map(point => ({x: point.latitude, y: point.longitude})), 0.001, true);
        // var line = turf.lineString(simplifiedSegment.map(point => [point.x, point.y]));
        var line = turf.lineString(segment.map(point => [point.latitude, point.longitude]));
        var buffered = turf.buffer(line, 0.25); // Adjust the buffer size as needed
        worldPolygon = turf.difference(worldPolygon, buffered);
    }
});
var resultPolygon = L.polygon(worldPolygon.geometry.coordinates, {
    color: 'black',
    fillColor: 'black',
    fillOpacity: 0.85
}).addTo(map);
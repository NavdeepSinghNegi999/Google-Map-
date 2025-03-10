let map;
let pathCoordinates = [];
let polyline;
let tracking = false;
let watchId;
let marker = null;
let stopMarkers = [];
let lastPosition = null;
let lastUpdateTime = null;

// Initialize map and wait for user location
function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            let userLat = position.coords.latitude;
            let userLng = position.coords.longitude;
            let userLocation = [userLat, userLng];

            console.log("User Location:", userLocation);

            // Create map centered at user's actual location
            map = L.map('map').setView(userLocation, 18); // Zoomed in for accuracy

            // Load OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // Initialize polyline for tracking path
            polyline = L.polyline([], { color: 'red', weight: 5, opacity: 1.0 }).addTo(map);

            // Add marker at the starting point
            marker = L.marker(userLocation).addTo(map).bindPopup("Starting Point").openPopup();

            lastPosition = userLocation;
            lastUpdateTime = Date.now();

        }, error => {
            console.error("Error getting location:", error);
            alert("Error getting location: " + error.message);
        }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Start tracking user's path
function startTracking() {
    if (!map) {
        alert("Map is not initialized yet! Please allow location access.");
        return;
    }

    if (navigator.geolocation) {
        tracking = true;
        watchId = navigator.geolocation.watchPosition(position => {
            let newPoint = [position.coords.latitude, position.coords.longitude];
            let currentTime = Date.now();

            console.log("New Position:", newPoint);

            // If position changed significantly, update path
            if (!lastPosition || getDistance(lastPosition, newPoint) > 2) { // Moved more than 2 meters
                pathCoordinates.push(newPoint);
                polyline.setLatLngs(pathCoordinates);
                map.setView(newPoint, 18);

                // Move marker to new position
                if (!marker) {
                    marker = L.marker(newPoint).addTo(map);
                } else {
                    marker.setLatLng(newPoint);
                }

                lastPosition = newPoint;
                lastUpdateTime = currentTime;
            }

            // If stopped for more than 5 seconds, mark it
            if (currentTime - lastUpdateTime > 5000) {
                let stopMarker = L.circleMarker(newPoint, {
                    color: 'blue',  // Stop marker color
                    radius: 6
                }).addTo(map);
                stopMarker.bindPopup("Stopped Here").openPopup();
                stopMarkers.push(stopMarker);
                lastUpdateTime = currentTime;
            }

        }, error => {
            console.error("Error getting location:", error);
            alert("Error getting location: " + error.message);
        }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    } else {
        alert("Geolocation not supported.");
    }
}

// Stop tracking
function stopTracking() {
    if (tracking) {
        navigator.geolocation.clearWatch(watchId);
        tracking = false;
        alert("Tracking stopped.");
    }
}

// Retrace the walked path
function retracePath() {
    if (pathCoordinates.length === 0) {
        alert("No path to retrace!");
        return;
    }

    let index = pathCoordinates.length - 1;
    let retraceMarker = L.marker(pathCoordinates[index]).addTo(map);

    let retraceInterval = setInterval(() => {
        if (index < 0) {
            clearInterval(retraceInterval);
            retraceMarker.bindPopup("You have returned!").openPopup();
            return;
        }
        map.setView(pathCoordinates[index], 18);
        retraceMarker.setLatLng(pathCoordinates[index]);
        index--;
    }, 1000);
}

// Calculate distance between two points (in meters)
function getDistance(pos1, pos2) {
    const R = 6371e3; // Earth's radius in meters
    const lat1 = pos1[0] * (Math.PI / 180);
    const lat2 = pos2[0] * (Math.PI / 180);
    const deltaLat = (pos2[0] - pos1[0]) * (Math.PI / 180);
    const deltaLng = (pos2[1] - pos1[1]) * (Math.PI / 180);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Load map when page loads
window.onload = initMap;

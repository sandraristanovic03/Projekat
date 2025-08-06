document.addEventListener('DOMContentLoaded', function () {
  var map = L.map('map').setView([45.25, 19.84], 13);

  // OpenStreetMap sloj
  var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Raster sloj sa GeoServera
  var rasterLayer = L.tileLayer.wms('http://localhost:8080/geoserver/knjizara_ws/wms', {
    layers: 'knjizara_ws:knjizara_rasterr',
    format: 'image/png',
    transparent: true,
    attribution: 'GeoServer raster sloj'
  }).addTo(map);

  var wmsLayer = null;
  var marker = null;

  // Funkcija za prikaz informacija ispod mape sa linkom na više informacija
  function prikaziInfo(geojsonFeature) {
    var infoContainer = document.getElementById('infoContainer');

    if (!geojsonFeature || !geojsonFeature.properties) {
      infoContainer.innerHTML = "<p>Knjižara nije pronađena.</p>";
      return;
    }

    var props = geojsonFeature.properties;

    // Mapiranje imena knjižara na fajlove
    var stranice = {
      "Vulkan": "vulkan.html",
      "Laguna": "laguna.html",
      "Sunce": "sunce.html",
      "Detalj": "detalj.html"
    };

    var fajl = stranice[props.name] || "#";

    infoContainer.innerHTML = `
      <h3>${props.name}</h3>
      <p><strong>Adresa:</strong> ${props.address}</p>
      <p><strong>Telefon:</strong> ${props.phone}</p>
      <p><strong>Radno vreme:</strong> ${props.working_hours}</p>
      <p><a href="${fajl}" target="_blank" style="color:blue; text-decoration:underline;">Više informacija</a></p>
    `;
  }

  // Funkcija za pretragu i prikaz rezultata
  function search() {
    var searchTerm = document.getElementById('searchInput').value.trim();

    if (searchTerm === '') {
      alert("Unesite ime knjižare za pretragu.");
      return;
    }

    var cql = "name ILIKE '%" + searchTerm + "%'";

    // Ukloni prethodni WMS sloj ako postoji
    if (wmsLayer) {
      map.removeLayer(wmsLayer);
    }

    wmsLayer = L.tileLayer.wms('http://localhost:8080/geoserver/knjizara_ws/wms', {
      layers: 'knjizara_ws:knjizara',
      format: 'image/png',
      transparent: true,
      cql_filter: cql
    }).addTo(map);

    var wfsUrl = `http://localhost:8080/geoserver/knjizara_ws/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=knjizara_ws:knjizara&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    fetch(wfsUrl)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          let feature = data.features[0];
          prikaziInfo(feature);

          var coords = feature.geometry.coordinates;
          var latlng = [coords[1], coords[0]];
          map.setView(latlng, 17);

          // Ako već postoji marker, ukloni ga
          if (marker) {
            map.removeLayer(marker);
          }
          // Dodaj marker na lokaciju knjižare
          marker = L.marker(latlng, {icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          })}).addTo(map);
        } else {
          prikaziInfo(null);
          if (marker) {
            map.removeLayer(marker);
          }
        }
      })
      .catch(err => {
        console.error('Greška pri WFS zahtevu:', err);
        prikaziInfo(null);
        if (marker) {
          map.removeLayer(marker);
        }
      });
  }

  // Event listener za dugme pretrage
  document.getElementById('searchButton').onclick = search;
});




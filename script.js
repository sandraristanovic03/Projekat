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

  // WMS sloj za pretragu
  var wmsLayer = null;

  // Funkcija za prikaz informacija ispod mape
  function prikaziInfo(geojsonFeature) {
    var infoContainer = document.getElementById('infoContainer');

    if (!geojsonFeature || !geojsonFeature.properties) {
      infoContainer.innerHTML = "<p>Knjižara nije pronađena.</p>";
      return;
    }

    var props = geojsonFeature.properties;

    infoContainer.innerHTML = `
      <h3>${props.naziv}</h3>
      <p><strong>Adresa:</strong> ${props.adresa}</p>
      <p><strong>Telefon:</strong> ${props.telefon}</p>
      <p><strong>Radno vreme:</strong> ${props.radno_vreme}</p>
    `;
  }

  // Funkcija za slanje WFS zahteva i dobijanje GeoJSON podataka
  function search() {
    var searchTerm = document.getElementById('searchInput').value.trim();

    if (searchTerm === '') {
      alert("Unesite ime knjižare za pretragu.");
      return;
    }

    // Prikaži WMS sloj 
    var cql = "naziv ILIKE '%" + searchTerm + "%'";
    if (wmsLayer) {
      map.removeLayer(wmsLayer);
    }

    wmsLayer = L.tileLayer.wms('http://localhost:8080/geoserver/knjizara_ws/wms', {
      layers: 'knjizara_ws:knjizara',
      format: 'image/png',
      transparent: true,
      cql_filter: cql
    }).addTo(map);

    // WFS GeoJSON zahtev
    var wfsUrl = `http://localhost:8080/geoserver/knjizara_ws/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=knjizara_ws:knjizara&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cql)}`;

    fetch(wfsUrl)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          let feature = data.features[0];
          prikaziInfo(feature);

          // Zumiranje na lokaciju
          var coords = feature.geometry.coordinates;
          var latlng = [coords[1], coords[0]];
          map.setView(latlng, 17);

          // Marker na lokaciji
          L.marker(latlng).addTo(map);
        } else {
          prikaziInfo(null);
        }
      })
      .catch(err => {
        console.error('Greška pri WFS zahtevu:', err);
        prikaziInfo(null);
      });
  }

  // Event listener za dugme
  document.getElementById('searchButton').onclick = search;
});


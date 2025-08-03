document.addEventListener('DOMContentLoaded', function () {
  var map = L.map('map').setView([45.25, 19.84], 13);

  // OpenStreetMap kao osnovni sloj
  var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Raster sloj sa GeoServera (koristi pravi URL i naziv sloja)
  var rasterLayer = L.tileLayer.wms('http://localhost:8080/geoserver/knjizara_ws/wms', {
    layers: 'knjizara_ws:knjizara_rasterr',
    format: 'image/png',      // OBAVEZNO format image/png
    transparent: true,
    attribution: 'GeoServer raster sloj'
  }).addTo(map);

  // Vektorski WMS sloj - za pretragu knjižara
  var wmsLayer = null;

  // Lokalna baza podataka knjižara
  var knjizareData = {
    "Laguna": {
      address: "Sentandrejski put 11",
      phone: "0212701702",
      working_hours: "10 do 22",
      more_info_page: "laguna.html"
    },
    "Detalj": {
      address: "Radomira Raše Radujkovića 3",
      phone: "0211234567",
      working_hours: "9 do 21",
      more_info_page: "detalj.html"
    },
    "Vulkan": {
      address: "Zmaj Jovina 24",
      phone: "0114540900",
      working_hours: "9 do 22",
      more_info_page: "vulkan.html"
    },
    "Sunce": {
      address: "Gajeva 16",
      phone: "061311327",
      working_hours: "8 do 20",
      more_info_page: "sunce.html"
    }
  };

  function prikaziInfo(ime) {
    var infoContainer = document.getElementById('infoContainer');
    var info = knjizareData[ime];
    if (!info) {
      infoContainer.innerHTML = "<p>Knjižara nije pronađena u lokalnoj bazi podataka.</p>";
      return;
    }
    infoContainer.innerHTML = `
      <h3>${ime}</h3>
      <p><strong>Adresa:</strong> ${info.address}</p>
      <p><strong>Telefon:</strong> ${info.phone}</p>
      <p><strong>Radno vreme:</strong> ${info.working_hours}</p>
      <p><a href="${info.more_info_page}">Više informacija</a></p>
    `;
  }

  function search() {
    var searchTerm = document.getElementById('searchInput').value.trim();

    if (searchTerm === '') {
      alert("Unesite ime knjižare za pretragu.");
      return;
    }

    var cql = "name ILIKE '%" + searchTerm + "%'";

    if (wmsLayer) {
      map.removeLayer(wmsLayer);
    }

    wmsLayer = L.tileLayer.wms('http://localhost:8080/geoserver/knjizara_ws/wms', {
      layers: 'knjizara_ws:knjizara',
      format: 'image/png',
      transparent: true,
      cql_filter: cql
    }).addTo(map);

    var imeFormatirano = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();
    prikaziInfo(imeFormatirano);
  }

  document.getElementById('searchButton').onclick = search;
});

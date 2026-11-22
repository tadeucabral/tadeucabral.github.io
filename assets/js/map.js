/* ============================================
   Collaborations Map — Leaflet + OpenStreetMap (CARTO tiles)
   Edit the LOCATIONS array to add/remove pins.
   The map supports dark/light theme swap.
   ============================================ */
(function () {
  'use strict';

  var mapEl = document.getElementById('collab-map');
  if (!mapEl || typeof L === 'undefined') return;

  var CARTO_API_KEY = 'cb1_5e0g_1_382a3683e474bccb37abd9df';

  // -------------------------------------------------
  // 1. DATA — edit here to add/remove collaborators
  // -------------------------------------------------
  var LOCATIONS = [
    {
      name: 'Prof. Dr. Cláudio F. Tormena',
      org: 'University of Campinas (UNICAMP)',
      city: 'Campinas, Brazil',
      coords: [-22.817, -47.069],
      role: 'NMR method development · DOSY · chiral recognition'
    },
    {
      name: 'Prof. Dr. Matthias Stein',
      org: 'Max Planck Institute for Dynamics of Complex Technical Systems',
      city: 'Magdeburg, Germany',
      coords: [52.130, 11.640],
      role: 'Molecular dynamics · QM/MM · enantioselective recognition'
    },
    {
      name: 'Prof. Dr. Mathias Nilsson',
      org: 'University of Manchester',
      city: 'Manchester, UK',
      coords: [53.466, -2.233],
      role: 'Diffusion NMR · pulse sequence design · GNAT'
    },
    {
      name: 'Dr. Guilherme F. Dal Poggetto',
      org: 'Merck & Co.',
      city: 'Rahway, NJ, USA',
      coords: [40.608, -74.277],
      role: 'Industrial NMR applications · data processing'
    },
    {
      name: 'Prof. Dr. Julio C. Pastre',
      org: 'University of Campinas (UNICAMP)',
      city: 'Campinas, Brazil',
      coords: [-22.818, -47.070],
      role: 'Mechanistic organic chemistry · reaction monitoring'
    },
    {
      name: 'Prof. Dr. Marco A. B. Ferreira',
      org: 'Universidade Federal de São Carlos (UFSCar)',
      city: 'São Carlos, Brazil',
      coords: [-21.980, -47.880],
      role: 'Boron chemistry · NMR structural elucidation'
    },
    {
      name: 'Prof. Dr. Pablo S. Fernández',
      org: 'University of Campinas (UNICAMP)',
      city: 'Campinas, Brazil',
      coords: [-22.816, -47.068],
      role: 'Electrochemistry · quantitative NMR · cation effects'
    },
    {
      name: 'Prof. Dr. Watson Loh',
      org: 'University of Campinas (UNICAMP)',
      city: 'Campinas, Brazil',
      coords: [-22.815, -47.071],
      role: 'Supramolecular systems · surfactants · DOSY'
    },
    {
      name: 'Prof. Dr. Luciano M. Liao',
      org: 'Universidade Federal de Goiás (UFG)',
      city: 'Goiânia, Brazil',
      coords: [-16.680, -49.253],
      role: '3D HSQC-DOSY · complex mixture analysis'
    },
    {
      name: 'Prof. Dr. Rodrigo G. Amorim',
      org: 'Universidade Federal Fluminense (UFF)',
      city: 'Volta Redonda, Brazil',
      coords: [-22.523, -44.104],
      role: 'DFT of 2D materials · gas sensing · nanodevices'
    }
  ];

  // -------------------------------------------------
  // 2. INIT MAP
  // -------------------------------------------------
  var map = L.map('collab-map', {
    center: [15, -20],
    zoom: 2,
    minZoom: 2,
    maxZoom: 6,
    scrollWheelZoom: false,
    worldCopyJump: true,
    zoomControl: true,
    attributionControl: true
  });

  // -------------------------------------------------
  // 3. TILE LAYERS (dark & light) — swapped with theme
  // -------------------------------------------------
  var DARK_TILES =
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=' +
    encodeURIComponent(CARTO_API_KEY);
  var LIGHT_TILES =
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=' +
    encodeURIComponent(CARTO_API_KEY);

  var isLight = document.documentElement.getAttribute('data-theme') === 'light';

  var tiles = L.tileLayer(isLight ? LIGHT_TILES : DARK_TILES, {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Theme toggle sync
  var themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      var nowLight = document.documentElement.getAttribute('data-theme') === 'light';
      tiles.setUrl(nowLight ? LIGHT_TILES : DARK_TILES);
    });
  }

  // -------------------------------------------------
  // 4. CUSTOM PIN ICON (teal dot with pulsing ring)
  // -------------------------------------------------
  var pinIcon = L.divIcon({
    className: 'collab-pin',
    html: '<span class="collab-pin__dot"></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12]
  });

  // -------------------------------------------------
  // 5. ADD MARKERS
  // -------------------------------------------------
  LOCATIONS.forEach(function (loc) {
    var marker = L.marker(loc.coords, { icon: pinIcon, riseOnHover: true })
      .addTo(map);

    marker.bindTooltip(
      '<strong>' + loc.name + '</strong><br>' + loc.org + '<br><em>' + loc.city + '</em>',
      { direction: 'top', offset: [0, -8], className: 'collab-tooltip', opacity: 1 }
    );

    marker.bindPopup(
      '<div class="collab-popup">' +
        '<h4>' + loc.name + '</h4>' +
        '<p class="collab-popup__org">' + loc.org + '</p>' +
        '<p class="collab-popup__city">' + loc.city + '</p>' +
        '<p class="collab-popup__role">' + loc.role + '</p>' +
      '</div>',
      { maxWidth: 260, closeButton: true }
    );
  });

  // -------------------------------------------------
  // 6. FORCE RESIZE ON LOAD (helps in some layouts)
  // -------------------------------------------------
  setTimeout(function () { map.invalidateSize(); }, 200);
})();
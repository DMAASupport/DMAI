(function () {
  'use strict';

  // ── DMAA Project Locations ─────────────────────────────────────────────
  const LOCATIONS = [
    {
      id: 'vienna', label: 'Vienna', country: 'Austria', hub: true,
      lat: 48.2085, lng: 16.3731,
      projects: [
        { name: 'DMAA Headquarters',       type: 'Studio',                 status: 'hq'        },
        { name: 'Vienna TWENTYTWO',         type: 'High-Rise Mixed-Use',    status: 'ongoing'   },
        { name: 'MedUni Campus',            type: 'Educational / Medical',  status: 'ongoing'   },
        { name: 'Althan Quartier',          type: 'Urban Development',      status: 'ongoing'   },
        { name: 'Eibengasse H2',            type: 'Residential',            status: 'past'      },
        { name: 'City Lofts Wienerberg',    type: 'Residential Mixed-Use',  status: 'completed' },
        { name: 'High-Rise Wienerberg',     type: 'Residential High-Rise',  status: 'completed' },
      ]
    },
    {
      id: 'erl', label: 'Erl', country: 'Austria',
      lat: 47.690, lng: 12.141,
      projects: [{ name: 'Festival Hall Erl', type: 'Concert Hall', status: 'completed' }]
    },
    {
      id: 'frankfurt', label: 'Frankfurt', country: 'Germany',
      lat: 50.110, lng: 8.682,
      projects: [{ name: 'ga8 Frankfurt', type: 'Mixed-Use', status: 'past' }]
    },
    {
      id: 'stuttgart', label: 'Stuttgart', country: 'Germany',
      lat: 48.780, lng: 9.180,
      projects: [
        { name: 'Porsche Museum', type: 'Cultural / Museum', status: 'completed' },
        { name: 'HFM Stuttgart',  type: 'Educational',       status: 'completed' },
      ]
    },
    {
      id: 'amsterdam', label: 'Amsterdam', country: 'Netherlands',
      lat: 52.386, lng: 4.902,
      projects: [{ name: 'Eye Filmmuseum', type: 'Cultural', status: 'completed' }]
    },
    {
      id: 'goyang', label: 'Goyang', country: 'South Korea',
      lat: 37.656, lng: 126.835,
      projects: [{ name: 'Hyundai Motorstudio', type: 'Showroom / Cultural', status: 'completed' }]
    },
    {
      id: 'taiyuan', label: 'Taiyuan', country: 'China',
      lat: 37.870, lng: 112.549,
      projects: [{ name: 'Taiyuan Botanical Garden', type: 'Botanical Garden', status: 'completed' }]
    },
    {
      id: 'shanghai', label: 'Shanghai', country: 'China',
      lat: 31.230, lng: 121.474,
      projects: [{ name: 'Expo Cultural Park', type: 'Cultural / Greenhouse', status: 'completed' }]
    },
  ];

  const TOTAL_PROJECTS  = LOCATIONS.reduce((s, l) => s + l.projects.length, 0);
  const TOTAL_COUNTRIES = new Set(LOCATIONS.map(l => l.country)).size;

  const STATUS_LABEL = {
    hq: 'Headquarters', ongoing: 'Ongoing',
    past: 'Past Project', completed: 'Portfolio'
  };

  let isOpen  = false;
  let leafMap = null;

  // ── Public toggle ─────────────────────────────────────────────────────────
  window.toggleWorldMap = function () {
    const panel = document.getElementById('world-map-panel');
    if (!panel) return;
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('wm-open');
      document.body.style.overflow = 'hidden';
      updateStats();
      setTimeout(initMap, 80);
    } else {
      panel.classList.remove('wm-open');
      document.body.style.overflow = '';
    }
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) window.toggleWorldMap();
  });

  function updateStats() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('wm-stat-projects',  TOTAL_PROJECTS);
    set('wm-stat-cities',    LOCATIONS.length);
    set('wm-stat-countries', TOTAL_COUNTRIES);
  }

  // ── Init Leaflet ──────────────────────────────────────────────────────────
  function initMap() {
    const container = document.getElementById('wm-leaflet');
    if (!container) return;

    if (leafMap) {
      leafMap.invalidateSize();
      return;
    }

    leafMap = L.map('wm-leaflet', {
      center: [40, 55],
      zoom: 3,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(leafMap);

    // Controls
    L.control.zoom({ position: 'bottomright' }).addTo(leafMap);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(leafMap);

    // Markers
    const latlngs = [];
    LOCATIONS.forEach(loc => {
      latlngs.push([loc.lat, loc.lng]);
      addMarker(loc);
    });

    // Fit all locations into view
    leafMap.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50], maxZoom: 5 });
  }

  // ── Marker ────────────────────────────────────────────────────────────────
  function addMarker(loc) {
    const cls    = markerClass(loc);
    const size   = loc.hub ? 16 : 11;
    const anchor = size / 2;

    const icon = L.divIcon({
      className: '',
      html: `<div class="wm-marker wm-marker--${cls}" title="${loc.label}"></div>`,
      iconSize:     [size, size],
      iconAnchor:   [anchor, anchor],
      popupAnchor:  [0, -(anchor + 8)],
    });

    const marker = L.marker([loc.lat, loc.lng], { icon });

    // Hover tooltip: city name only
    marker.bindTooltip(loc.label, {
      direction: 'top',
      className: 'wm-tip',
      offset: [0, -(anchor + 4)],
    });

    // Click popup: full project details
    marker.bindPopup(popupHTML(loc), {
      className: 'wm-popup',
      maxWidth: 300,
      minWidth: 210,
    });

    marker.addTo(leafMap);
  }

  // ── Popup HTML ────────────────────────────────────────────────────────────
  function popupHTML(loc) {
    const rows = loc.projects.map(p => `
      <div class="wm-pp-row">
        <span class="wm-pp-dot" style="background:${dotColor(p.status)}"></span>
        <div class="wm-pp-info">
          <div class="wm-pp-name">${p.name}</div>
          <div class="wm-pp-meta">${p.type}&ensp;&middot;&ensp;${STATUS_LABEL[p.status] || ''}</div>
        </div>
      </div>`).join('');

    return `
      <div class="wm-pp">
        <div class="wm-pp-header">
          <div class="wm-pp-city">${loc.label}</div>
          <div class="wm-pp-country">${loc.country}</div>
        </div>
        <div class="wm-pp-projects">${rows}</div>
      </div>`;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function markerClass(loc) {
    if (loc.hub) return 'hub';
    if (loc.projects.some(p => p.status === 'ongoing')) return 'ongoing';
    if (loc.projects.some(p => p.status === 'past'))    return 'past';
    return 'completed';
  }

  function dotColor(status) {
    return status === 'hq'        ? '#ffffff'
         : status === 'ongoing'   ? '#00d4ff'
         : status === 'past'      ? '#a78bfa'
         : 'rgba(255,255,255,0.45)';
  }

})();

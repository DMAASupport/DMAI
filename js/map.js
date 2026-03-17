(function () {
  'use strict';

  // ── DMAA Project Locations ─────────────────────────────────────────────
  // Grouped by city to avoid overlapping markers
  const LOCATIONS = [
    {
      id: 'vienna', label: 'Vienna', country: 'Austria', hub: true,
      lat: 48.2085, lng: 16.3731,
      projects: [
        { name: 'DMAA Headquarters',      type: 'Studio',                 status: 'hq'        },
        { name: 'Vienna TWENTYTWO',        type: 'High-Rise Mixed-Use',    status: 'ongoing'   },
        { name: 'MedUni Campus',           type: 'Educational / Medical',  status: 'ongoing'   },
        { name: 'Althan Quartier',         type: 'Urban Development',      status: 'ongoing'   },
        { name: 'Eibengasse H2',           type: 'Residential',            status: 'past'      },
        { name: 'City Lofts Wienerberg',   type: 'Residential Mixed-Use',  status: 'completed' },
        { name: 'High-Rise Wienerberg',    type: 'Residential High-Rise',  status: 'completed' },
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

  // Equirectangular viewport
  const VW = 960, VH = 500;

  let isOpen    = false;
  let worldTopo = null;
  let built     = false;

  // ── Public toggle ─────────────────────────────────────────────────────────
  window.toggleWorldMap = function () {
    const panel = document.getElementById('world-map-panel');
    if (!panel) return;
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('wm-open');
      document.body.style.overflow = 'hidden';
      const sp = id => { const el = document.getElementById(id); if (el) return el; };
      const sp1 = sp('wm-stat-projects');  if (sp1) sp1.textContent = TOTAL_PROJECTS;
      const sp2 = sp('wm-stat-cities');    if (sp2) sp2.textContent = LOCATIONS.length;
      const sp3 = sp('wm-stat-countries'); if (sp3) sp3.textContent = TOTAL_COUNTRIES;
      if (!built) setTimeout(buildMap, 60);
    } else {
      panel.classList.remove('wm-open');
      document.body.style.overflow = '';
    }
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) window.toggleWorldMap();
  });

  // ── Equirectangular projection ────────────────────────────────────────────
  function proj(lat, lng) {
    return [(lng + 180) * VW / 360, (90 - lat) * VH / 180];
  }

  // ── Build full map ────────────────────────────────────────────────────────
  async function buildMap() {
    const container = document.getElementById('wm-container');
    const canvas    = document.getElementById('wm-canvas');
    const svg       = document.getElementById('wm-svg');
    if (!canvas || !svg || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W   = container.clientWidth;
    const H   = Math.round(W * VH / VW);

    canvas.width        = W * dpr;
    canvas.height       = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    container.style.height = H + 'px';
    svg.style.width  = W + 'px';
    svg.style.height = H + 'px';

    // Load world atlas
    if (!worldTopo) {
      try {
        const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        worldTopo = await res.json();
      } catch (e) {
        console.warn('WorldMap: topology unavailable', e);
      }
    }

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawDots(ctx, W, H);
    buildSVG(svg);
    built = true;
  }

  // ── Dotted world map (canvas) ─────────────────────────────────────────────
  function drawDots(ctx, W, H) {
    const scaleX = W / VW, scaleY = H / VH;

    if (worldTopo && window.topojson) {
      // Draw land to offscreen canvas, sample pixels → dots on land only
      const off    = Object.assign(document.createElement('canvas'), { width: W, height: H });
      const offCtx = off.getContext('2d');
      offCtx.fillStyle = '#fff';

      const land     = window.topojson.feature(worldTopo, worldTopo.objects.land);
      const features = land.features || [land];

      const drawRings = rings => rings.forEach(ring => {
        offCtx.beginPath();
        ring.forEach(([lng, lat], i) => {
          const [px, py] = proj(lat, lng);
          i === 0 ? offCtx.moveTo(px * scaleX, py * scaleY)
                  : offCtx.lineTo(px * scaleX, py * scaleY);
        });
        offCtx.closePath();
        offCtx.fill();
      });

      const drawGeom = geom => {
        if (!geom) return;
        if      (geom.type === 'Polygon')            drawRings(geom.coordinates);
        else if (geom.type === 'MultiPolygon')       geom.coordinates.forEach(p => drawRings(p));
        else if (geom.type === 'GeometryCollection') geom.geometries.forEach(drawGeom);
      };
      features.forEach(f => drawGeom(f.geometry || f));

      const pix = offCtx.getImageData(0, 0, W, H).data;
      const gap = Math.max(3.5, W / 230);
      const r   = gap * 0.27;

      for (let x = gap; x < W - gap; x += gap) {
        for (let y = gap; y < H - gap; y += gap) {
          const ix = Math.min(Math.round(x), W - 1);
          const iy = Math.min(Math.round(y), H - 1);
          if (pix[(iy * W + ix) * 4] > 128) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.11)';
            ctx.fill();
          }
        }
      }
    } else {
      // Fallback: full uniform grid at low opacity
      const gap = W / 100;
      const r   = gap * 0.22;
      for (let x = gap; x < W - gap; x += gap) {
        for (let y = gap; y < H - gap; y += gap) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fill();
        }
      }
    }
  }

  // ── SVG overlay (static markers only) ───────────────────────────────────
  function buildSVG(svg) {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const defs = ns('defs');
    defs.innerHTML = `
      <filter id="wm-glow" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    LOCATIONS.forEach(loc => {
      const [px, py]   = proj(loc.lat, loc.lng);
      const isHub      = !!loc.hub;
      const hasOngoing = loc.projects.some(p => p.status === 'ongoing' || p.status === 'hq');
      const hasPast    = loc.projects.some(p => p.status === 'past');

      const color = isHub      ? '#ffffff'
                  : hasOngoing ? '#00d4ff'
                  : hasPast    ? '#a78bfa'
                  :              'rgba(255,255,255,0.6)';

      const r = isHub ? 5 : 3.5;

      const g = ns('g');
      g.setAttribute('transform', `translate(${px.toFixed(1)},${py.toFixed(1)})`);
      g.setAttribute('style', 'cursor:pointer');

      // Main dot
      const dot = ns('circle');
      dot.setAttribute('r', r);
      dot.setAttribute('fill', color);
      dot.setAttribute('filter', 'url(#wm-glow)');
      g.appendChild(dot);

      // Invisible hit area
      const hit = ns('circle');
      hit.setAttribute('r', '14');
      hit.setAttribute('fill', 'transparent');
      g.appendChild(hit);

      // Hover: scale dot + show tooltip
      g.addEventListener('mouseenter', e => {
        dot.setAttribute('r', r + 2);
        showTip(e, loc);
      });
      g.addEventListener('mousemove',  e => showTip(e, loc));
      g.addEventListener('mouseleave', () => {
        dot.setAttribute('r', r);
        hideTip();
      });

      svg.appendChild(g);
    });
  }

  // ── Tooltip ───────────────────────────────────────────────────────────────
  function showTip(e, loc) {
    const tip = document.getElementById('wm-tooltip');
    if (!tip) return;

    const statusLabel = { hq: 'Headquarters', ongoing: 'Ongoing', past: 'Past', completed: 'Portfolio' };
    const pList = loc.projects.map(p => `
      <div class="wmt-proj">
        <span class="wmt-dot" style="background:${dotColor(p.status)}"></span>
        <span class="wmt-pname">${p.name}</span>
        <span class="wmt-ptype">${statusLabel[p.status] || ''}</span>
      </div>`).join('');

    tip.innerHTML = `
      <div class="wmt-city">${loc.label}</div>
      <div class="wmt-country">${loc.country}</div>
      <div class="wmt-projects">${pList}</div>
    `;

    tip.classList.add('wmt-vis');

    // Position with edge clamping (fixed coords)
    requestAnimationFrame(() => {
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      let x = e.clientX + 18;
      let y = e.clientY - 12;
      if (x + tw > window.innerWidth  - 12) x = e.clientX - tw - 14;
      if (y + th > window.innerHeight - 12) y = e.clientY - th - 14;
      tip.style.left = Math.max(8, x) + 'px';
      tip.style.top  = Math.max(8, y) + 'px';
    });
  }

  function hideTip() {
    const tip = document.getElementById('wm-tooltip');
    if (tip) tip.classList.remove('wmt-vis');
  }

  function dotColor(status) {
    return status === 'hq'        ? '#ffffff'
         : status === 'ongoing'   ? '#00d4ff'
         : status === 'past'      ? '#a78bfa'
         : 'rgba(255,255,255,0.45)';
  }

  // ── SVG helpers ───────────────────────────────────────────────────────────
  function ns(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

})();

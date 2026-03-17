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
      id: 'neom', label: 'NEOM', country: 'Saudi Arabia',
      lat: 27.990, lng: 35.182,
      projects: [{ name: 'NEOM AI Campus', type: 'AI Campus', status: 'ongoing' }]
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

  // ── SVG overlay (arcs + markers) ─────────────────────────────────────────
  function buildSVG(svg) {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Defs
    const defs = ns('defs');
    defs.innerHTML = `
      <filter id="wm-glow" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="wm-arc-east" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#00d4ff" stop-opacity="0.1"/>
        <stop offset="40%"  stop-color="#00d4ff" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#a78bfa" stop-opacity="0.35"/>
      </linearGradient>
      <linearGradient id="wm-arc-west" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%"   stop-color="#00d4ff" stop-opacity="0.1"/>
        <stop offset="40%"  stop-color="#00d4ff" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#a78bfa" stop-opacity="0.35"/>
      </linearGradient>
      <radialGradient id="wm-halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#00d4ff" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#00d4ff" stop-opacity="0"/>
      </radialGradient>
    `;
    svg.appendChild(defs);

    const hub    = LOCATIONS.find(l => l.hub);
    const [hx, hy] = proj(hub.lat, hub.lng);

    // Arc targets: skip locations very close to Vienna
    const arcTargets = LOCATIONS.filter(l => !l.hub && Math.abs(l.lng - hub.lng) > 4);

    // ── Arcs ──
    arcTargets.forEach((loc, i) => {
      const [tx, ty] = proj(loc.lat, loc.lng);
      const d        = arcPath(hx, hy, tx, ty);
      const gradId   = tx >= hx ? 'wm-arc-east' : 'wm-arc-west';

      const path = ns('path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', `url(#${gradId})`);
      path.setAttribute('stroke-width', '0.75');
      path.setAttribute('opacity', '0');
      svg.appendChild(path);

      // Exact path length for clean dash animation
      const len = path.getTotalLength() + 1;
      path.setAttribute('stroke-dasharray', len);
      path.setAttribute('stroke-dashoffset', len);

      const t0 = (0.4 + i * 0.13).toFixed(2) + 's';

      svgAnim(path, 'stroke-dashoffset', len, 0, '1.6s', t0, 'spline', '0.4 0 0.2 1');
      svgAnim(path, 'opacity', '0', '0.38', '0.25s', t0, 'linear');

      // Traveling dot
      const dot = ns('circle');
      dot.setAttribute('r', '2');
      dot.setAttribute('fill', '#00d4ff');
      dot.setAttribute('opacity', '0');

      const motion = ns('animateMotion');
      motion.setAttribute('path', d);
      motion.setAttribute('dur', (1.5 + i * 0.07).toFixed(2) + 's');
      motion.setAttribute('begin', (0.5 + i * 0.13).toFixed(2) + 's');
      motion.setAttribute('repeatCount', 'indefinite');
      motion.setAttribute('calcMode', 'spline');
      motion.setAttribute('keySplines', '0.4 0 0.6 1');

      const fadeA = ns('animate');
      fadeA.setAttribute('attributeName', 'opacity');
      fadeA.setAttribute('values', '0;0.9;0.9;0');
      fadeA.setAttribute('keyTimes', '0;0.06;0.9;1');
      fadeA.setAttribute('dur', (1.5 + i * 0.07).toFixed(2) + 's');
      fadeA.setAttribute('begin', (0.5 + i * 0.13).toFixed(2) + 's');
      fadeA.setAttribute('repeatCount', 'indefinite');

      dot.appendChild(motion);
      dot.appendChild(fadeA);
      svg.appendChild(dot);
    });

    // ── Location markers ──
    LOCATIONS.forEach((loc, i) => {
      const [px, py] = proj(loc.lat, loc.lng);
      const isHub     = !!loc.hub;
      const hasOngoing = loc.projects.some(p => p.status === 'ongoing' || p.status === 'hq');
      const hasPast    = loc.projects.some(p => p.status === 'past');

      const color = isHub       ? '#ffffff'
                  : hasOngoing  ? '#00d4ff'
                  : hasPast     ? '#a78bfa'
                  :               'rgba(255,255,255,0.6)';

      const r = isHub ? 5 : loc.projects.length >= 3 ? 4.5 : 3.5;

      const g = ns('g');
      g.setAttribute('class', 'wm-loc');
      g.setAttribute('transform', `translate(${px.toFixed(1)},${py.toFixed(1)})`);
      g.setAttribute('data-id', loc.id);
      g.style.setProperty('--wm-appear', (0.15 + i * 0.07).toFixed(2) + 's');

      // Hub ambient halo
      if (isHub) {
        const halo = ns('circle');
        halo.setAttribute('r', '26');
        halo.setAttribute('fill', 'url(#wm-halo)');
        g.appendChild(halo);
      }

      // Pulse ring 1
      const p1 = ns('circle');
      p1.setAttribute('r', r + 1);
      p1.setAttribute('fill', 'none');
      p1.setAttribute('stroke', color);
      p1.setAttribute('stroke-width', '0.8');
      svgAnim(p1, 'r',       r + 1, r + 16, '2.8s', (i * 0.3).toFixed(2) + 's');
      svgAnim(p1, 'opacity', '0.5', '0',    '2.8s', (i * 0.3).toFixed(2) + 's');
      g.appendChild(p1);

      // Hub gets a second slower pulse
      if (isHub) {
        const p2 = ns('circle');
        p2.setAttribute('r', r + 3);
        p2.setAttribute('fill', 'none');
        p2.setAttribute('stroke', color);
        p2.setAttribute('stroke-width', '0.5');
        svgAnim(p2, 'r',       r + 3, r + 30, '2.8s', '1.2s');
        svgAnim(p2, 'opacity', '0.3', '0',    '2.8s', '1.2s');
        g.appendChild(p2);
      }

      // Main dot
      const dot = ns('circle');
      dot.setAttribute('r', r);
      dot.setAttribute('fill', color);
      dot.setAttribute('filter', 'url(#wm-glow)');
      dot.setAttribute('class', 'wm-dot');
      g.appendChild(dot);

      // Project count badge for multi-project cities
      if (loc.projects.length > 1) {
        const badge = ns('text');
        badge.setAttribute('x', r + 4);
        badge.setAttribute('y', -(r + 2));
        badge.setAttribute('font-size', '5.5');
        badge.setAttribute('font-family', 'Inter, sans-serif');
        badge.setAttribute('font-weight', '600');
        badge.setAttribute('fill', color);
        badge.setAttribute('opacity', '0.85');
        badge.textContent = loc.projects.length;
        g.appendChild(badge);
      }

      // Invisible hit area for easier hover
      const hit = ns('circle');
      hit.setAttribute('r', '14');
      hit.setAttribute('fill', 'transparent');
      g.appendChild(hit);

      // Hover events
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

  // ── Quadratic arc (lifts upward away from equator) ────────────────────────
  function arcPath(x1, y1, x2, y2) {
    const dx   = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const mx   = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const lift = Math.min(dist * 0.28, 60);
    // Perpendicular upward offset in screen coords
    const nx = -dy / dist, ny = dx / dist;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${(mx + nx * lift).toFixed(1)} ${(my + ny * lift - 20).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
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

  function svgAnim(el, attr, from, to, dur, begin, calcMode, keySplines) {
    const a = ns('animate');
    a.setAttribute('attributeName', attr);
    a.setAttribute('from', from);
    a.setAttribute('to',   to);
    a.setAttribute('dur',  dur);
    a.setAttribute('begin', begin);
    a.setAttribute('repeatCount', 'indefinite');
    if (calcMode)  a.setAttribute('calcMode',  calcMode);
    if (keySplines) a.setAttribute('keySplines', keySplines);
    el.appendChild(a);
  }

})();

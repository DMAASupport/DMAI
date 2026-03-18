(function () {
  'use strict';

  // ── Timeline (ms) ──────────────────────────────────────────────────────────
  const WELCOME_AT =  700;
  const LOGO_AT    = 1900;
  const LINE_AT    = 2700;
  const TAG_AT     = 2900;
  const FADEOUT_AT = 5800;
  const FLY_DUR    = 1200;   // logo fly-through scale duration
  const FADE_DELAY =  200;   // overlay fade starts this many ms after fly begins

  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  let animId = null, renderer = null, resizeHandler = null, skipped = false;
  const timers = [];

  // ── Helpers ────────────────────────────────────────────────────────────────
  function t(fn, delay) {
    const id = setTimeout(fn, delay);
    timers.push(id);
    return id;
  }

  function cleanupGL() {
    if (animId)        { cancelAnimationFrame(animId); animId = null; }
    if (renderer)      { renderer.dispose(); renderer = null; }
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
  }

  function triggerAppReveal() {
    const app = document.querySelector('.app-container');
    if (app) app.classList.add('app-reveal');
  }

  // ── Skip / Fly-through ─────────────────────────────────────────────────────
  function skipIntro() {
    if (skipped) return;
    skipped = true;
    timers.forEach(clearTimeout);

    // Fly through the logo: massive scale + fade
    const logo = document.getElementById('intro-logo');
    if (logo) {
      logo.style.transition =
        `transform ${FLY_DUR}ms cubic-bezier(0.16, 1, 0.3, 1),` +
        `opacity ${Math.round(FLY_DUR * 0.75)}ms ease ${FADE_DELAY}ms`;
      logo.style.transform = 'scale(50)';
      logo.style.opacity   = '0';
    }

    // Fade the overlay slightly after the fly begins
    overlay.style.transition    = `opacity ${FLY_DUR}ms cubic-bezier(0.4, 0, 0.2, 1) ${FADE_DELAY}ms`;
    overlay.style.opacity       = '0';
    overlay.style.pointerEvents = 'none';

    setTimeout(() => {
      overlay.remove();
      cleanupGL();
      triggerAppReveal();
    }, FLY_DUR + FADE_DELAY + 80);
  }

  // Click anywhere on overlay to skip
  overlay.addEventListener('click', skipIntro);

  // ── Skip hint ──────────────────────────────────────────────────────────────
  const hint = document.createElement('div');
  hint.id = 'intro-skip-hint';
  hint.textContent = '[ Click anywhere to initialize sequence ]';
  overlay.appendChild(hint);

  // ── Letter-reveal ──────────────────────────────────────────────────────────
  function reveal(el, gap) {
    const text = el.textContent;
    el.textContent = '';
    el.style.visibility = 'visible';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'intro-char';
      s.textContent = ch === ' ' ? '\u00a0' : ch;
      el.appendChild(s);
      t(() => s.classList.add('intro-char--on'), i * gap);
    });
  }

  // ── Sequence ───────────────────────────────────────────────────────────────
  t(() => reveal(document.getElementById('intro-welcome'), 90), WELCOME_AT);

  t(() => {
    document.getElementById('intro-logo').style.visibility = 'visible';
    reveal(document.getElementById('intro-dm'), 110);
  }, LOGO_AT);

  t(() => reveal(document.getElementById('intro-ai'), 115), LOGO_AT + 2 * 110 + 80);

  t(() => {
    const line = document.getElementById('intro-line');
    if (line) line.classList.add('intro-line--on');
  }, LINE_AT);

  t(() => {
    const tag = document.getElementById('intro-tag');
    if (tag) tag.classList.add('intro-tag--on');
  }, TAG_AT);

  // Auto fire fly-through at end of hold
  t(skipIntro, FADEOUT_AT);

  // ── WebGL Shader ───────────────────────────────────────────────────────────
  if (!window.THREE) return;
  const THREE  = window.THREE;
  const canvas = document.getElementById('intro-canvas');
  if (!canvas) return;

  const camera   = new THREE.Camera();
  camera.position.z = 1;
  const scene    = new THREE.Scene();
  const uniforms = {
    time:       { type: 'f',  value: 0.0 },
    resolution: { type: 'v2', value: new THREE.Vector2() }
  };

  /*
   * Architectural wireframe grid + topographic contour shader.
   * Renders a recession-faded orthogonal grid overlaid with slow-moving
   * elevation contours — straight, calculating, spatial. No circles.
   */
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform vec2  resolution;
      uniform float time;

      /* Returns antialiased line intensity at fractional grid position */
      float gridLine(float v, float spacing, float px) {
        float f = abs(fract(v / spacing + 0.5) - 0.5) * spacing;
        return 1.0 - smoothstep(0.0, px, f);
      }

      /*
       * Asymmetric multi-octave terrain — no circular symmetry.
       * Produces organic elevation ridges that look like topo maps.
       */
      float terrain(vec2 p) {
        float h  = sin(p.x * 1.10 + time * 0.040) * cos(p.y * 0.90 + time * 0.030) * 0.50;
              h += sin(p.x * 0.40 + p.y * 0.70  + time * 0.025) * 0.30;
              h += cos(p.x * 2.30 - p.y * 1.20  + time * 0.018) * 0.15;
              h += sin(p.x * 0.70 - p.y * 2.10  + time * 0.012) * 0.08;
              h += cos(p.x * 3.50 + p.y * 0.80  + time * 0.009) * 0.04;
        return h;
      }

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        uv *= 2.8;   /* zoom level — wider = more grid cells visible */

        /* ── Orthogonal grid ── */
        float gMaj = gridLine(uv.x, 1.00, 0.024) + gridLine(uv.y, 1.00, 0.024);
        float gMin = gridLine(uv.x, 0.25, 0.007) + gridLine(uv.y, 0.25, 0.007);

        /* Distance-based fade (recession toward edges) */
        float dist   = length(uv);
        float radFade = exp(-dist * 0.26);

        /* ── Topographic contours ── */
        float h       = terrain(uv);
        float contour = gridLine(h, 0.20, 0.016) * exp(-dist * 0.16);

        /* ── Brightness composition ── */
        float gBright = (gMaj * 0.88 + gMin * 0.32) * radFade;
        float cBright = contour * 0.52;

        /* Color palette: near-black base, deep cyan grid, soft lavender topo */
        vec3 bg     = vec3(0.026, 0.030, 0.048);
        vec3 gCol   = vec3(0.00, 0.52, 0.72) * gBright;
        vec3 cCol   = vec3(0.42, 0.34, 0.74) * cBright;

        vec3 col = bg + gCol + cCol;

        /* Circular vignette */
        col *= 1.0 - smoothstep(0.55, 1.85, dist * 0.68);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), material));

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  resizeHandler = function () {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
  };
  resizeHandler();
  window.addEventListener('resize', resizeHandler, { passive: true });

  (function animate() {
    if (!renderer) return;
    animId = requestAnimationFrame(animate);
    uniforms.time.value += 0.016;   /* ~1 unit per second at 60 fps */
    renderer.render(scene, camera);
  })();

})();

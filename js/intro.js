(function () {
  'use strict';

  // ── Timeline (ms) ────────────────────────────────────────────
  const WELCOME_AT  =  700;   // "WELCOME TO" letter reveal starts
  const LOGO_AT     = 1900;   // "DMAI" letter reveal starts
  const LINE_AT     = 2700;   // underline expands
  const TAG_AT      = 2900;   // tagline fades in
  const FADEOUT_AT  = 5800;   // fade begins — long hold to admire
  const FADE_DUR    = 1600;   // slow, cinematic fade

  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  let animId = null, renderer = null;

  // ── Letter-reveal ────────────────────────────────────────────
  function reveal(el, gap) {
    const text = el.textContent;
    el.textContent = '';
    el.style.visibility = 'visible';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'intro-char';
      s.textContent = ch === ' ' ? '\u00a0' : ch;
      el.appendChild(s);
      setTimeout(() => s.classList.add('intro-char--on'), i * gap);
    });
  }

  // ── Schedule text ────────────────────────────────────────────
  setTimeout(() => reveal(document.getElementById('intro-welcome'), 90),  WELCOME_AT);

  setTimeout(() => {
    document.getElementById('intro-logo').style.visibility = 'visible';
    reveal(document.getElementById('intro-dm'), 110);
  }, LOGO_AT);

  // AI starts after DM finishes (2 letters × 110ms + 80ms gap)
  setTimeout(() => {
    reveal(document.getElementById('intro-ai'), 115);
  }, LOGO_AT + 2 * 110 + 80);

  setTimeout(() => {
    const line = document.getElementById('intro-line');
    if (line) line.classList.add('intro-line--on');
  }, LINE_AT);

  setTimeout(() => {
    const tag = document.getElementById('intro-tag');
    if (tag) tag.classList.add('intro-tag--on');
  }, TAG_AT);

  // ── Fade out & cleanup ───────────────────────────────────────
  setTimeout(() => {
    overlay.style.transition = 'opacity ' + FADE_DUR + 'ms cubic-bezier(0.4, 0, 0.2, 1)';
    overlay.style.opacity    = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => {
      overlay.remove();
      if (animId)   cancelAnimationFrame(animId);
      if (renderer) renderer.dispose();
    }, FADE_DUR);
  }, FADEOUT_AT);

  // ── WebGL Shader ─────────────────────────────────────────────
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

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform vec2  resolution;
      uniform float time;

      float rnd(float x) { return fract(sin(x) * 1e4); }
      float rnd(vec2 st)  { return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453); }

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

        /* Mosaic / pixelate — the original look */
        vec2 ms = vec2(4.0, 2.0);
        vec2 ss = vec2(256.0);
        uv.x = floor(uv.x * ss.x / ms.x) / (ss.x / ms.x);
        uv.y = floor(uv.y * ss.y / ms.y) / (ss.y / ms.y);

        float dist = length(uv);
        float t    = time * 0.055 + rnd(uv.x) * 0.4;

        /* DMAA palette */
        vec3 cyan     = vec3(0.0,   0.831, 1.0  );
        vec3 lavender = vec3(0.655, 0.545, 0.98 );
        vec3 coral    = vec3(1.0,   0.42,  0.541);
        vec3 amber    = vec3(1.0,   0.753, 0.204);

        vec3 color = vec3(0.0);
        float lw = 0.00068;

        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          float ring = lw * fi * fi / abs(fract(t + fi * 0.012) - dist);
          float m1   = sin(time * 0.12 + fi * 1.3) * 0.5 + 0.5;
          float m2   = cos(time * 0.08 + fi * 0.9) * 0.5 + 0.5;
          vec3  c    = mix(mix(cyan, lavender, m1), mix(coral, amber, m2), 0.3);
          color     += ring * c;
        }

        /* Soft vignette */
        color *= 1.0 - dist * 0.38;

        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), material));

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  (function animate() {
    animId = requestAnimationFrame(animate);
    uniforms.time.value += 0.04;    /* original mosaic speed */
    renderer.render(scene, camera);
  })();
})();

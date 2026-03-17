(function () {
  'use strict';

  // ── Timeline (ms) ────────────────────────────────────────────
  const WELCOME_AT  =  700;   // "WELCOME TO" letter reveal starts
  const LOGO_AT     = 1900;   // "DMAI" letter reveal starts
  const LINE_AT     = 2700;   // underline expands
  const TAG_AT      = 2900;   // tagline fades in
  const FADEOUT_AT  = 4400;   // fade begins
  const FADE_DUR    = 1100;   // fade duration

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

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

        float dist  = length(uv);
        float angle = atan(uv.y, uv.x);

        /* Organic wobble — rings breathe and undulate */
        float wobble = 0.022 * sin(angle * 5.0 + time * 0.35)
                             * cos(angle * 2.0 - time * 0.2);
        float d = dist + wobble;

        /* DMAA palette */
        vec3 cyan     = vec3(0.0,   0.831, 1.0  );
        vec3 lavender = vec3(0.655, 0.545, 0.98 );
        vec3 coral    = vec3(1.0,   0.42,  0.541);

        vec3 color = vec3(0.0);

        /* 12 smooth expanding rings — no pixelation */
        for (int i = 0; i < 12; i++) {
          float fi    = float(i);
          float speed = 0.028 + fi * 0.003;
          float phase = fi * 0.0833;           /* evenly spaced */
          float life  = fract(time * speed + phase);
          float r     = life * 1.75;           /* expands outward */
          float fade  = pow(1.0 - life, 1.4); /* smooth fade-out */
          float w     = 0.007 - life * 0.005; /* gets thinner */
          float ring  = (w / (abs(d - r) + 0.0008)) * fade;
          ring = min(ring, 2.2);

          float hue = sin(time * 0.09 + fi * 1.15) * 0.5 + 0.5;
          vec3  c   = mix(cyan, lavender, hue);
          c = mix(c, coral, clamp(sin(time * 0.06 + fi * 0.85) * 0.25, 0.0, 1.0));

          color += ring * c * 0.65;
        }

        /* Soft central glow */
        color += cyan * (0.012 / (d * d + 0.015));

        /* Radial depth vignette */
        float vig = 1.0 - smoothstep(0.3, 1.5, dist);
        color = color * (0.12 + vig * 0.88);

        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), material));

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  (function animate() {
    animId = requestAnimationFrame(animate);
    uniforms.time.value += 0.018;   /* slower = smoother, more cinematic */
    renderer.render(scene, camera);
  })();
})();

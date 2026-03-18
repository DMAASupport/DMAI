(function () {
  'use strict';

  // ── Timeline (ms) — total duration ~6 s ──────────────────────
  const WELCOME_AT     =  700;   // "WELCOME TO" letter reveal
  const LOGO_AT        = 1900;   // "DMAI" letter reveal
  const LINE_AT        = 2700;   // underline expands
  const TAG_AT         = 2900;   // tagline fades in
  const CANVAS_FADE_AT = 3600;   // shader glare fades — text only from here
  const CANVAS_FADE_DUR= 1200;   // canvas fades over 1.2 s
  const FADEOUT_AT     = 4500;   // overlay begins final fade
  const FADE_DUR       = 1500;   // overlay fade duration  (~6 s total)

  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  let animId = null, renderer = null, skipped = false;
  const timers = [];

  function addTimer(fn, delay) {
    const id = setTimeout(fn, delay);
    timers.push(id);
    return id;
  }

  function cleanupGL() {
    if (animId)   { cancelAnimationFrame(animId); animId = null; }
    if (renderer) { renderer.dispose(); renderer = null; }
  }

  // ── Skip ──────────────────────────────────────────────────────
  function skipIntro() {
    if (skipped) return;
    skipped = true;
    timers.forEach(clearTimeout);

    const canvas = document.getElementById('intro-canvas');
    if (canvas) canvas.style.opacity = '0';

    overlay.style.transition    = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    overlay.style.opacity       = '0';
    overlay.style.pointerEvents = 'none';

    setTimeout(() => {
      overlay.remove();
      cleanupGL();
    }, 450);
  }

  overlay.addEventListener('click', skipIntro);

  // ── Skip hint ─────────────────────────────────────────────────
  const hint = document.createElement('div');
  hint.id = 'intro-skip-hint';
  hint.textContent = '[ Click anywhere to skip ]';
  overlay.appendChild(hint);

  // ── Letter-reveal ─────────────────────────────────────────────
  function reveal(el, gap) {
    const text = el.textContent;
    el.textContent = '';
    el.style.visibility = 'visible';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'intro-char';
      s.textContent = ch === ' ' ? '\u00a0' : ch;
      el.appendChild(s);
      addTimer(() => s.classList.add('intro-char--on'), i * gap);
    });
  }

  // ── Sequence ──────────────────────────────────────────────────
  addTimer(() => reveal(document.getElementById('intro-welcome'), 90), WELCOME_AT);

  addTimer(() => {
    document.getElementById('intro-logo').style.visibility = 'visible';
    reveal(document.getElementById('intro-dm'), 110);
  }, LOGO_AT);

  addTimer(() => {
    reveal(document.getElementById('intro-ai'), 115);
  }, LOGO_AT + 2 * 110 + 80);

  addTimer(() => {
    const line = document.getElementById('intro-line');
    if (line) line.classList.add('intro-line--on');
  }, LINE_AT);

  addTimer(() => {
    const tag = document.getElementById('intro-tag');
    if (tag) tag.classList.add('intro-tag--on');
  }, TAG_AT);

  // ── Shader glare fades out — leaving clean text on dark bg ───
  addTimer(() => {
    const canvas = document.getElementById('intro-canvas');
    if (canvas) {
      canvas.style.transition = 'opacity ' + CANVAS_FADE_DUR + 'ms ease';
      canvas.style.opacity    = '0';
    }
  }, CANVAS_FADE_AT);

  // ── Final overlay fade & cleanup ──────────────────────────────
  addTimer(() => {
    if (skipped) return;
    overlay.style.transition    = 'opacity ' + FADE_DUR + 'ms cubic-bezier(0.4, 0, 0.2, 1)';
    overlay.style.opacity       = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => {
      overlay.remove();
      cleanupGL();
    }, FADE_DUR);
  }, FADEOUT_AT);

  // ── WebGL Shader ──────────────────────────────────────────────
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
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2  resolution;
      uniform float time;

      float random(in float x) { return fract(sin(x) * 1e4); }
      float random(vec2 st)    { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

        vec2 fMosaicScal = vec2(4.0, 2.0);
        vec2 vScreenSize = vec2(256.0, 256.0);
        uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
        uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);

        float t = time * 0.06 + random(uv.x) * 0.4;
        float lineWidth = 0.0008;

        vec3 color = vec3(0.0);
        for (int j = 0; j < 3; j++) {
          for (int i = 0; i < 5; i++) {
            color[j] += lineWidth * float(i * i) / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 1.0 - length(uv));
          }
        }

        gl_FragColor = vec4(color[2], color[1], color[0], 1.0);
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
    if (!renderer) return;
    animId = requestAnimationFrame(animate);
    uniforms.time.value += 0.05;
    renderer.render(scene, camera);
  })();

})();

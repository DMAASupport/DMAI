(function () {
  'use strict';

  // ── Timeline (ms) — total duration ~7 s ──────────────────────
  const WELCOME_AT     =  700;   // "WELCOME TO" letter reveal
  const DM_AT          = 1900;   // "DM" fades in
  const AI_AT          = 2220;   // "AI" fades in 320ms after DM
  const BEAT_AT        = 2450;   // heartbeat pulse on AI only
  const LINE_AT        = 2850;   // underline expands
  const TAG_AT         = 3050;   // tagline fades in
  const CANVAS_FADE_AT = 5200;   // shader glare fades — text breathes longer
  const CANVAS_FADE_DUR= 1800;   // canvas fades over 1.8 s
  const FADEOUT_AT     = 8500;   // overlay begins final fade  (~12 s total)
  const FADE_DUR       = 3500;   // overlay fade duration

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

  // DM fades in first
  addTimer(() => {
    const dm = document.getElementById('intro-dm');
    if (dm) dm.classList.add('intro-dm--on');
  }, DM_AT);

  // AI fades in after DM
  addTimer(() => {
    const ai = document.getElementById('intro-ai');
    if (ai) ai.classList.add('intro-ai--on');
  }, AI_AT);

  // AI heartbeat pulse
  addTimer(() => {
    const ai = document.getElementById('intro-ai');
    if (ai) ai.classList.add('intro-ai--beat');
  }, BEAT_AT);

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
    overlay.style.transition    = 'opacity ' + FADE_DUR + 'ms cubic-bezier(0.7, 0, 0.3, 1), transform ' + FADE_DUR + 'ms cubic-bezier(0.7, 0, 0.3, 1)';
    overlay.style.opacity       = '0';
    overlay.style.transform     = 'scale(1.04)';
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
      precision highp float;
      uniform vec2  resolution;
      uniform float time;

      float random(float x) { return fract(sin(x) * 43758.5453); }

      void main(void) {
        // Full-resolution continuous UVs — no mosaic quantization
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

        float d = length(uv);

        // Organic per-column variation: fine grain, low amplitude
        float colVar = random(floor(uv.x * 180.0) / 180.0) * 0.22;
        float t = time * 0.038 + colVar;

        // 8 line rings per colour layer for rich complexity
        float cyan_i = 0.0;
        float lav_i  = 0.0;
        for (int i = 1; i <= 8; i++) {
          float fi = float(i);
          float w  = 0.00055 * fi * fi;
          float epsilon = 0.0018;   // soft floor — prevents hard spikes, smooth falloff

          cyan_i += w / (abs(fract(t             + fi * 0.014) - d) + epsilon);
          lav_i  += w / (abs(fract(t + 0.28      + fi * 0.014) - d) + epsilon);
        }

        // Clamp to suppress any remaining fireflies
        cyan_i = min(cyan_i, 2.2);
        lav_i  = min(lav_i,  2.2);

        // DMAI brand colours
        vec3 cyan     = vec3(0.000, 0.831, 1.000);   // #00d4ff
        vec3 lavender = vec3(0.655, 0.545, 0.980);   // #a78bfa

        // Slow breath between cyan-dominant ↔ lavender-dominant
        float breath = sin(time * 0.014) * 0.5 + 0.5;
        vec3 col = cyan_i * mix(cyan,     lavender * 0.60, breath)
                 + lav_i  * mix(lavender, cyan     * 0.50, 1.0 - breath);

        // Inner dead-zone — keep center dark so text is fully readable
        float innerMask = smoothstep(0.30, 0.62, d);
        col *= innerMask;

        // Outer vignette — wider to give rings more visible space
        float vignette = 1.0 - smoothstep(0.55, 1.8, d);
        col *= vignette;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), material));

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3)); // full retina quality

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  (function animate() {
    if (!renderer) return;
    animId = requestAnimationFrame(animate);
    uniforms.time.value += 0.032; // slower tick = smoother motion
    renderer.render(scene, camera);
  })();

})();

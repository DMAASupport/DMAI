/* ============================================================
   DMAA Program Configurator — Application Logic
   ============================================================ */

// ─── Project Migration ─────────────────────────────────────
function migrateProject(p) {
  if (p.programs) return p; // Already migrated

  // Safe fallback if dims exist
  const getDims = (key, defaultDims) => p.dims && p.dims[key] ? p.dims[key] : defaultDims;
  const getShare = (key, defaultShare) => p.pct && p.pct[key] !== undefined ? p.pct[key] : defaultShare;

  p.programs = [
    { id: 'office', name: 'Offices / R&D', color: '#ff6b8a', share: getShare('office', 50), dims: getDims('office', { l: 20, w: 20, h: 4 }), isSurface: false },
    { id: 'land', name: 'Landscape', color: '#34d399', share: getShare('land', 15), dims: null, isSurface: true },
    { id: 'amenities', name: 'Amenities', color: '#fbbf24', share: getShare('amenities', 10), dims: getDims('amenities', { l: 15, w: 15, h: 5 }), isSurface: false },
    { id: 'housing', name: 'Housing', color: '#fb923c', share: getShare('housing', 15), dims: getDims('housing', { l: 10, w: 6, h: 3.5 }), isSurface: false },
    { id: 'mobility', name: 'Mobility', color: '#60a5fa', share: getShare('mobility', 7), dims: null, isSurface: true },
    { id: 'infra', name: 'Infrastructure', color: '#a78bfa', share: getShare('infra', 3), dims: getDims('infra', { l: 10, w: 10, h: 5 }), isSurface: false }
  ];
  delete p.pct;
  delete p.dims;
  return p;
}

// ─── Project Store ─────────────────────────────────────────
const Store = {
  KEY: 'dmaa-projects',

  defaults: [
    {
      id: 'proj-neom',
      name: 'NEOM AI Campus',
      client: 'NEOM Company',
      typology: 'AI / Technology Campus',
      employees: 5000,
      gfaPerEmp: 25,
      benchmark: 'custom',
      pct: { office: 50, land: 15, amenities: 10, housing: 15, mobility: 7, infra: 3 },
      dims: {
        office: { l: 20, w: 20, h: 4 },
        amenities: { l: 15, w: 15, h: 5 },
        housing: { l: 10, w: 6, h: 3.5 },
        infra: { l: 10, w: 10, h: 5 }
      },
      createdAt: '2026-02-01'
    },
    {
      id: 'proj-vienna',
      name: 'Vienna Innovation Hub',
      client: 'Stadt Wien',
      typology: 'Mixed-Use Innovation',
      employees: 2200,
      gfaPerEmp: 22,
      benchmark: 'google',
      pct: { office: 48, land: 32, amenities: 10, housing: 0, mobility: 7, infra: 3 },
      dims: {
        office: { l: 18, w: 18, h: 3.5 },
        amenities: { l: 12, w: 12, h: 4 },
        housing: { l: 10, w: 6, h: 3 },
        infra: { l: 8, w: 8, h: 4 }
      },
      createdAt: '2026-01-15'
    },
    {
      id: 'proj-zurich',
      name: 'Zürich Lake Campus',
      client: 'Swiss Life AG',
      typology: 'Corporate Headquarters',
      employees: 3500,
      gfaPerEmp: 28,
      benchmark: 'apple',
      pct: { office: 15, land: 80, amenities: 3, housing: 0, mobility: 1, infra: 1 },
      dims: {
        office: { l: 24, w: 24, h: 4 },
        amenities: { l: 20, w: 15, h: 5 },
        housing: { l: 10, w: 6, h: 3.5 },
        infra: { l: 12, w: 12, h: 5 }
      },
      createdAt: '2025-11-20'
    }
  ],

  load() {
    const raw = localStorage.getItem(this.KEY);
    if (raw) {
      try { return JSON.parse(raw).map(migrateProject); }
      catch { /* fall through */ }
    }
    // First time — seed defaults
    const defaultsMigrated = this.defaults.map(migrateProject);
    this.save(defaultsMigrated);
    return [...defaultsMigrated];
  },

  save(projects) {
    localStorage.setItem(this.KEY, JSON.stringify(projects));
  },

  get(id) {
    return this.load().find(p => p.id === id);
  },

  add(project) {
    const projects = this.load();
    projects.push(project);
    this.save(projects);
  },

  update(project) {
    const projects = this.load();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) projects[idx] = project;
    this.save(projects);
  },

  remove(id) {
    const projects = this.load().filter(p => p.id !== id);
    this.save(projects);
  }
};


// ─── Benchmarks ────────────────────────────────────────────
const benchmarks = {
  custom:    { gfaPerEmp: 25.0, pct: [50, 15, 10, 15, 7, 3] },
  apple:     { gfaPerEmp: 26.6, pct: [15, 80, 3, 0, 1, 1] },
  microsoft: { gfaPerEmp: 29.5, pct: [38, 42, 8, 0, 8, 4] },
  google:    { gfaPerEmp: 17.2, pct: [48, 32, 10, 0, 7, 3] },
  meta:      { gfaPerEmp: 30.0, pct: [55, 20, 13, 0, 9, 3] },
  nvidia:    { gfaPerEmp: 23.2, pct: [65, 15, 10, 0, 7, 3] }
};

const pctKeys = ['office', 'land', 'amenities', 'housing', 'mobility', 'infra'];
const programColors = ['#ff6b8a', '#34d399', '#fbbf24', '#fb923c', '#60a5fa', '#a78bfa'];
const programLabels = ['Offices / R&D', 'Landscape', 'Amenities', 'Housing', 'Mobility', 'Infrastructure'];

// Color map for hex usage in 3D
const colorHex3D = {
  office: 0xff6b8a,
  amenities: 0xfbbf24,
  housing: 0xfb923c,
  infra: 0xa78bfa,
  land: 0x34d399,
  mobility: 0x60a5fa
};


// ─── Application State ─────────────────────────────────────
let currentView = 'dashboard';  // 'dashboard' | 'editor'
let currentProject = null;
let chartInstance = null;
let computedGFA = { office: 0, land: 0, amenities: 0, housing: 0, mobility: 0, infra: 0 };

// 3D state
let scene3d, camera3d, renderer3d, controls3d, exporter;
let meshesGroup;


// ─── Router ────────────────────────────────────────────────
function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewName);
  if (target) target.classList.add('active');
  currentView = viewName;
}

function goToDashboard() {
  // Save current project if editing
  if (currentProject) {
    saveCurrentProject();
  }
  currentProject = null;
  showView('dashboard');
  renderDashboard();

  // Destroy 3D if active
  if (renderer3d) {
    const container = document.getElementById('canvas-3d');
    if (container && renderer3d.domElement && container.contains(renderer3d.domElement)) {
      container.removeChild(renderer3d.domElement);
    }
    renderer3d.dispose();
    renderer3d = null;
    scene3d = null;
    camera3d = null;
    controls3d = null;
  }
}

function openProject(projectId) {
  const project = Store.get(projectId);
  if (!project) return;
  currentProject = JSON.parse(JSON.stringify(project)); // deep clone
  showView('editor');
  initEditor();
}

function createNewProject() {
  const nameInput = document.getElementById('modal-project-name');
  const clientInput = document.getElementById('modal-project-client');
  const typologyInput = document.getElementById('modal-project-typology');

  const name = nameInput.value.trim() || 'Untitled Project';
  const client = clientInput.value.trim() || 'Client TBD';
  const typology = typologyInput.value.trim() || 'Mixed-Use';

  const newProject = {
    id: 'proj-' + Date.now(),
    name,
    client,
    typology,
    employees: 5000,
    gfaPerEmp: 25,
    benchmark: 'custom',
    programs: [
      { id: 'office', name: 'Offices / R&D', color: '#ff6b8a', share: 50, dims: { l: 20, w: 20, h: 4 }, isSurface: false },
      { id: 'land', name: 'Landscape', color: '#34d399', share: 15, dims: null, isSurface: true },
      { id: 'amenities', name: 'Amenities', color: '#fbbf24', share: 10, dims: { l: 15, w: 15, h: 5 }, isSurface: false },
      { id: 'housing', name: 'Housing', color: '#fb923c', share: 15, dims: { l: 10, w: 6, h: 3.5 }, isSurface: false },
      { id: 'mobility', name: 'Mobility', color: '#60a5fa', share: 7, dims: null, isSurface: true },
      { id: 'infra', name: 'Infrastructure', color: '#a78bfa', share: 3, dims: { l: 10, w: 10, h: 5 }, isSurface: false }
    ],
    createdAt: new Date().toISOString().split('T')[0]
  };

  Store.add(newProject);
  closeModal();
  openProject(newProject.id);
}


// ─── Dashboard ─────────────────────────────────────────────
function renderDashboard() {
  const grid = document.getElementById('projects-grid');
  const projects = Store.load();

  // New project card is already in HTML, remove dynamic project cards
  const existingCards = grid.querySelectorAll('.project-card');
  existingCards.forEach(c => c.remove());

  projects.forEach((proj, idx) => {
    const totalGFA = proj.employees * proj.gfaPerEmp;
    const card = document.createElement('div');
    card.className = 'project-card';
    card.style.animationDelay = `${0.15 + idx * 0.1}s`;
    card.innerHTML = `
      <div class="project-card-gradient"></div>
      <div class="project-card-body" onclick="openProject('${proj.id}')">
        <div class="project-card-typology">${escapeHtml(proj.typology)}</div>
        <div class="project-card-name">${escapeHtml(proj.name)}</div>
        <div class="project-card-client">${escapeHtml(proj.client)}</div>
        <div class="project-card-stats">
          <div class="stat-item">
            <span class="stat-label">Total GFA</span>
            <span class="stat-value">${totalGFA.toLocaleString()}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Employees</span>
            <span class="stat-value">${proj.employees.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div class="project-card-actions">
        <button class="btn btn-ghost" style="font-size:12px; padding:6px 14px;" onclick="event.stopPropagation(); openProject('${proj.id}')">Open</button>
        <button class="btn btn-danger" style="font-size:12px; padding:6px 14px;" onclick="event.stopPropagation(); deleteProject('${proj.id}')">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function deleteProject(id) {
  if (confirm('Delete this project? This cannot be undone.')) {
    Store.remove(id);
    renderDashboard();
  }
}


// ─── Modal ─────────────────────────────────────────────────
function openNewProjectModal() {
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('modal-project-name').value = '';
  document.getElementById('modal-project-client').value = '';
  document.getElementById('modal-project-typology').value = '';
  document.getElementById('modal-project-name').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}


// ─── Editor ────────────────────────────────────────────────
let editorTabIndex = 0;  // 0=Overview, 1=Master Program, 2=3D Catalog, 3=Export

function initEditor() {
  if (!currentProject) return;

  // Update breadcrumb
  document.getElementById('breadcrumb-project-name').textContent = currentProject.name;

  // Populate overview fields
  document.getElementById('edit-name').value = currentProject.name;
  document.getElementById('edit-client').value = currentProject.client;
  document.getElementById('edit-typology').value = currentProject.typology;

  // Populate master program fields
  document.getElementById('benchmark').value = currentProject.benchmark;
  document.getElementById('employees').value = currentProject.employees;
  document.getElementById('gfaPerEmp').value = currentProject.gfaPerEmp;

  renderProgramTable();
  renderCatalogTable();

  // Reset to first tab
  switchEditorTab(0);

  // Init chart if needed
  if (!chartInstance) {
    initChart();
  }

  // Calculate
  calculate();
}

function switchEditorTab(idx) {
  editorTabIndex = idx;
  document.querySelectorAll('.editor-tab').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
  document.querySelectorAll('.tab-panel').forEach((panel, i) => {
    panel.classList.toggle('active', i === idx);
  });

  // Update action buttons visibility
  document.getElementById('editor-btn-ppt').style.display = (idx === 1) ? 'inline-flex' : 'none';
  document.getElementById('editor-btn-obj').style.display = (idx === 2) ? 'inline-flex' : 'none';

  if (idx === 2) {
    setTimeout(() => {
      if (!scene3d) {
        init3D();
      } else {
        resize3D();
      }
      update3D();
    }, 60);
  }
}

// ─── Dynamic Renders & Handlers ────────────────────────────
function renderProgramTable() {
  const tbody = document.getElementById('program-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  currentProject.programs.forEach(prog => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center;">
          <input type="color" value="${prog.color}" style="width:24px; height:24px; border:none; padding:0; background:none; cursor:pointer; margin-right:8px; border-radius:50%;" onchange="updateProgramColor('${prog.id}', this.value)">
          <input type="text" value="${escapeHtml(prog.name)}" class="pct-input" style="width:140px; text-align:left; font-size:13px;" onchange="updateProgramName('${prog.id}', this.value)">
        </div>
      </td>
      <td>
        <input type="number" class="pct-input" value="${prog.share}" onchange="updateProgramShare('${prog.id}', this.value)">
      </td>
      <td id="area-${prog.id}">0</td>
      <td style="width:40px; text-align:center;">
        <button class="btn btn-ghost" style="padding:4px; color:var(--text-danger);" onclick="removeProgramType('${prog.id}')">×</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCatalogTable() {
  const tbody = document.getElementById('catalog-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  currentProject.programs.forEach(prog => {
    const tr = document.createElement('tr');
    let dimsMarkup = '';
    
    if (prog.isSurface) {
      dimsMarkup = `
        <td colspan="3" style="text-align:center; color:var(--text-muted);">Surface — N/A</td>
        <td>1 surf.</td>
      `;
    } else {
      const d = prog.dims || {l:10, w:10, h:4};
      dimsMarkup = `
        <td><input type="number" class="dim-input" value="${d.l}" onchange="updateProgramDim('${prog.id}', 'l', this.value)"></td>
        <td><input type="number" class="dim-input" value="${d.w}" onchange="updateProgramDim('${prog.id}', 'w', this.value)"></td>
        <td><input type="number" class="dim-input" value="${d.h}" onchange="updateProgramDim('${prog.id}', 'h', this.value)"></td>
        <td id="box-count-${prog.id}" style="font-weight:700;">0</td>
      `;
    }

    tr.innerHTML = `
      <td><span class="program-color-dot" style="background: ${prog.color};"></span>${escapeHtml(prog.name)}</td>
      <td id="3d-gfa-${prog.id}">0</td>
      ${dimsMarkup}
    `;
    tbody.appendChild(tr);
  });
}

function addCustomProgramType() {
  if (!currentProject) return;
  const newId = 'prog-' + Date.now();
  const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  currentProject.programs.push({
    id: newId,
    name: 'New Program',
    color: randomColor,
    share: 0,
    dims: { l: 15, w: 15, h: 4 },
    isSurface: false
  });
  renderProgramTable();
  renderCatalogTable();
  calculate();
}

function removeProgramType(id) {
  if (!currentProject) return;
  currentProject.programs = currentProject.programs.filter(p => p.id !== id);
  renderProgramTable();
  renderCatalogTable();
  calculate();
}

function updateProgramName(id, val) {
  const p = currentProject.programs.find(x => x.id === id);
  if (p) p.name = val;
  renderCatalogTable();
  if(chartInstance) calculate(); 
  saveCurrentProject();
}

function updateProgramColor(id, val) {
  const p = currentProject.programs.find(x => x.id === id);
  if (p) p.color = val;
  renderCatalogTable();
  if(chartInstance) calculate(); 
  saveCurrentProject();
}

function updateProgramShare(id, val) {
  const p = currentProject.programs.find(x => x.id === id);
  if (p) p.share = Math.max(0, Math.min(100, parseFloat(val) || 0));
  balancePercentages(id);
}

function updateProgramDim(id, axis, val) {
  const p = currentProject.programs.find(x => x.id === id);
  if (p && p.dims) p.dims[axis] = parseFloat(val) || 10;
  update3D();
  saveCurrentProject();
}

// ─── Saving ────────────────────────────────────────────────
function saveCurrentProject() {
  if (!currentProject) return;

  // Read overview fields
  currentProject.name = document.getElementById('edit-name').value.trim() || currentProject.name;
  currentProject.client = document.getElementById('edit-client').value.trim() || currentProject.client;
  currentProject.typology = document.getElementById('edit-typology').value.trim() || currentProject.typology;

  // Read parameters
  currentProject.benchmark = document.getElementById('benchmark').value;
  currentProject.employees = parseFloat(document.getElementById('employees').value) || 0;
  currentProject.gfaPerEmp = parseFloat(document.getElementById('gfaPerEmp').value) || 0;



  Store.update(currentProject);
}


// ─── Master Program Calculation ────────────────────────────
function initChart() {
  const ctx = document.getElementById('programChart').getContext('2d');
  
  const labels = currentProject.programs.map(p => p.name);
  const colors = currentProject.programs.map(p => p.color);
  const data = currentProject.programs.map(p => p.share);

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: 'rgba(10, 11, 16, 0.6)',
        borderWidth: 3,
        hoverBorderColor: 'rgba(255,255,255,0.3)',
        hoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: 'rgba(241, 241, 244, 0.7)',
            font: { family: "'Inter', sans-serif", size: 12, weight: 500 },
            boxWidth: 12,
            boxHeight: 12,
            borderRadius: 3,
            padding: 14,
            usePointStyle: true,
            pointStyle: 'rectRounded'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 27, 37, 0.95)',
          titleColor: '#f1f1f4',
          bodyColor: 'rgba(241, 241, 244, 0.8)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
          bodyFont: { family: "'Inter', sans-serif", weight: 500 },
          callbacks: {
            label: function(context) {
              const val = context.parsed;
              return ` ${context.label}: ${val}%`;
            }
          }
        }
      },
      cutout: '68%',
      animation: {
        animateRotate: true,
        duration: 700
      }
    }
  });
}

function loadBenchmark() {
  const data = benchmarks[document.getElementById('benchmark').value];
  document.getElementById('gfaPerEmp').value = data.gfaPerEmp.toFixed(1);
  
  const standardIds = ['office', 'land', 'amenities', 'housing', 'mobility', 'infra'];
  standardIds.forEach((id, i) => {
    const p = currentProject.programs.find(prog => prog.id === id);
    if(p) p.share = data.pct[i];
  });
  
  // Custom ones share = 0
  currentProject.programs.forEach(p => {
    if(!standardIds.includes(p.id)) p.share = 0;
  });
  
  renderProgramTable();
  calculate();
}

function balancePercentages(changedId) {
  const changedProg = currentProject.programs.find(p => p.id === changedId);
  if (!changedProg) return;
  
  changedProg.share = Math.max(0, Math.min(100, changedProg.share));

  const others = currentProject.programs.filter(k => k.id !== changedId);
  let otherTotal = others.reduce((sum, p) => sum + p.share, 0);
  const remainder = 100 - changedProg.share;

  if (otherTotal === 0 && remainder > 0) {
    if (others.length > 0) {
      const split = remainder / others.length;
      others.forEach(p => p.share = parseFloat(split.toFixed(1)));
    }
  } else if (otherTotal > 0) {
    others.forEach(p => {
      const newVal = (p.share / otherTotal) * remainder;
      p.share = parseFloat(newVal.toFixed(1));
    });
  }
  
  renderProgramTable();
  calculate();
}

function calculate() {
  if (!currentProject) return;

  const emp = parseFloat(document.getElementById('employees').value) || 0;
  const gfaPerEmp = parseFloat(document.getElementById('gfaPerEmp').value) || 0;
  const totalGFA = emp * gfaPerEmp;

  // Update KPI displays
  document.getElementById('kpi-total-gfa').textContent = totalGFA.toLocaleString('en-US');
  document.getElementById('kpi-employees').textContent = emp.toLocaleString('en-US');
  document.getElementById('kpi-gfa-emp').textContent = gfaPerEmp.toFixed(1);

  let totalPct = 0;
  currentProject.programs.forEach(p => totalPct += p.share);
  totalPct = Math.round(totalPct * 10) / 10;

  // Total allocation badge
  const totalPctEl = document.getElementById('total-pct');
  totalPctEl.textContent = totalPct + '%';
  totalPctEl.style.color = (totalPct >= 99.9 && totalPct <= 100.1) ? '#34d399' : '#ef4444';

  // Computed GFA per program & Area Readouts
  computedGFA = {};
  currentProject.programs.forEach(p => {
    computedGFA[p.id] = Math.round(totalGFA * (p.share / 100));
    
    // Update DOM cells if table is rendered
    const elTable = document.getElementById('area-' + p.id);
    if (elTable) elTable.textContent = computedGFA[p.id].toLocaleString();
    
    const el3D = document.getElementById('3d-gfa-' + p.id);
    if (el3D) el3D.textContent = computedGFA[p.id].toLocaleString();
  });

  const totalArea = Math.round(totalGFA * (totalPct / 100));
  const elTotalArea = document.getElementById('total-area-check');
  if (elTotalArea) elTotalArea.textContent = totalArea.toLocaleString();

  // Update chart
  if (chartInstance) {
    chartInstance.data.labels = currentProject.programs.map(p => p.name);
    chartInstance.data.datasets[0].data = currentProject.programs.map(p => p.share);
    chartInstance.data.datasets[0].backgroundColor = currentProject.programs.map(p => p.color);
    chartInstance.update();
  }

  // Update 3D if visible
  if (document.getElementById('tab-panel-3d') && document.getElementById('tab-panel-3d').classList.contains('active')) {
    update3D();
  }

  // Save auto
  saveCurrentProject();
}


// ─── 3D Catalog ────────────────────────────────────────────
function init3D() {
  const container = document.getElementById('canvas-3d');
  if (!container) return;

  scene3d = new THREE.Scene();
  meshesGroup = new THREE.Group();

  camera3d = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 10000);
  camera3d.position.set(150, 150, 200);

  renderer3d = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer3d.setPixelRatio(window.devicePixelRatio);
  renderer3d.setSize(container.clientWidth, container.clientHeight);
  renderer3d.setClearColor(0x000000, 0);
  container.appendChild(renderer3d.domElement);

  controls3d = new THREE.OrbitControls(camera3d, renderer3d.domElement);
  controls3d.enableDamping = true;
  controls3d.dampingFactor = 0.08;

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene3d.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(100, 200, 100);
  scene3d.add(dirLight);
  const backLight = new THREE.DirectionalLight(0x6699ff, 0.3);
  backLight.position.set(-100, 100, -100);
  scene3d.add(backLight);

  // Ground grid
  const gridHelper = new THREE.GridHelper(500, 50, 0x333344, 0x222233);
  gridHelper.position.y = -0.5;
  scene3d.add(gridHelper);

  scene3d.add(meshesGroup);
  exporter = new THREE.OBJExporter();

  animate3D();
}

function resize3D() {
  if (!camera3d || !renderer3d) return;
  const container = document.getElementById('canvas-3d');
  if (!container) return;
  camera3d.aspect = container.clientWidth / container.clientHeight;
  camera3d.updateProjectionMatrix();
  renderer3d.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener('resize', resize3D);

function animate3D() {
  requestAnimationFrame(animate3D);
  if (controls3d) controls3d.update();
  if (renderer3d && scene3d && camera3d) renderer3d.render(scene3d, camera3d);
}

function addBoxesToScene(prog, gfa, startZ) {
  const groupLayer = new THREE.Group();
  groupLayer.name = 'Layer_' + prog.id;

  if (gfa <= 0) return 0;

  const mat = new THREE.MeshStandardMaterial({
    color: prog.color,
    roughness: 0.35,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85
  });

  if (prog.isSurface) {
    const side = Math.sqrt(gfa);
    const geo = new THREE.BoxGeometry(side, 0.5, side);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(side / 2, 0.25, startZ + side / 2);
    groupLayer.add(mesh);
    meshesGroup.add(groupLayer);
    return side + 15;
  }

  const L = prog.dims && prog.dims.l ? prog.dims.l : 10;
  const W = prog.dims && prog.dims.w ? prog.dims.w : 10;
  const H = prog.dims && prog.dims.h ? prog.dims.h : 4;

  const boxArea = L * W;
  const count = Math.ceil(gfa / boxArea);

  const boxCountEl = document.getElementById('box-count-' + prog.id);
  if (boxCountEl) boxCountEl.textContent = count.toLocaleString();

  const geo = new THREE.BoxGeometry(L, H, W);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
  const spacing = 2;
  const cols = Math.ceil(Math.sqrt(count));
  let x = 0, z = 0;
  let maxDepth = 0;
  const renderCount = Math.min(count, 1500);

  for (let i = 0; i < renderCount; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x * (L + spacing) + L / 2, H / 2, startZ + z * (W + spacing) + W / 2);
    groupLayer.add(mesh);

    // Wireframe edges
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, edgeMat);
    line.position.copy(mesh.position);
    groupLayer.add(line);

    maxDepth = Math.max(maxDepth, z * (W + spacing) + W);
    x++;
    if (x >= cols) { x = 0; z++; }
  }

  meshesGroup.add(groupLayer);
  return maxDepth + 15;
}

function update3D() {
  if (!scene3d || !meshesGroup) return;

  while (meshesGroup.children.length > 0) {
    meshesGroup.remove(meshesGroup.children[0]);
  }

  let zOffset = 0;

  currentProject.programs.forEach(prog => {
    zOffset += addBoxesToScene(prog, computedGFA[prog.id], zOffset);
  });

  if (zOffset > 0) camera3d.position.set(zOffset / 2, Math.max(zOffset / 2, 100), zOffset);
  controls3d.target.set(zOffset / 4, 0, zOffset / 2);
}


// ─── Exports ───────────────────────────────────────────────
function exportOBJ() {
  if (!exporter || !meshesGroup) return;
  const result = exporter.parse(meshesGroup);
  const blob = new Blob([result], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `DMAA_${currentProject ? currentProject.name.replace(/\s+/g, '_') : 'Project'}_Catalog.obj`;
  link.click();
}

function exportPPT() {
  try {
    let pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';
    let slide = pres.addSlide();
    slide.background = { color: '0a0b10' };

    // Glass panel effect
    slide.addShape(pres.ShapeType.rect, {
      x: 0.25, y: 0.25, w: 9.5, h: 5.125,
      fill: { color: 'FFFFFF', transparency: 95 },
      line: { color: 'FFFFFF', transparency: 80, pt: 1 },
      rectRadius: 0.05
    });

    const projName = currentProject ? currentProject.name : 'Project';
    slide.addText(`DMAA — ${projName}`, {
      x: 0.5, y: 0.4, w: 9.0, h: 0.4,
      fontSize: 24, bold: true, color: 'FFFFFF', fontFace: 'Arial'
    });

    const emp = document.getElementById('employees').value;
    const gfa = document.getElementById('kpi-total-gfa').textContent;
    const bSelect = document.getElementById('benchmark');
    const bStr = bSelect.options[bSelect.selectedIndex].text;

    let paramText = [
      { text: 'Benchmark:\n', options: { fontSize: 11, color: 'AAAAAA' } },
      { text: bStr + '\n\n', options: { fontSize: 14, color: 'FFFFFF', bold: true } },
      { text: 'Target Employees:\n', options: { fontSize: 11, color: 'AAAAAA' } },
      { text: emp + '\n\n', options: { fontSize: 14, color: 'FFFFFF', bold: true } },
      { text: 'Total Campus GFA:\n', options: { fontSize: 11, color: 'AAAAAA' } },
      { text: gfa + ' m²', options: { fontSize: 20, color: '34D399', bold: true } }
    ];
    slide.addText(paramText, { x: 0.5, y: 1.0, w: 3.5, h: 1.8, fontFace: 'Arial', valign: 'top' });

    let chartData = [{
      name: 'Program',
      labels: currentProject.programs.map(p => p.name),
      values: currentProject.programs.map(p => computedGFA[p.id])
    }];
    const chartColors = currentProject.programs.map(p => p.color.replace('#', ''));

    slide.addChart(pres.ChartType.doughnut, chartData, {
      x: 4.2, y: 0.4, w: 5.0, h: 2.5,
      showLegend: true, legendPos: 'r', doughnutHoleSize: 65,
      chartColors: chartColors,
      legendColor: 'FFFFFF', legendFontSize: 11,
      showValue: false, showPercent: true,
      dataLabels: { color: 'FFFFFF', fontSize: 10, position: 'outEnd' }
    });

    let rows = [
      [
        { text: 'Program', options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
        { text: 'Share (%)', options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
        { text: 'GFA (m²)', options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } }
      ]
    ];
    currentProject.programs.forEach(p => {
      rows.push([p.name, p.share + '%', computedGFA[p.id].toLocaleString()]);
    });
    slide.addTable(rows, {
      x: 0.5, y: 3.0, w: 9.0, colW: [4.0, 2.5, 2.5],
      border: { pt: 0.5, color: 'FFFFFF', transparency: 80 },
      fontSize: 12, color: 'FFFFFF', valign: 'middle'
    });

    pres.writeFile({ fileName: `DMAA_${projName.replace(/\s+/g, '_')}_Summary.pptx` });
  } catch (error) {
    alert('Export failed. Please check internet connection.');
    console.error(error);
  }
}


// ─── Utilities ─────────────────────────────────────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}


// ─── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  showView('dashboard');
  renderDashboard();
});

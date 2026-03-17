/* ============================================================
   DMAA Program Configurator — Application Logic
   ============================================================ */

// ─── Project Migration ─────────────────────────────────────
function migrateProject(p) {
  // Top-level new fields
  if (p.siteArea === undefined) p.siteArea = 0;
  if (p.notes === undefined) p.notes = '';
  if (p.projectCode === undefined) p.projectCode = '';
  if (p.status === undefined) p.status = 'ongoing';
  if (p.images === undefined) p.images = [];
  if (p.occupantLabel === undefined) p.occupantLabel = 'Employees';

  if (p.programs) {
    // Migrate program-level fields added in v2
    p.programs.forEach(prog => {
      if (prog.locked === undefined) prog.locked = false;
      if (prog.nFloors === undefined) prog.nFloors = 1;
    });
    return p;
  }

  // Legacy format (pct/dims) → programs array
  const getDims = (key, defaultDims) => p.dims && p.dims[key] ? p.dims[key] : defaultDims;
  const getShare = (key, defaultShare) => p.pct && p.pct[key] !== undefined ? p.pct[key] : defaultShare;

  p.programs = [
    { id: 'office',    name: 'Offices / R&D',  color: '#ff6b8a', share: getShare('office', 50),    dims: getDims('office',    { l: 20, w: 20, h: 4   }), isSurface: false, locked: false, nFloors: 1 },
    { id: 'land',      name: 'Landscape',       color: '#34d399', share: getShare('land', 15),       dims: null,                                              isSurface: true,  locked: false, nFloors: 1 },
    { id: 'amenities', name: 'Amenities',       color: '#fbbf24', share: getShare('amenities', 10),  dims: getDims('amenities', { l: 15, w: 15, h: 5   }), isSurface: false, locked: false, nFloors: 1 },
    { id: 'housing',   name: 'Housing',         color: '#fb923c', share: getShare('housing', 15),    dims: getDims('housing',   { l: 10, w: 6,  h: 3.5 }), isSurface: false, locked: false, nFloors: 1 },
    { id: 'mobility',  name: 'Mobility',        color: '#60a5fa', share: getShare('mobility', 7),    dims: null,                                              isSurface: true,  locked: false, nFloors: 1 },
    { id: 'infra',     name: 'Infrastructure',  color: '#a78bfa', share: getShare('infra', 3),       dims: getDims('infra',     { l: 10, w: 10, h: 5   }), isSurface: false, locked: false, nFloors: 1 }
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
      projectCode: '586',
      name: 'AI Campus',
      client: 'Confidential',
      typology: 'AI / Technology Campus',
      status: 'ongoing',
      occupantLabel: 'Employees',
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
      id: 'proj-578',
      projectCode: '578',
      name: 'ga8 Frankfurt',
      client: 'City of Frankfurt',
      typology: 'Mixed-Use High-Rise',
      status: 'past',
      occupantLabel: 'Occupants',
      employees: 1200,
      gfaPerEmp: 24,
      benchmark: 'custom',
      siteArea: 0,
      notes: 'Competition project ga8 Frankfurt. Mixed-use high-rise with office tower, residential tower, hotel, and cultural plinth. Data extracted from area schedule F-1.',
      programs: [
        { id: 'buero',   name: 'Office',             color: '#60a5fa', share: 43, dims: { l: 40, w: 40, h: 4   }, isSurface: false, locked: false, nFloors: 30 },
        { id: 'wohnen',  name: 'Housing',             color: '#fb923c', share: 23, dims: { l: 30, w: 30, h: 3   }, isSurface: false, locked: false, nFloors: 16 },
        { id: 'hotel',   name: 'Hotel',               color: '#a78bfa', share: 14, dims: { l: 25, w: 25, h: 3.5 }, isSurface: false, locked: false, nFloors: 5  },
        { id: 'innwohn', name: 'Innovative Housing',  color: '#fbbf24', share: 12, dims: { l: 20, w: 20, h: 3   }, isSurface: false, locked: false, nFloors: 8  },
        { id: 'kultur',  name: 'Arts & Culture',      color: '#34d399', share:  5, dims: { l: 30, w: 30, h: 6   }, isSurface: false, locked: false, nFloors: 2  },
        { id: 'sonstig', name: 'Mixed Use',           color: '#00d4ff', share:  3, dims: null,                     isSurface: true,  locked: false, nFloors: 1  }
      ],
      createdAt: '2026-03-10'
    },
    {
      id: 'proj-581',
      projectCode: '581',
      name: 'Eibengasse H2',
      client: 'City of Vienna',
      typology: 'Residential',
      status: 'past',
      occupantLabel: 'Residents',
      employees: 260,
      gfaPerEmp: 44,
      benchmark: 'custom',
      siteArea: 3624,
      notes: 'Architect selection competition, Stadtquartier Eibengasse, Vienna 1220. Residential building Plot H2 — 117 dwelling units (types A–E, 1–5 bedrooms) across 10 floors. Total above-grade GFA 11,558 m². 3 stairwells, 3 lifts, 55 parking spaces.',
      programs: [
        { id: 'housing',     name: 'Housing',     color: '#fb923c', share: 68, dims: { l: 44, w: 22, h: 3   }, isSurface: false, locked: false, nFloors: 10 },
        { id: 'communal',    name: 'Communal',    color: '#34d399', share: 11, dims: { l: 16, w: 16, h: 3   }, isSurface: false, locked: false, nFloors: 1  },
        { id: 'circulation', name: 'Circulation', color: '#60a5fa', share: 11, dims: null,                     isSurface: true,  locked: false, nFloors: 1  },
        { id: 'storage',     name: 'Storage',     color: '#fbbf24', share:  7, dims: { l: 10, w: 10, h: 2.5 }, isSurface: false, locked: false, nFloors: 1  },
        { id: 'technical',   name: 'Technical',   color: '#a78bfa', share:  3, dims: { l: 8,  w: 8,  h: 3   }, isSurface: false, locked: false, nFloors: 1  }
      ],
      createdAt: '2025-12-01'
    }
  ],

  load() {
    const raw = localStorage.getItem(this.KEY);
    if (raw) {
      try {
        let projects = JSON.parse(raw).map(migrateProject);
        // Remove retired seed projects
        const retired = ['proj-vienna', 'proj-zurich'];
        projects = projects.filter(p => !retired.includes(p.id));
        // Inject missing seed projects; sync status + projectCode from seed
        this.defaults.forEach(seed => {
          const existing = projects.find(p => p.id === seed.id);
          if (!existing) {
            projects.unshift(migrateProject(JSON.parse(JSON.stringify(seed))));
          } else {
            if (seed.status) existing.status = seed.status;
            if (seed.projectCode) existing.projectCode = seed.projectCode;
            if (seed.occupantLabel) existing.occupantLabel = seed.occupantLabel;
          }
        });
        this.save(projects);
        return projects;
      }
      catch { /* fall through */ }
    }
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

const benchmarkNames = {
  custom: 'Custom', apple: 'Apple Park', microsoft: 'Microsoft Redmond',
  google: 'Googleplex', meta: 'Meta Menlo Park', nvidia: 'Nvidia Campus'
};

// Curated DMAA color palette for new program types
const dmaaColorPalette = [
  '#ff6b8a', '#34d399', '#fbbf24', '#fb923c', '#60a5fa', '#a78bfa',
  '#00d4ff', '#ff6b6b', '#f472b6', '#4ade80', '#e879f9', '#f97316'
];


// ─── Application State ─────────────────────────────────────
let currentView = 'dashboard';
let currentProject = null;
let chartInstance = null;
let benchmarkChartInstance = null;
let computedGFA = {};
let lastZOffset = 0;

// 3D state
let scene3d, camera3d, renderer3d, controls3d, exporter;
let meshesGroup;

// Drag-to-reorder state
let dragSrcId = null;

// Dashboard state
let dashboardSearchQuery  = '';
let dashboardStatusFilter = 'all';
let dashboardSearchField  = 'all';
let compareSelection      = [];

// Save status debounce
let saveStatusTimer = null;


// ─── Router ────────────────────────────────────────────────
function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewName);
  if (target) target.classList.add('active');
  currentView = viewName;
}

function goToDashboard() {
  if (currentProject) saveCurrentProject();
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

  // Destroy benchmark chart
  if (benchmarkChartInstance) {
    benchmarkChartInstance.destroy();
    benchmarkChartInstance = null;
  }

  // Destroy main chart
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

function openProject(projectId) {
  const project = Store.get(projectId);
  if (!project) return;
  currentProject = JSON.parse(JSON.stringify(project));
  showView('editor');
  initEditor();
}

function createNewProject() {
  const nameInput     = document.getElementById('modal-project-name');
  const clientInput   = document.getElementById('modal-project-client');
  const typologyInput = document.getElementById('modal-project-typology');
  const codeInput     = document.getElementById('modal-project-code');

  const name        = nameInput.value.trim()     || 'Untitled Project';
  const client      = clientInput.value.trim()   || 'Client TBD';
  const typology    = typologyInput.value.trim() || 'Mixed-Use';
  const projectCode = codeInput ? codeInput.value.trim() : '';

  const newProject = {
    id: 'proj-' + Date.now(),
    name, client, typology, projectCode,
    status: 'ongoing',
    employees: 5000,
    gfaPerEmp: 25,
    benchmark: 'custom',
    siteArea: 0,
    notes: '',
    programs: [
      { id: 'office',    name: 'Offices / R&D',  color: '#ff6b8a', share: 50, dims: { l: 20, w: 20, h: 4   }, isSurface: false, locked: false, nFloors: 1 },
      { id: 'land',      name: 'Landscape',       color: '#34d399', share: 15, dims: null,                      isSurface: true,  locked: false, nFloors: 1 },
      { id: 'amenities', name: 'Amenities',       color: '#fbbf24', share: 10, dims: { l: 15, w: 15, h: 5   }, isSurface: false, locked: false, nFloors: 1 },
      { id: 'housing',   name: 'Housing',         color: '#fb923c', share: 15, dims: { l: 10, w: 6,  h: 3.5 }, isSurface: false, locked: false, nFloors: 1 },
      { id: 'mobility',  name: 'Mobility',        color: '#60a5fa', share: 7,  dims: null,                      isSurface: true,  locked: false, nFloors: 1 },
      { id: 'infra',     name: 'Infrastructure',  color: '#a78bfa', share: 3,  dims: { l: 10, w: 10, h: 5   }, isSurface: false, locked: false, nFloors: 1 }
    ],
    createdAt: new Date().toISOString().split('T')[0]
  };

  Store.add(newProject);
  closeModal();
  openProject(newProject.id);
}

function duplicateProject(id) {
  const original = Store.get(id);
  if (!original) return;
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = 'proj-' + Date.now();
  copy.name = original.name + ' (Copy)';
  copy.createdAt = new Date().toISOString().split('T')[0];
  Store.add(copy);
  renderDashboard();
}


// ─── Dashboard ─────────────────────────────────────────────
function buildProjectCard(proj, idx) {
  const totalGFA     = proj.employees * proj.gfaPerEmp;
  const occLabel     = proj.occupantLabel || 'Employees';
  const isComparing  = compareSelection.includes(proj.id);
  const programBar   = (proj.programs || [])
    .filter(p => p.share > 0)
    .map(p => `<div style="flex:${p.share}; background:${p.color};" title="${escapeHtml(p.name)}: ${p.share}%"></div>`)
    .join('');

  const card = document.createElement('div');
  card.className = 'project-card' + (isComparing ? ' comparing' : '');
  card.id = 'card-' + proj.id;
  card.style.animationDelay = `${0.15 + idx * 0.1}s`;
  card.innerHTML = `
    <div class="project-card-gradient"></div>
    <div class="project-card-body" onclick="openProject('${proj.id}')">
      <div class="project-card-header-row">
        <div class="project-card-typology">${escapeHtml(proj.typology)}</div>
        ${proj.projectCode ? `<div class="project-card-code">${escapeHtml(proj.projectCode)}</div>` : ''}
      </div>
      <div class="project-card-name">${escapeHtml(proj.name)}</div>
      <div class="project-card-client">${escapeHtml(proj.client)}</div>
      <div class="project-card-stats">
        <div class="stat-item">
          <span class="stat-label">Total GFA</span>
          <span class="stat-value">${totalGFA.toLocaleString()} m²</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">${escapeHtml(occLabel)}</span>
          <span class="stat-value">${proj.employees.toLocaleString()}</span>
        </div>
      </div>
    </div>
    <div class="program-bar">${programBar}</div>
    <div class="project-card-actions">
      <button class="btn btn-ghost card-action-btn compare-btn ${isComparing ? 'active' : ''}" onclick="event.stopPropagation(); toggleCompare('${proj.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
        ${isComparing ? 'Remove' : 'Compare'}
      </button>
      <button class="btn btn-ghost card-action-btn" onclick="event.stopPropagation(); duplicateProject('${proj.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Duplicate
      </button>
      <button class="btn btn-danger card-action-btn" onclick="event.stopPropagation(); deleteProject('${proj.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
        Delete
      </button>
    </div>
  `;
  return card;
}

function renderDashboard() {
  const container = document.getElementById('dashboard-sections');
  let projects = Store.load();

  // Text search — scoped by dashboardSearchField
  const query = dashboardSearchQuery.toLowerCase().trim();
  if (query) {
    projects = projects.filter(p => {
      const totalGFA = String(p.employees * p.gfaPerEmp);
      switch (dashboardSearchField) {
        case 'code':     return (p.projectCode || '').toLowerCase().includes(query);
        case 'client':   return p.client.toLowerCase().includes(query);
        case 'typology': return p.typology.toLowerCase().includes(query);
        case 'gfa':      return totalGFA.includes(query);
        default:
          return p.name.toLowerCase().includes(query) ||
            p.client.toLowerCase().includes(query) ||
            p.typology.toLowerCase().includes(query) ||
            (p.projectCode && p.projectCode.toLowerCase().includes(query)) ||
            (p.notes && p.notes.toLowerCase().includes(query)) ||
            totalGFA.includes(query);
      }
    });
  }

  // Status filter chips
  let ongoing = projects.filter(p => (p.status || 'ongoing') === 'ongoing');
  let past    = projects.filter(p => p.status === 'past');
  if (dashboardStatusFilter === 'ongoing') past    = [];
  if (dashboardStatusFilter === 'past')    ongoing = [];

  container.innerHTML = '';

  // ── Ongoing section ──
  if (dashboardStatusFilter !== 'past') {
    const ongoingSection = document.createElement('div');
    ongoingSection.className = 'project-section';
    ongoingSection.innerHTML = `
      <div class="section-heading-row">
        <span class="section-heading">Ongoing</span>
        <span class="section-count">${ongoing.length}</span>
      </div>`;

    const ongoingGrid = document.createElement('div');
    ongoingGrid.className = 'projects-grid';
    ongoingGrid.innerHTML = `
      <div class="new-project-card" onclick="openNewProjectModal()">
        <div class="new-project-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <span>Create New Project</span>
      </div>`;
    ongoing.forEach((proj, idx) => ongoingGrid.appendChild(buildProjectCard(proj, idx)));
    ongoingSection.appendChild(ongoingGrid);
    container.appendChild(ongoingSection);
  }

  // ── Past section ──
  if (dashboardStatusFilter !== 'ongoing' && past.length > 0) {
    const pastSection = document.createElement('div');
    pastSection.className = 'project-section';
    pastSection.innerHTML = `
      <div class="section-heading-row">
        <span class="section-heading">Past Projects</span>
        <span class="section-count">${past.length}</span>
      </div>`;

    const pastGrid = document.createElement('div');
    pastGrid.className = 'projects-grid';
    past.forEach((proj, idx) => pastGrid.appendChild(buildProjectCard(proj, ongoing.length + idx)));
    pastSection.appendChild(pastGrid);
    container.appendChild(pastSection);
  }

  // Update compare bar
  updateCompareBar();
}

function filterDashboard(query) {
  dashboardSearchQuery = query;
  renderDashboard();
}

const searchFieldPlaceholders = {
  all:      'Search projects…',
  code:     'Search by project number…',
  client:   'Search by client…',
  typology: 'Search by typology…',
  gfa:      'Search by GFA (m²)…'
};

function setSearchField(field) {
  dashboardSearchField = field;
  document.querySelectorAll('.search-field-chip').forEach(el =>
    el.classList.toggle('active', el.dataset.field === field)
  );
  const input = document.querySelector('.search-input');
  if (input) input.placeholder = searchFieldPlaceholders[field] || 'Search projects…';
  renderDashboard();
}

function setStatusFilter(filter) {
  dashboardStatusFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(el =>
    el.classList.toggle('active', el.dataset.filter === filter)
  );
  renderDashboard();
}

function deleteProject(id) {
  if (confirm('Delete this project? This cannot be undone.')) {
    Store.remove(id);
    compareSelection = compareSelection.filter(x => x !== id);
    renderDashboard();
  }
}


// ─── Compare ───────────────────────────────────────────────
function toggleCompare(id) {
  if (compareSelection.includes(id)) {
    compareSelection = compareSelection.filter(x => x !== id);
  } else {
    if (compareSelection.length >= 4) compareSelection.shift(); // max 4
    compareSelection.push(id);
  }
  renderDashboard();
}

function updateCompareBar() {
  const bar = document.getElementById('compare-bar');
  if (!bar) return;
  if (compareSelection.length >= 2) {
    bar.style.display = 'flex';
    bar.querySelector('.compare-bar-count').textContent =
      `${compareSelection.length} project${compareSelection.length > 1 ? 's' : ''} selected`;
  } else {
    bar.style.display = 'none';
  }
}

function clearCompare() {
  compareSelection = [];
  renderDashboard();
}

function openCompareModal() {
  const projects = compareSelection.map(id => Store.get(id)).filter(Boolean);
  if (projects.length < 2) return;

  const modal = document.getElementById('compare-modal');
  const body  = document.getElementById('compare-modal-body');

  // Build columns
  const cols = projects.map(p => {
    const totalGFA = p.employees * p.gfaPerEmp;
    const occLabel = p.occupantLabel || 'Employees';
    const programRows = (p.programs || []).map(prog => {
      const gfa = Math.round((prog.share / 100) * totalGFA);
      return `<div class="cmp-program-row">
        <div class="cmp-program-color" style="background:${prog.color}"></div>
        <div class="cmp-program-name">${escapeHtml(prog.name)}</div>
        <div class="cmp-program-share">${prog.share}%</div>
        <div class="cmp-program-gfa">${gfa.toLocaleString()}</div>
      </div>`;
    }).join('');

    const statusBadge = p.status === 'past'
      ? `<span class="cmp-status-badge past">Past</span>`
      : `<span class="cmp-status-badge ongoing">Ongoing</span>`;

    return `
      <div class="cmp-col">
        <div class="cmp-col-header">
          ${p.projectCode ? `<span class="project-card-code">${escapeHtml(p.projectCode)}</span>` : ''}
          ${statusBadge}
          <div class="cmp-col-name">${escapeHtml(p.name)}</div>
          <div class="cmp-col-meta">${escapeHtml(p.client)} · ${escapeHtml(p.typology)}</div>
        </div>
        <div class="cmp-stat-row">
          <span class="cmp-stat-label">Total GFA</span>
          <span class="cmp-stat-value">${totalGFA.toLocaleString()} m²</span>
        </div>
        <div class="cmp-stat-row">
          <span class="cmp-stat-label">${escapeHtml(occLabel)}</span>
          <span class="cmp-stat-value">${p.employees.toLocaleString()}</span>
        </div>
        <div class="cmp-stat-row">
          <span class="cmp-stat-label">GFA / ${escapeHtml(occLabel.replace(/s$/, ''))}</span>
          <span class="cmp-stat-value">${p.gfaPerEmp} m²</span>
        </div>
        ${p.siteArea ? `<div class="cmp-stat-row">
          <span class="cmp-stat-label">Site Area</span>
          <span class="cmp-stat-value">${p.siteArea.toLocaleString()} m²</span>
        </div>` : ''}
        <div class="cmp-programs-label">Programs</div>
        <div class="cmp-program-bar">
          ${(p.programs||[]).map(prog => `<div style="flex:${prog.share};background:${prog.color}" title="${escapeHtml(prog.name)}: ${prog.share}%"></div>`).join('')}
        </div>
        <div class="cmp-programs-list">${programRows}</div>
      </div>`;
  }).join('');

  body.innerHTML = `<div class="cmp-grid">${cols}</div>`;
  modal.classList.add('active');
}

function closeCompareModal() {
  document.getElementById('compare-modal').classList.remove('active');
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
let editorTabIndex = 0;

function initEditor() {
  if (!currentProject) return;

  const isPast = currentProject.status === 'past';

  // Apply mode class to tab bar for CSS-driven tab visibility
  const tabsEl = document.querySelector('.editor-tabs');
  tabsEl.classList.toggle('mode-past', isPast);
  tabsEl.classList.toggle('mode-ongoing', !isPast);

  // Show/hide the correct overview section
  document.getElementById('overview-ongoing').style.display = isPast ? 'none' : '';
  document.getElementById('overview-past').style.display   = isPast ? ''     : 'none';

  document.getElementById('breadcrumb-project-name').textContent = currentProject.name;

  // Always populate form fields (they persist in DOM even when hidden)
  document.getElementById('edit-project-code').value    = currentProject.projectCode || '';
  document.getElementById('edit-project-status').value  = currentProject.status || 'ongoing';
  document.getElementById('edit-name').value            = currentProject.name;
  document.getElementById('edit-client').value          = currentProject.client;
  document.getElementById('edit-typology').value        = currentProject.typology;
  document.getElementById('edit-notes').value           = currentProject.notes || '';
  document.getElementById('edit-occupant-label').value  = currentProject.occupantLabel || 'Employees';
  document.getElementById('benchmark').value            = currentProject.benchmark;
  document.getElementById('employees').value            = currentProject.employees;
  document.getElementById('gfaPerEmp').value            = currentProject.gfaPerEmp;
  document.getElementById('siteArea').value             = currentProject.siteArea || 0;

  if (isPast) {
    renderPastOverview();
    renderPastGallery();
    initPastGalleryDrop();
  } else {
    renderGallery();
  }

  renderProgramTable();
  if (!isPast) renderCatalogTable();
  switchEditorTab(0);

  if (!chartInstance) initChart();
  calculate();
}

function switchEditorTab(idx) {
  editorTabIndex = idx;
  document.querySelectorAll('.editor-tab').forEach((btn, i) => btn.classList.toggle('active', i === idx));
  document.querySelectorAll('.tab-panel').forEach((panel, i) => panel.classList.toggle('active', i === idx));

  const isPast = currentProject?.status === 'past';
  document.getElementById('editor-btn-ppt').style.display = (idx === 1 && !isPast) ? 'inline-flex' : 'none';
  document.getElementById('editor-btn-obj').style.display = (idx === 2 && !isPast) ? 'inline-flex' : 'none';

  if (idx === 2 && !isPast) {
    setTimeout(() => {
      if (!scene3d) init3D(); else resize3D();
      update3D();
    }, 60);
  }
}


// ─── Save Status ───────────────────────────────────────────
function showSaveStatus(state) {
  const el = document.getElementById('save-status');
  if (!el) return;
  clearTimeout(saveStatusTimer);
  if (state === 'saving') {
    el.textContent = 'Saving…';
    el.className = 'save-status saving';
  } else if (state === 'saved') {
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    el.textContent = `Saved ${now}`;
    el.className = 'save-status saved';
    saveStatusTimer = setTimeout(() => { el.className = 'save-status idle'; }, 3000);
  } else if (state === 'error') {
    el.textContent = 'Save failed';
    el.className = 'save-status error';
  }
}


// ─── Past Project Overview ─────────────────────────────────
function renderPastOverview() {
  const container = document.getElementById('overview-past');
  if (!container || !currentProject) return;

  const totalGFA  = currentProject.employees * currentProject.gfaPerEmp;
  const programs  = currentProject.programs || [];
  const year      = (currentProject.createdAt || '').split('-')[0];
  const occLabel  = currentProject.occupantLabel || 'Occupants';

  const programRows = programs.map(p => {
    const gfa = Math.round((p.share / 100) * totalGFA);
    return `
      <div class="past-program-row">
        <div class="past-program-color" style="background:${p.color}"></div>
        <div class="past-program-name">${escapeHtml(p.name)}</div>
        <div class="past-program-share">${p.share}%</div>
        <div class="past-program-gfa">${gfa.toLocaleString()} m²</div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="past-overview-header">
      <div class="past-overview-header-top">
        <div>
          ${currentProject.projectCode ? `<span class="project-card-code" style="margin-bottom:10px;display:inline-block;">${escapeHtml(currentProject.projectCode)}</span>` : ''}
          <h1 class="past-overview-title">${escapeHtml(currentProject.name)}</h1>
          <div class="past-overview-meta">${escapeHtml(currentProject.client)} &middot; ${escapeHtml(currentProject.typology)}${year ? ` &middot; ${year}` : ''}</div>
        </div>
        <button class="past-promote-btn" onclick="changeProjectStatus('ongoing')">
          Move to Ongoing
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>

    <div class="past-stat-grid">
      <div class="past-stat-card">
        <div class="past-stat-label">Total GFA</div>
        <div class="past-stat-value">${totalGFA.toLocaleString()}<span class="past-stat-unit"> m²</span></div>
      </div>
      <div class="past-stat-card">
        <div class="past-stat-label">${escapeHtml(occLabel)}</div>
        <div class="past-stat-value">${currentProject.employees.toLocaleString()}</div>
      </div>
      <div class="past-stat-card">
        <div class="past-stat-label">GFA / ${escapeHtml(occLabel.replace(/s$/i, ''))}</div>
        <div class="past-stat-value">${currentProject.gfaPerEmp}<span class="past-stat-unit"> m²</span></div>
      </div>
      ${currentProject.siteArea ? `
      <div class="past-stat-card">
        <div class="past-stat-label">Site Area</div>
        <div class="past-stat-value">${currentProject.siteArea.toLocaleString()}<span class="past-stat-unit"> m²</span></div>
      </div>` : ''}
    </div>

    <div class="overview-panel">
      <h3>Program Breakdown</h3>
      <div class="past-programs-list">${programRows}</div>
    </div>

    ${currentProject.notes ? `
    <div class="overview-panel">
      <h3>Notes</h3>
      <div class="past-notes">${escapeHtml(currentProject.notes)}</div>
    </div>` : ''}

    <div class="section-title" style="margin-top:var(--space-xl);">Renders &amp; Plans</div>
    <div class="gallery-dropzone" id="past-gallery-dropzone">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <div class="gallery-dropzone-text">Drop images here or click to browse</div>
      <div class="gallery-dropzone-sub">PNG · JPG · WEBP renders and plans</div>
    </div>
    <div class="gallery-grid" id="past-gallery-grid"></div>
  `;
}

function changeProjectStatus(status) {
  if (!currentProject) return;
  currentProject.status = status;
  document.getElementById('edit-project-status').value = status;
  Store.update(currentProject);
  initEditor();
}


// ─── Gallery ───────────────────────────────────────────────
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid || !currentProject) return;
  const images = currentProject.images || [];

  if (images.length === 0) {
    grid.innerHTML = '<div class="gallery-empty">No images yet.</div>';
    return;
  }

  grid.innerHTML = images.map(img => `
    <div class="gallery-item">
      <img src="${img.dataUrl}" alt="${escapeHtml(img.name)}">
      <div class="gallery-item-footer">
        <span class="gallery-item-name">${escapeHtml(img.name)}</span>
        <button class="gallery-remove-btn" onclick="removeGalleryImage('${img.id}')" title="Remove">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function renderPastGallery() {
  const grid = document.getElementById('past-gallery-grid');
  if (!grid || !currentProject) return;
  const images = currentProject.images || [];
  if (images.length === 0) {
    grid.innerHTML = '<div class="gallery-empty">No images yet.</div>';
    return;
  }
  grid.innerHTML = images.map(img => `
    <div class="gallery-item">
      <img src="${img.dataUrl}" alt="${escapeHtml(img.name)}">
      <div class="gallery-item-footer">
        <span class="gallery-item-name">${escapeHtml(img.name)}</span>
        <button class="gallery-remove-btn" onclick="removeGalleryImage('${img.id}')" title="Remove">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function initPastGalleryDrop() {
  const dropzone = document.getElementById('past-gallery-dropzone');
  if (!dropzone) return;
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    handleGalleryFiles(e.dataTransfer.files);
  });
  dropzone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'image/*';
    input.onchange = () => handleGalleryFiles(input.files);
    input.click();
  });
}

function removeGalleryImage(id) {
  if (!currentProject) return;
  currentProject.images = (currentProject.images || []).filter(img => img.id !== id);
  activeGalleryRender();
  try { Store.update(currentProject); } catch(e) { showSaveStatus('error'); }
}

function activeGalleryRender() {
  if (currentProject?.status === 'past') renderPastGallery();
  else renderGallery();
}

function handleGalleryFiles(files) {
  if (!currentProject || !files.length) return;
  if (!currentProject.images) currentProject.images = [];
  let pending = files.length;
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) { pending--; return; }
    const reader = new FileReader();
    reader.onload = e => {
      currentProject.images.push({
        id:      'img-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        name:    file.name,
        dataUrl: e.target.result
      });
      if (--pending === 0) {
        activeGalleryRender();
        showSaveStatus('saving');
        try { Store.update(currentProject); showSaveStatus('saved'); }
        catch(err) { showSaveStatus('error'); }
      }
    };
    reader.readAsDataURL(file);
  });
}

function initGalleryDrop() {
  const dropzone = document.getElementById('gallery-dropzone');
  if (!dropzone) return;
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    handleGalleryFiles(e.dataTransfer.files);
  });
  dropzone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'image/*';
    input.onchange = () => handleGalleryFiles(input.files);
    input.click();
  });
}


// ─── Dynamic Renders & Handlers ────────────────────────────
function renderProgramTable() {
  const tbody = document.getElementById('program-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  currentProject.programs.forEach(prog => {
    const tr = document.createElement('tr');
    if (prog.locked) tr.classList.add('program-row-locked');
    tr.setAttribute('data-prog-id', prog.id);
    tr.setAttribute('draggable', 'true');

    const lockSvg = prog.locked
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M18 10H6V7a6 6 0 1112 0v3zM6 12h12v10H6z"/></svg>`
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`;

    const surfaceLabel = prog.isSurface ? 'Surface' : 'Volume';
    const surfaceTip   = prog.isSurface ? 'Switch to Volume (3D box)' : 'Switch to Surface (flat)';

    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="drag-handle" title="Drag to reorder">⠿</span>
          <div class="color-picker-wrapper" style="background-color: ${prog.color};" title="Change colour">
            <input type="color" value="${prog.color}" class="color-picker" onchange="updateProgramColor('${prog.id}', this.value)">
          </div>
          <input type="text" value="${escapeHtml(prog.name)}" class="table-input text-input" onchange="updateProgramName('${prog.id}', this.value)">
          <button class="btn-surface-toggle ${prog.isSurface ? 'is-surface' : ''}" onclick="toggleProgramSurface('${prog.id}')" title="${surfaceTip}">${surfaceLabel}</button>
        </div>
      </td>
      <td>
        <div class="input-with-suffix">
          <input type="number" class="table-input num-input pct-value" value="${prog.share}" onchange="updateProgramShare('${prog.id}', this.value)" min="0" max="100" step="0.1">
          <span class="suffix">%</span>
        </div>
      </td>
      <td id="area-${prog.id}" class="area-value">0 <span class="unit-text">m²</span></td>
      <td style="width:72px; text-align:center; white-space:nowrap;">
        <button class="btn-icon lock-btn ${prog.locked ? 'locked' : ''}" onclick="toggleProgramLock('${prog.id}')" title="${prog.locked ? 'Unlock share' : 'Lock share'}">
          ${lockSvg}
        </button>
        <button class="btn-icon danger-icon" onclick="removeProgramType('${prog.id}')" title="Remove program" style="margin-left:4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </td>
    `;

    // Drag-to-reorder events
    tr.addEventListener('dragstart', e => {
      dragSrcId = prog.id;
      tr.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    tr.addEventListener('dragend', () => {
      tr.classList.remove('dragging');
      document.querySelectorAll('#program-table-body tr').forEach(r => r.classList.remove('drag-over'));
    });
    tr.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('#program-table-body tr').forEach(r => r.classList.remove('drag-over'));
      tr.classList.add('drag-over');
    });
    tr.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrcId === prog.id) return;
      const srcIdx = currentProject.programs.findIndex(p => p.id === dragSrcId);
      const dstIdx = currentProject.programs.findIndex(p => p.id === prog.id);
      if (srcIdx < 0 || dstIdx < 0) return;
      const [moved] = currentProject.programs.splice(srcIdx, 1);
      currentProject.programs.splice(dstIdx, 0, moved);
      renderProgramTable();
      renderCatalogTable();
      calculate();
    });

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
        <td colspan="4" style="text-align:center; color:var(--text-muted); font-size:13px; font-weight:500; font-style:italic;">Surface Area (N/A)</td>
        <td><div class="badge-surface">1 surface</div></td>
      `;
    } else {
      const d        = prog.dims   || { l: 10, w: 10, h: 4 };
      const nFloors  = prog.nFloors || 1;
      dimsMarkup = `
        <td>
          <div class="input-with-suffix">
            <input type="number" class="table-input num-input dim-val" value="${d.l}" onchange="updateProgramDim('${prog.id}', 'l', this.value)" min="1">
            <span class="suffix">m</span>
          </div>
        </td>
        <td>
          <div class="input-with-suffix">
            <input type="number" class="table-input num-input dim-val" value="${d.w}" onchange="updateProgramDim('${prog.id}', 'w', this.value)" min="1">
            <span class="suffix">m</span>
          </div>
        </td>
        <td>
          <div class="input-with-suffix">
            <input type="number" class="table-input num-input dim-val" value="${d.h}" onchange="updateProgramDim('${prog.id}', 'h', this.value)" min="1">
            <span class="suffix">m</span>
          </div>
        </td>
        <td>
          <div class="input-with-suffix">
            <input type="number" class="table-input num-input dim-val" value="${nFloors}" onchange="updateProgramDim('${prog.id}', 'nFloors', this.value)" min="1" max="200">
            <span class="suffix">fl</span>
          </div>
        </td>
        <td><div id="box-count-${prog.id}" class="box-count-badge">0</div></td>
      `;
    }

    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center;">
          <span class="program-color-dot" style="background: ${prog.color}; box-shadow: 0 0 8px ${prog.color}aa;"></span>
          <span style="font-weight:600; font-size:14px;">${escapeHtml(prog.name)}</span>
        </div>
      </td>
      <td id="3d-gfa-${prog.id}" class="area-value">0 <span class="unit-text">m²</span></td>
      ${dimsMarkup}
    `;
    tbody.appendChild(tr);
  });
}

function toggleProgramLock(id) {
  const p = currentProject.programs.find(x => x.id === id);
  if (p) p.locked = !p.locked;
  renderProgramTable();
  saveCurrentProject();
}

function toggleProgramSurface(id) {
  const p = currentProject.programs.find(x => x.id === id);
  if (!p) return;
  p.isSurface = !p.isSurface;
  if (p.isSurface) {
    p.dims = null;
  } else {
    p.dims    = { l: 15, w: 15, h: 4 };
    p.nFloors = 1;
  }
  renderProgramTable();
  renderCatalogTable();
  update3D();
  saveCurrentProject();
}

function addCustomProgramType() {
  if (!currentProject) return;
  const newId = 'prog-' + Date.now();
  const randomColor = dmaaColorPalette[Math.floor(Math.random() * dmaaColorPalette.length)];
  currentProject.programs.push({
    id: newId, name: 'New Program', color: randomColor,
    share: 0, dims: { l: 15, w: 15, h: 4 },
    isSurface: false, locked: false, nFloors: 1
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
  if (chartInstance) calculate();
  saveCurrentProject();
}

function updateProgramColor(id, val) {
  const p = currentProject.programs.find(x => x.id === id);
  if (p) p.color = val;
  renderCatalogTable();
  if (chartInstance) calculate();
  saveCurrentProject();
}

function updateProgramShare(id, val) {
  const p = currentProject.programs.find(x => x.id === id);
  if (p) p.share = Math.max(0, Math.min(100, parseFloat(val) || 0));
  balancePercentages(id);
}

function updateProgramDim(id, axis, val) {
  const p = currentProject.programs.find(x => x.id === id);
  if (!p) return;
  if (axis === 'nFloors') {
    p.nFloors = Math.max(1, Math.round(parseFloat(val) || 1));
  } else if (p.dims) {
    p.dims[axis] = parseFloat(val) || 10;
  }
  update3D();
  saveCurrentProject();
}


// ─── Saving ────────────────────────────────────────────────
function saveCurrentProject() {
  if (!currentProject) return;
  showSaveStatus('saving');

  currentProject.projectCode    = document.getElementById('edit-project-code').value.trim();
  currentProject.status         = document.getElementById('edit-project-status').value;
  currentProject.name           = document.getElementById('edit-name').value.trim()     || currentProject.name;
  currentProject.client         = document.getElementById('edit-client').value.trim()   || currentProject.client;
  currentProject.typology       = document.getElementById('edit-typology').value.trim() || currentProject.typology;
  currentProject.notes          = document.getElementById('edit-notes').value;
  currentProject.occupantLabel  = document.getElementById('edit-occupant-label').value || 'Employees';
  currentProject.benchmark      = document.getElementById('benchmark').value;
  currentProject.employees      = parseFloat(document.getElementById('employees').value) || 0;
  currentProject.gfaPerEmp      = parseFloat(document.getElementById('gfaPerEmp').value) || 0;
  currentProject.siteArea       = parseFloat(document.getElementById('siteArea').value)  || 0;

  // Keep breadcrumb in sync
  document.getElementById('breadcrumb-project-name').textContent = currentProject.name;

  try {
    Store.update(currentProject);
    showSaveStatus('saved');
  } catch (e) {
    showSaveStatus('error');
    console.error('Save failed:', e);
  }
}


// ─── Master Program Calculation ────────────────────────────
function initChart() {
  const ctx    = document.getElementById('programChart').getContext('2d');
  const labels = currentProject.programs.map(p => p.name);
  const colors = currentProject.programs.map(p => p.color);
  const data   = currentProject.programs.map(p => p.share);

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data, backgroundColor: colors,
        borderColor: 'rgba(10, 11, 16, 0.6)', borderWidth: 3,
        hoverBorderColor: 'rgba(255,255,255,0.3)', hoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: 'rgba(241, 241, 244, 0.7)',
            font: { family: "'Diatype', sans-serif", size: 12, weight: 500 },
            boxWidth: 12, boxHeight: 12, borderRadius: 3,
            padding: 14, usePointStyle: true, pointStyle: 'rectRounded'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 27, 37, 0.95)',
          titleColor: '#f1f1f4', bodyColor: 'rgba(241, 241, 244, 0.8)',
          borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
          cornerRadius: 10, padding: 12,
          bodyFont: { family: "'Diatype', sans-serif", weight: 500 },
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` }
        }
      },
      cutout: '68%',
      animation: { animateRotate: true, duration: 700 }
    }
  });
}

function loadBenchmark() {
  const data = benchmarks[document.getElementById('benchmark').value];
  document.getElementById('gfaPerEmp').value = data.gfaPerEmp.toFixed(1);

  const standardIds = ['office', 'land', 'amenities', 'housing', 'mobility', 'infra'];
  standardIds.forEach((id, i) => {
    const p = currentProject.programs.find(prog => prog.id === id);
    if (p && !p.locked) p.share = data.pct[i];
  });
  currentProject.programs.forEach(p => {
    if (!standardIds.includes(p.id) && !p.locked) p.share = 0;
  });

  renderProgramTable();
  calculate();
}

function balancePercentages(changedId) {
  const changedProg = currentProject.programs.find(p => p.id === changedId);
  if (!changedProg) return;
  changedProg.share = Math.max(0, Math.min(100, changedProg.share));

  // Only redistribute unlocked programs (excluding the one that changed)
  const lockedOthersTotal = currentProject.programs
    .filter(k => k.id !== changedId && k.locked)
    .reduce((s, p) => s + p.share, 0);

  const others    = currentProject.programs.filter(k => k.id !== changedId && !k.locked);
  const remainder = 100 - changedProg.share - lockedOthersTotal;
  let   otherTotal = others.reduce((sum, p) => sum + p.share, 0);

  if (otherTotal === 0 && remainder > 0) {
    if (others.length > 0) {
      const split = remainder / others.length;
      others.forEach(p => p.share = parseFloat(split.toFixed(1)));
    }
  } else if (otherTotal > 0) {
    others.forEach(p => {
      p.share = parseFloat(((p.share / otherTotal) * remainder).toFixed(1));
    });
  }

  renderProgramTable();
  calculate();
}

function calculate() {
  if (!currentProject) return;

  const emp      = parseFloat(document.getElementById('employees').value) || 0;
  const gfaPerEmp = parseFloat(document.getElementById('gfaPerEmp').value) || 0;
  const siteArea  = parseFloat(document.getElementById('siteArea').value)  || 0;
  const totalGFA  = emp * gfaPerEmp;

  // KPI displays
  document.getElementById('kpi-total-gfa').textContent = totalGFA.toLocaleString('en-US');
  document.getElementById('kpi-employees').textContent = emp.toLocaleString('en-US');
  document.getElementById('kpi-gfa-emp').textContent   = gfaPerEmp.toFixed(1);

  // FAR
  const farEl = document.getElementById('kpi-far');
  if (farEl) farEl.textContent = siteArea > 0 ? (totalGFA / siteArea).toFixed(2) : '—';

  let totalPct = 0;
  let totalFootprint = 0;
  computedGFA = {};

  currentProject.programs.forEach(p => {
    totalPct += p.share;
    computedGFA[p.id] = Math.round(totalGFA * (p.share / 100));

    const elTable = document.getElementById('area-' + p.id);
    if (elTable) elTable.innerHTML = computedGFA[p.id].toLocaleString() + ' <span class="unit-text">m²</span>';

    const el3D = document.getElementById('3d-gfa-' + p.id);
    if (el3D) el3D.innerHTML = computedGFA[p.id].toLocaleString() + ' <span class="unit-text">m²</span>';

    // Accumulate footprint for SCR
    if (!p.isSurface && p.dims) {
      const boxFloorArea = p.dims.l * p.dims.w;
      const nFloors      = p.nFloors || 1;
      const boxCount     = computedGFA[p.id] > 0 ? Math.ceil(computedGFA[p.id] / (boxFloorArea * nFloors)) : 0;
      totalFootprint += boxCount * boxFloorArea;
    }
  });

  totalPct = Math.round(totalPct * 10) / 10;

  // SCR
  const scrEl = document.getElementById('kpi-scr');
  if (scrEl) scrEl.textContent = siteArea > 0 ? (totalFootprint / siteArea * 100).toFixed(1) + '%' : '—';

  // Total allocation badge
  const totalPctEl = document.getElementById('total-pct');
  totalPctEl.textContent = totalPct + '%';
  totalPctEl.style.color = (totalPct >= 99.9 && totalPct <= 100.1) ? '#34d399' : '#ef4444';

  const totalArea = Math.round(totalGFA * (totalPct / 100));
  const elTotalArea = document.getElementById('total-area-check');
  if (elTotalArea) elTotalArea.textContent = totalArea.toLocaleString();

  // Chart update
  if (chartInstance) {
    chartInstance.data.labels                          = currentProject.programs.map(p => p.name);
    chartInstance.data.datasets[0].data               = currentProject.programs.map(p => p.share);
    chartInstance.data.datasets[0].backgroundColor    = currentProject.programs.map(p => p.color);
    chartInstance.update();
  }

  renderBenchmarkComparison();

  if (document.getElementById('tab-panel-3d')?.classList.contains('active')) update3D();

  saveCurrentProject();
}


// ─── Benchmark Comparison Chart ────────────────────────────
function renderBenchmarkComparison() {
  const canvas = document.getElementById('benchmarkChart');
  if (!canvas) return;

  const currentGFA = parseFloat(document.getElementById('gfaPerEmp').value) || 0;
  const labels     = ['Apple Park', 'Microsoft', 'Google', 'Meta', 'Nvidia', 'This Project'];
  const values     = [26.6, 29.5, 17.2, 30.0, 23.2, currentGFA];
  const colors     = [
    'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)',
    'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)',
    'rgba(0, 212, 255, 0.7)'
  ];

  if (benchmarkChartInstance) {
    benchmarkChartInstance.data.datasets[0].data            = values;
    benchmarkChartInstance.data.datasets[0].backgroundColor = colors;
    benchmarkChartInstance.update();
    return;
  }

  benchmarkChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values, backgroundColor: colors,
        borderColor: 'transparent', borderRadius: 5, borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(26, 27, 37, 0.95)',
          titleColor: '#f1f1f4', bodyColor: 'rgba(241, 241, 244, 0.8)',
          borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
          cornerRadius: 8, padding: 10,
          callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)} m² / employee` }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: 'rgba(241,241,244,0.4)', font: { size: 11 }, callback: v => v + ' m²' }
        },
        y: {
          grid: { display: false },
          ticks: { color: 'rgba(241,241,244,0.6)', font: { size: 12 } }
        }
      }
    }
  });
}


// ─── 3D Catalog ────────────────────────────────────────────
function init3D() {
  const container = document.getElementById('canvas-3d');
  if (!container) return;

  scene3d = new THREE.Scene();
  meshesGroup = new THREE.Group();

  camera3d = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 10000);
  camera3d.position.set(150, 150, 200);

  // preserveDrawingBuffer needed for screenshot export
  renderer3d = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
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
  if (controls3d)  controls3d.update();
  if (renderer3d && scene3d && camera3d) renderer3d.render(scene3d, camera3d);
}

function addBoxesToScene(prog, gfa, startZ) {
  const groupLayer = new THREE.Group();
  groupLayer.name = 'Layer_' + prog.id;
  if (gfa <= 0) return 0;

  const mat = new THREE.MeshStandardMaterial({
    color: prog.color, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.85
  });

  if (prog.isSurface) {
    const side = Math.sqrt(gfa);
    const geo  = new THREE.BoxGeometry(side, 0.5, side);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(side / 2, 0.25, startZ + side / 2);
    groupLayer.add(mesh);
    meshesGroup.add(groupLayer);
    return side + 15;
  }

  const L       = prog.dims?.l || 10;
  const W       = prog.dims?.w || 10;
  const H       = prog.dims?.h || 4;
  const nFloors = prog.nFloors || 1;

  // Box count: one unit = L × W footprint × nFloors storeys
  const totalFloorArea = L * W * nFloors;
  const count = Math.ceil(gfa / totalFloorArea);

  const boxCountEl = document.getElementById('box-count-' + prog.id);
  if (boxCountEl) boxCountEl.textContent = count.toLocaleString();

  const geo     = new THREE.BoxGeometry(L, H, W);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
  const spacing = 2;
  const cols    = Math.ceil(Math.sqrt(count));
  let x = 0, z = 0, maxDepth = 0;
  const renderCount = Math.min(count, 1500);

  for (let i = 0; i < renderCount; i++) {
    const posX = x * (L + spacing) + L / 2;
    const posZ = startZ + z * (W + spacing) + W / 2;

    // Stack floors vertically
    for (let f = 0; f < nFloors; f++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(posX, H / 2 + f * H, posZ);
      groupLayer.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const line  = new THREE.LineSegments(edges, edgeMat);
      line.position.copy(mesh.position);
      groupLayer.add(line);
    }

    maxDepth = Math.max(maxDepth, z * (W + spacing) + W);
    x++;
    if (x >= cols) { x = 0; z++; }
  }

  meshesGroup.add(groupLayer);
  return maxDepth + 15;
}

function update3D() {
  if (!scene3d || !meshesGroup) return;
  while (meshesGroup.children.length > 0) meshesGroup.remove(meshesGroup.children[0]);

  let zOffset = 0;
  currentProject.programs.forEach(prog => {
    zOffset += addBoxesToScene(prog, computedGFA[prog.id] || 0, zOffset);
  });

  lastZOffset = zOffset;
  if (zOffset > 0) {
    camera3d.position.set(zOffset / 2, Math.max(zOffset / 2, 100), zOffset);
    controls3d.target.set(zOffset / 4, 0, zOffset / 2);
  }
}

function setCameraPreset(view) {
  if (!camera3d || !controls3d) return;
  const z  = lastZOffset || 200;
  const cx = z / 4;
  const cz = z / 2;

  if (view === 'top') {
    camera3d.position.set(cx, z * 1.5, cz);
    controls3d.target.set(cx, 0, cz);
  } else if (view === 'front') {
    camera3d.position.set(cx, z * 0.25, z * 1.8);
    controls3d.target.set(cx, 0, cz);
  } else if (view === 'iso') {
    camera3d.position.set(z / 2, Math.max(z / 2, 100), z);
    controls3d.target.set(z / 4, 0, z / 2);
  }
  controls3d.update();
}

function screenshot3D() {
  if (!renderer3d || !scene3d || !camera3d) return;
  renderer3d.render(scene3d, camera3d);
  const dataURL = renderer3d.domElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = `DMAA_${currentProject ? currentProject.name.replace(/\s+/g, '_') : 'Scene'}_3D.png`;
  link.click();
}


// ─── Exports ───────────────────────────────────────────────
function exportOBJ() {
  if (!exporter || !meshesGroup) return;
  const result = exporter.parse(meshesGroup);
  const blob   = new Blob([result], { type: 'text/plain' });
  const link   = document.createElement('a');
  link.href     = URL.createObjectURL(blob);
  link.download = `DMAA_${currentProject ? currentProject.name.replace(/\s+/g, '_') : 'Project'}_Catalog.obj`;
  link.click();
}

function exportCSV() {
  if (!currentProject) return;
  const rows = [['Program', 'Share (%)', 'GFA (m²)', 'Length (m)', 'Width (m)', 'Height (m)', 'Floors', 'Box Count']];

  currentProject.programs.forEach(p => {
    const gfa = computedGFA[p.id] || 0;
    if (p.isSurface) {
      rows.push([p.name, p.share, gfa, 'Surface', 'Surface', 'Surface', 1, 1]);
    } else {
      const d        = p.dims || { l: 0, w: 0, h: 0 };
      const nFloors  = p.nFloors || 1;
      const footprint = d.l * d.w * nFloors;
      const boxCount  = footprint > 0 ? Math.ceil(gfa / footprint) : 0;
      rows.push([p.name, p.share, gfa, d.l, d.w, d.h, nFloors, boxCount]);
    }
  });

  const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href     = URL.createObjectURL(blob);
  link.download = `DMAA_${currentProject.name.replace(/\s+/g, '_')}_Program.csv`;
  link.click();
}

function exportPPT() {
  try {
    let pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';
    const projName     = currentProject ? currentProject.name : 'Project';
    const emp          = document.getElementById('employees').value;
    const gfa          = document.getElementById('kpi-total-gfa').textContent;
    const bSelect      = document.getElementById('benchmark');
    const bStr         = bSelect.options[bSelect.selectedIndex].text;
    const currentGFAPE = parseFloat(document.getElementById('gfaPerEmp').value) || 0;

    // ── SLIDE 1: Program Summary ────────────────────────────
    const slide1 = pres.addSlide();
    slide1.background = { color: '0a0b10' };
    slide1.addShape(pres.ShapeType.rect, {
      x: 0.25, y: 0.25, w: 9.5, h: 5.125,
      fill: { color: 'FFFFFF', transparency: 95 },
      line: { color: 'FFFFFF', transparency: 80, pt: 1 }, rectRadius: 0.05
    });
    slide1.addText(`DMAA — ${projName}`, {
      x: 0.5, y: 0.4, w: 9.0, h: 0.4, fontSize: 24, bold: true, color: 'FFFFFF', fontFace: 'Arial'
    });
    slide1.addText([
      { text: 'Benchmark:\n',         options: { fontSize: 11, color: 'AAAAAA' } },
      { text: bStr + '\n\n',          options: { fontSize: 14, color: 'FFFFFF', bold: true } },
      { text: 'Target Employees:\n',  options: { fontSize: 11, color: 'AAAAAA' } },
      { text: emp + '\n\n',           options: { fontSize: 14, color: 'FFFFFF', bold: true } },
      { text: 'Total Campus GFA:\n',  options: { fontSize: 11, color: 'AAAAAA' } },
      { text: gfa + ' m²',            options: { fontSize: 20, color: '34D399', bold: true } }
    ], { x: 0.5, y: 1.0, w: 3.5, h: 1.8, fontFace: 'Arial', valign: 'top' });

    const chartColors = currentProject.programs.map(p => p.color.replace('#', ''));
    slide1.addChart(pres.ChartType.doughnut, [{
      name: 'Program',
      labels: currentProject.programs.map(p => p.name),
      values: currentProject.programs.map(p => computedGFA[p.id] || 0)
    }], {
      x: 4.2, y: 0.4, w: 5.0, h: 2.5,
      showLegend: true, legendPos: 'r', doughnutHoleSize: 65,
      chartColors, legendColor: 'FFFFFF', legendFontSize: 11,
      showValue: false, showPercent: true,
      dataLabels: { color: 'FFFFFF', fontSize: 10, position: 'outEnd' }
    });
    const rows1 = [[
      { text: 'Program',   options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
      { text: 'Share (%)', options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
      { text: 'GFA (m²)', options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } }
    ]];
    currentProject.programs.forEach(p => {
      rows1.push([p.name, p.share + '%', (computedGFA[p.id] || 0).toLocaleString()]);
    });
    slide1.addTable(rows1, {
      x: 0.5, y: 3.0, w: 9.0, colW: [4.0, 2.5, 2.5],
      border: { pt: 0.5, color: 'FFFFFF', transparency: 80 },
      fontSize: 12, color: 'FFFFFF', valign: 'middle'
    });

    // ── SLIDE 2: 3D Catalog ─────────────────────────────────
    const slide2 = pres.addSlide();
    slide2.background = { color: '0a0b10' };
    slide2.addShape(pres.ShapeType.rect, {
      x: 0.25, y: 0.25, w: 9.5, h: 5.125,
      fill: { color: 'FFFFFF', transparency: 95 },
      line: { color: 'FFFFFF', transparency: 80, pt: 1 }, rectRadius: 0.05
    });
    slide2.addText(`DMAA — ${projName}  |  3D Module Catalog`, {
      x: 0.5, y: 0.4, w: 9.0, h: 0.4, fontSize: 20, bold: true, color: 'FFFFFF', fontFace: 'Arial'
    });
    const rows2 = [[
      { text: 'Program',  options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
      { text: 'GFA (m²)', options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
      { text: 'L (m)',    options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
      { text: 'W (m)',    options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
      { text: 'H (m)',    options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
      { text: 'Floors',   options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
      { text: 'Units',    options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } }
    ]];
    currentProject.programs.forEach(p => {
      const gfaVal = computedGFA[p.id] || 0;
      if (p.isSurface) {
        rows2.push([p.name, gfaVal.toLocaleString(), '—', '—', '—', '—', 'Surface']);
      } else {
        const d       = p.dims || { l: 0, w: 0, h: 0 };
        const nFloors = p.nFloors || 1;
        const footprint = d.l * d.w * nFloors;
        const units     = footprint > 0 ? Math.ceil(gfaVal / footprint) : 0;
        rows2.push([p.name, gfaVal.toLocaleString(), d.l, d.w, d.h, nFloors, units.toLocaleString()]);
      }
    });
    slide2.addTable(rows2, {
      x: 0.5, y: 1.1, w: 9.0, colW: [2.4, 1.4, 0.8, 0.8, 0.8, 0.9, 1.0],
      border: { pt: 0.5, color: 'FFFFFF', transparency: 80 },
      fontSize: 11, color: 'FFFFFF', valign: 'middle'
    });

    // ── SLIDE 3: Benchmark Comparison ──────────────────────
    const slide3 = pres.addSlide();
    slide3.background = { color: '0a0b10' };
    slide3.addShape(pres.ShapeType.rect, {
      x: 0.25, y: 0.25, w: 9.5, h: 5.125,
      fill: { color: 'FFFFFF', transparency: 95 },
      line: { color: 'FFFFFF', transparency: 80, pt: 1 }, rectRadius: 0.05
    });
    slide3.addText(`DMAA — ${projName}  |  Benchmark Comparison`, {
      x: 0.5, y: 0.4, w: 9.0, h: 0.4, fontSize: 20, bold: true, color: 'FFFFFF', fontFace: 'Arial'
    });
    const rows3 = [[
      { text: 'Campus Reference',       options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
      { text: 'GFA / Employee (m²)',    options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } },
      { text: 'vs. This Project',       options: { bold: true, color: 'FFFFFF', fill: '1a1b25' } }
    ]];
    Object.entries(benchmarks).forEach(([key, bData]) => {
      if (key === 'custom') return;
      const delta    = currentGFAPE > 0 ? ((currentGFAPE - bData.gfaPerEmp) / bData.gfaPerEmp * 100) : null;
      const deltaStr = delta !== null ? (delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`) : '—';
      rows3.push([benchmarkNames[key], bData.gfaPerEmp.toFixed(1) + ' m²', deltaStr]);
    });
    rows3.push([
      { text: projName + ' (This Project)', options: { bold: true, color: '00d4ff' } },
      { text: currentGFAPE.toFixed(1) + ' m²', options: { bold: true, color: '00d4ff' } },
      { text: '—', options: { color: 'AAAAAA' } }
    ]);
    slide3.addTable(rows3, {
      x: 0.5, y: 1.1, w: 9.0, colW: [4.5, 2.5, 2.0],
      border: { pt: 0.5, color: 'FFFFFF', transparency: 80 },
      fontSize: 13, color: 'FFFFFF', valign: 'middle'
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
  } catch { return dateStr; }
}


// ─── Theme ─────────────────────────────────────────────────
function toggleTheme() {
  const isLight = document.body.dataset.theme === 'light';
  document.body.dataset.theme = isLight ? '' : 'light';
  localStorage.setItem('dmaa-theme', document.body.dataset.theme);
}


// ─── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Restore saved theme
  const savedTheme = localStorage.getItem('dmaa-theme');
  if (savedTheme) document.body.dataset.theme = savedTheme;

  showView('dashboard');
  renderDashboard();
  initGalleryDrop();

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // Escape: close modal
    if (e.key === 'Escape') closeModal();

    // Ctrl/Cmd + S: save with visual confirmation
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (currentProject) saveCurrentProject();
    }

    // Number keys 1–4: switch editor tabs (when not in an input)
    if (currentView === 'editor' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        if (e.key === '1') switchEditorTab(0);
        if (e.key === '2') switchEditorTab(1);
        if (e.key === '3') switchEditorTab(2);
        if (e.key === '4') switchEditorTab(3);
      }
    }
  });
});

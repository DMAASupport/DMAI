// ─── Tender Submission Module ─────────────────────────────────────────────────

const TenderStore = {
  _key: 'dmaa-tenders',
  load() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); } catch { return []; }
  },
  save(tenders) { localStorage.setItem(this._key, JSON.stringify(tenders)); },
  add(t) { const all = this.load(); all.push(t); this.save(all); return t; },
  update(t) {
    t.updatedAt = new Date().toISOString();
    this.save(this.load().map(x => x.id === t.id ? t : x));
  },
  remove(id) { this.save(this.load().filter(t => t.id !== id)); },
  get(id)    { return this.load().find(t => t.id === id) || null; }
};

let currentTender  = null;
let tenderTabIndex = 0;
let tenderFilter   = 'all';

function defaultTender() {
  return {
    id: 'tender-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
    title: '', client: '', location: '', typology: '',
    deadline: '', briefDate: '', briefFile: '', briefNotes: '',
    estimatedGFA: 0, estimatedBudget: 0,
    competitionType: 'open',
    status: 'draft',
    selectedProjects: [],
    teamMembers: [],
    loi: '',
    checklist: {
      briefRead: false, loiDrafted: false, projectsSelected: false,
      cvsCollected: false, portfolioReady: false, submitted: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function showTenders() {
  if (typeof currentProject !== 'undefined' && currentProject) {
    if (typeof saveCurrentProject === 'function') saveCurrentProject();
    if (typeof window !== 'undefined') window.currentProject = null;
  }
  showView('tenders');
  renderTenderList();
}

function openTender(id) {
  currentTender = TenderStore.get(id);
  if (!currentTender) return;
  tenderTabIndex = 0;
  showView('tender-editor');
  renderTenderEditor();
}

function goToTenders() {
  if (currentTender) TenderStore.update(currentTender);
  currentTender = null;
  showView('tenders');
  renderTenderList();
}

function createNewTender() {
  const t = defaultTender();
  TenderStore.add(t);
  openTender(t.id);
}

function deleteTender(id, event) {
  event.stopPropagation();
  if (!confirm('Delete this tender?')) return;
  if (currentTender && currentTender.id === id) currentTender = null;
  TenderStore.remove(id);
  renderTenderList();
}

// ─── Tender List ──────────────────────────────────────────────────────────────

function setTenderFilter(f) {
  tenderFilter = f;
  document.querySelectorAll('.tender-filter-chip').forEach(c =>
    c.classList.toggle('active', c.dataset.filter === f));
  renderTenderGrid();
}

function renderTenderList() {
  renderTenderGrid();
}

function renderTenderGrid() {
  const all = TenderStore.load();
  const filtered = tenderFilter === 'all' ? all : all.filter(t => {
    if (tenderFilter === 'active')    return t.status === 'draft' || t.status === 'in-progress';
    if (tenderFilter === 'submitted') return t.status === 'submitted';
    if (tenderFilter === 'won')       return t.status === 'won';
    if (tenderFilter === 'lost')      return t.status === 'lost' || t.status === 'withdrawn';
    return true;
  });

  const grid = document.getElementById('tender-grid');
  if (!grid) return;

  const cards = filtered.map(t => {
    const prog    = tenderProgress(t);
    const daysLeft = t.deadline ? Math.ceil((new Date(t.deadline) - new Date()) / 86400000) : null;
    const deadlineStr = t.deadline ? fmtDate(t.deadline) : '—';
    const urgency = daysLeft !== null && daysLeft <= 7 && t.status === 'draft' || t.status === 'in-progress'
      ? `<span style="color:var(--accent-coral);font-weight:700">${daysLeft < 0 ? 'Overdue' : daysLeft + 'd left'}</span>` : '';
    return `
      <div class="tender-card" onclick="openTender('${t.id}')">
        <div class="tender-card-header">
          <div class="tender-card-title">${escapeHtml(t.title || 'Untitled Tender')}</div>
          <span class="tender-badge tender-badge--${t.status}">${tenderStatusLabel(t.status)}</span>
        </div>
        <div class="tender-card-client">${escapeHtml(t.client || 'No client')}</div>
        <div class="tender-card-meta">
          <span class="tender-card-meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${deadlineStr} ${urgency}
          </span>
          ${t.typology ? `<span class="tender-card-meta-item">${escapeHtml(t.typology)}</span>` : ''}
          ${t.estimatedGFA ? `<span class="tender-card-meta-item">${fmtNum(t.estimatedGFA)} m²</span>` : ''}
        </div>
        <div class="tender-progress">
          <div class="tender-progress-label">${prog.done}/${prog.total} steps complete</div>
          <div class="tender-progress-track">
            <div class="tender-progress-fill" style="width:${prog.pct}%"></div>
          </div>
        </div>
        <button onclick="deleteTender('${t.id}',event)"
          style="position:absolute;top:10px;right:10px;background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px;border-radius:4px;opacity:0;transition:opacity 0.12s"
          onmouseenter="this.style.color='#ff6b6b'" onmouseleave="this.style.color='var(--text-muted)'"
          class="tender-del-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>`;
  }).join('');

  grid.innerHTML = cards + `
    <div class="tender-card tender-card-new" onclick="createNewTender()">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <div class="tender-card-new-label">New Tender</div>
    </div>`;

  // show delete btn on card hover
  grid.querySelectorAll('.tender-card:not(.tender-card-new)').forEach(card => {
    const btn = card.querySelector('.tender-del-btn');
    if (!btn) return;
    card.addEventListener('mouseenter', () => btn.style.opacity = '1');
    card.addEventListener('mouseleave', () => btn.style.opacity = '0');
  });
}

function tenderProgress(t) {
  const cl = t.checklist || {};
  const keys = ['briefRead','loiDrafted','projectsSelected','cvsCollected','portfolioReady','submitted'];
  const done = keys.filter(k => cl[k]).length;
  return { done, total: keys.length, pct: Math.round(done / keys.length * 100) };
}

function tenderStatusLabel(s) {
  return { draft:'Draft', 'in-progress':'In Progress', submitted:'Submitted', won:'Won', lost:'Lost', withdrawn:'Withdrawn' }[s] || s;
}

// ─── Tender Editor ────────────────────────────────────────────────────────────

function renderTenderEditor() {
  if (!currentTender) return;
  const t = currentTender;

  // Breadcrumb
  const bc = document.getElementById('tender-editor-breadcrumb');
  if (bc) bc.textContent = t.title || 'Untitled Tender';

  // Tabs
  switchTenderTab(tenderTabIndex);
  renderBriefPanel();
  renderPortfolioPanel();
  renderTeamPanel();
  renderLoiPanel();
  renderChecklistPanel();
}

function switchTenderTab(idx) {
  tenderTabIndex = idx;
  document.querySelectorAll('.tender-tab').forEach((btn, i) =>
    btn.classList.toggle('active', i === idx));
  document.querySelectorAll('.tender-tab-panel').forEach((p, i) =>
    p.classList.toggle('active', i === idx));
}

function saveTenderField(path, value) {
  if (!currentTender) return;
  const parts = path.split('.');
  let obj = currentTender;
  for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
  obj[parts[parts.length - 1]] = value;
  TenderStore.update(currentTender);
}

// ─── Tab 0: Brief ─────────────────────────────────────────────────────────────

function initBriefDrop() {
  const zone = document.getElementById('brief-dropzone');
  if (!zone) return;
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file) attachBriefFile(file);
  });
  zone.addEventListener('click', () => document.getElementById('brief-file-input')?.click());
  const fi = document.getElementById('brief-file-input');
  if (fi) fi.addEventListener('change', e => { if (e.target.files[0]) attachBriefFile(e.target.files[0]); });
}

function attachBriefFile(file) {
  if (!currentTender) return;
  currentTender.briefFile = file.name;
  if (!currentTender.briefDate) {
    currentTender.briefDate = new Date().toISOString().split('T')[0];
  }
  TenderStore.update(currentTender);
  renderBriefPanel();
}

function removeBriefFile() {
  if (!currentTender) return;
  currentTender.briefFile = '';
  TenderStore.update(currentTender);
  renderBriefPanel();
}

function renderBriefPanel() {
  const t = currentTender;
  if (!t) return;

  // File badge
  const badge = document.getElementById('brief-file-badge');
  const zone  = document.getElementById('brief-dropzone');
  if (badge && zone) {
    if (t.briefFile) {
      badge.style.display = 'inline-flex';
      badge.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${escapeHtml(t.briefFile)}
        <button class="brief-file-remove" onclick="removeBriefFile()">×</button>`;
      zone.style.display = 'none';
    } else {
      badge.style.display = 'none';
      zone.style.display  = 'flex';
    }
  }

  // Form fields
  setVal('tender-title',     t.title);
  setVal('tender-client',    t.client);
  setVal('tender-location',  t.location);
  setVal('tender-typology',  t.typology);
  setVal('tender-deadline',  t.deadline);
  setVal('tender-briefdate', t.briefDate);
  setVal('tender-gfa',       t.estimatedGFA || '');
  setVal('tender-budget',    t.estimatedBudget || '');
  setVal('tender-comptype',  t.competitionType);
  setVal('tender-briefnotes',t.briefNotes);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && el.value !== String(val ?? '')) el.value = val ?? '';
}

// ─── Tab 1: Portfolio ─────────────────────────────────────────────────────────

function renderPortfolioPanel() {
  const t = currentTender;
  if (!t) return;
  const container = document.getElementById('tender-portfolio-content');
  if (!container) return;

  const projects = (typeof Store !== 'undefined') ? Store.load() : [];
  const selected = t.selectedProjects || [];
  const typology = (t.typology || '').toLowerCase();

  const suggested = projects.filter(p =>
    typology && p.typology && p.typology.toLowerCase().includes(typology)
  );
  const others = projects.filter(p => !suggested.find(s => s.id === p.id));

  function cardHtml(p, isSuggested) {
    const isSelected = selected.includes(p.id);
    const gfaVal = (p.employees || 0) * (p.gfaPerEmp || 0);
    return `
      <div class="portfolio-match-card ${isSelected ? 'selected' : ''} ${isSuggested ? 'suggested' : ''}"
           onclick="toggleProjectSelection('${p.id}')">
        <div class="pmc-check">
          ${isSelected ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </div>
        <div class="pmc-name">${escapeHtml(p.name)}</div>
        <div class="pmc-type">${escapeHtml(p.typology || '—')}</div>
        ${gfaVal ? `<div class="pmc-gfa">${fmtNum(gfaVal)} m²</div>` : ''}
        ${p.location ? `<div class="pmc-type" style="margin-top:2px">${escapeHtml(p.location)}</div>` : ''}
        ${isSuggested ? '<div class="pmc-suggest-tag">✦ suggested</div>' : ''}
      </div>`;
  }

  let html = '';
  if (suggested.length) {
    html += `<div class="portfolio-match-label">Suggested matches (typology: ${escapeHtml(t.typology)})</div>`;
    html += `<div class="portfolio-cards-grid">${suggested.map(p => cardHtml(p, true)).join('')}</div>`;
  }
  if (others.length) {
    html += `<div class="portfolio-all-label">All portfolio projects</div>`;
    html += `<div class="portfolio-cards-grid">${others.map(p => cardHtml(p, false)).join('')}</div>`;
  }
  if (!projects.length) {
    html = '<p style="color:var(--text-muted);font-size:13px">No projects in portfolio yet.</p>';
  }

  const strip = selected.length
    ? `<div class="portfolio-selection-strip">
        <span>${selected.length} project${selected.length !== 1 ? 's' : ''} selected for this tender</span>
        <span style="opacity:0.6;font-size:11px">${selected.map(id => { const p = projects.find(x => x.id === id); return p ? p.name : id; }).join(', ')}</span>
       </div>` : '';

  container.innerHTML = html + strip;
}

function toggleProjectSelection(projectId) {
  if (!currentTender) return;
  const sel = currentTender.selectedProjects || [];
  const idx = sel.indexOf(projectId);
  if (idx === -1) sel.push(projectId);
  else sel.splice(idx, 1);
  currentTender.selectedProjects = sel;
  TenderStore.update(currentTender);
  renderPortfolioPanel();
  // update checklist
  currentTender.checklist.projectsSelected = sel.length > 0;
  TenderStore.update(currentTender);
  renderChecklistPanel();
}

// ─── Tab 2: Team ──────────────────────────────────────────────────────────────

function renderTeamPanel() {
  const t = currentTender;
  if (!t) return;
  const list = document.getElementById('tender-team-list');
  if (!list) return;

  const members = (t.teamMembers || []).map(id => TeamStore.get(id)).filter(Boolean);

  if (!members.length) {
    list.innerHTML = '<div class="team-empty">No team members selected yet.<br>Click "Pick from Roster" to add colleagues.</div>';
  } else {
    list.innerHTML = members.map(p => {
      const initials = p.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
      return `
        <div class="team-member-row">
          <div class="team-avatar">${initials}</div>
          <div class="team-member-info">
            <div class="team-member-name">${escapeHtml(p.name)}</div>
            <div class="team-member-role">${escapeHtml(p.role || '—')}${p.email ? ' · ' + escapeHtml(p.email) : ''}</div>
          </div>
          <button class="team-member-remove" onclick="removeTeamMember('${p.id}')" title="Remove from tender">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
    }).join('');
  }
}

function removeTeamMember(personId) {
  if (!currentTender) return;
  currentTender.teamMembers = (currentTender.teamMembers || []).filter(id => id !== personId);
  TenderStore.update(currentTender);
  renderTeamPanel();
}

// ─── Tab 3: Letter of Interest ────────────────────────────────────────────────

function renderLoiPanel() {
  const el = document.getElementById('loi-textarea');
  if (!el || !currentTender) return;
  el.value = currentTender.loi || '';
}

function fillLoiTemplate() {
  if (!currentTender) return;
  const t = currentTender;
  const projects = (typeof Store !== 'undefined') ? Store.load() : [];
  const projectList = (t.selectedProjects || [])
    .map(id => { const p = projects.find(x => x.id === id); return p ? p.name : null; })
    .filter(Boolean).join(', ') || '[add projects in Portfolio tab]';

  const teamList = (t.teamMembers || [])
    .map(id => { const p = TeamStore.get(id); return p ? `${p.name} (${p.role || 'Team'})` : null; })
    .filter(Boolean).join(', ') || '[add team members in Team tab]';

  const template = `Dear ${t.client || '[Client]'},

We are pleased to submit our letter of interest for the ${t.title || '[Tender Title]'}.

DMAA is an architecture and urban design studio based in Vienna, specialising in ${t.typology || '[Typology]'} projects. Our work combines rigorous spatial thinking with innovative programme development to deliver architecturally ambitious and technically resolved solutions.

Our relevant portfolio includes: ${projectList}.

We propose the following team for this tender:
${teamList}

Project scope: ${t.estimatedGFA ? fmtNum(t.estimatedGFA) + ' m²' : '[GFA]'}  |  Submission deadline: ${t.deadline ? fmtDate(t.deadline) : '[Deadline]'}

We would welcome the opportunity to discuss our approach in more detail and look forward to your positive consideration.

Yours sincerely,

DMAA Studio
Vienna, Austria
www.dmaa.at`;

  currentTender.loi = template;
  TenderStore.update(currentTender);
  renderLoiPanel();
  // update checklist
  currentTender.checklist.loiDrafted = true;
  TenderStore.update(currentTender);
  renderChecklistPanel();
}

function copyLoi() {
  const el = document.getElementById('loi-textarea');
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(() => {
    const btn = document.getElementById('loi-copy-btn');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 1800); }
  });
}

// ─── Tab 4: Checklist ─────────────────────────────────────────────────────────

function renderChecklistPanel() {
  if (!currentTender) return;
  const cl = currentTender.checklist;
  const items = [
    { key: 'briefRead',        label: 'Brief read and understood' },
    { key: 'loiDrafted',       label: 'Letter of Interest drafted' },
    { key: 'projectsSelected', label: 'Portfolio projects selected', badge: (currentTender.selectedProjects||[]).length || null },
    { key: 'cvsCollected',     label: 'CVs collected' },
    { key: 'portfolioReady',   label: 'Portfolio document ready' },
    { key: 'submitted',        label: 'Submission sent' }
  ];

  const done  = items.filter(i => cl[i.key]).length;
  const total = items.length;
  const pct   = Math.round(done / total * 100);

  const progEl = document.getElementById('checklist-progress-fill');
  const progLb = document.getElementById('checklist-progress-label');
  if (progEl) progEl.style.width = pct + '%';
  if (progLb) progLb.textContent = `${done} of ${total} steps complete`;

  const listEl = document.getElementById('checklist-list');
  if (listEl) {
    listEl.innerHTML = items.map(item => `
      <div class="checklist-item ${cl[item.key] ? 'done' : ''}" onclick="toggleChecklist('${item.key}')">
        <div class="checklist-cb-box">
          ${cl[item.key] ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </div>
        <div class="checklist-item-label">${item.label}</div>
        ${item.badge ? `<span class="checklist-item-badge">${item.badge} project${item.badge !== 1 ? 's' : ''}</span>` : ''}
      </div>`).join('');
  }

  const statusSel = document.getElementById('tender-status-sel');
  if (statusSel && statusSel.value !== currentTender.status) statusSel.value = currentTender.status;
}

function toggleChecklist(key) {
  if (!currentTender) return;
  currentTender.checklist[key] = !currentTender.checklist[key];
  TenderStore.update(currentTender);
  renderChecklistPanel();
}

function updateTenderStatus(status) {
  if (!currentTender) return;
  currentTender.status = status;
  TenderStore.update(currentTender);
  const bc = document.getElementById('tender-status-badge-header');
  if (bc) { bc.className = `tender-badge tender-badge--${status}`; bc.textContent = tenderStatusLabel(status); }
}

// ─── Export ───────────────────────────────────────────────────────────────────

function exportTenderExcel() {
  if (!currentTender) return;
  const t = currentTender;
  const projects = (typeof Store !== 'undefined') ? Store.load() : [];
  const team = (t.teamMembers || []).map(id => TeamStore.get(id)).filter(Boolean);
  const selectedProjects = (t.selectedProjects || [])
    .map(id => projects.find(p => p.id === id)).filter(Boolean);

  const G = '#1a5c38'; const LG = '#217346'; const HL = '#e8f5e9';
  const style = `font-family:Calibri,Arial,sans-serif;font-size:11pt`;
  const th = `style="background:${LG};color:#fff;font-weight:bold;padding:6px 10px;border:1px solid #1a5c38;"`;
  const td = `style="padding:5px 10px;border:1px solid #c8e6c9;"`;
  const tda = `style="padding:5px 10px;border:1px solid #c8e6c9;background:${HL};"`;
  const h2 = `style="font-size:14pt;font-weight:bold;color:${G};padding:8px 0 4px;"`;
  const sub = `style="font-size:10pt;color:#666;padding-bottom:8px;"`;

  const section = (title, rows) => `
    <tr><td colspan="2" ${h2}>${title}</td></tr>
    ${rows.map((r, i) => `<tr><td ${th}>${r[0]}</td><td ${i % 2 ? tda : td}>${r[1] ?? '—'}</td></tr>`).join('')}
    <tr><td colspan="2" style="height:12px"></td></tr>`;

  const deadlineFmt = t.deadline ? fmtDate(t.deadline) : '—';

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="UTF-8">
  <style>table{border-collapse:collapse;} td,th{${style}}</style></head>
  <body><table>
  <tr><td colspan="2" style="font-size:20pt;font-weight:900;color:${G};padding:10px 0 2px">TENDER SUBMISSION SUMMARY</td></tr>
  <tr><td colspan="2" ${sub}>${escapeHtml(t.title || 'Untitled')} — DMAA Studio</td></tr>
  <tr><td colspan="2" style="height:8px"></td></tr>`;

  html += section('Tender Details', [
    ['Title',            escapeHtml(t.title || '—')],
    ['Client',           escapeHtml(t.client || '—')],
    ['Location',         escapeHtml(t.location || '—')],
    ['Typology',         escapeHtml(t.typology || '—')],
    ['Deadline',         deadlineFmt],
    ['Brief received',   t.briefDate ? fmtDate(t.briefDate) : '—'],
    ['Brief file',       escapeHtml(t.briefFile || '—')],
    ['Competition type', t.competitionType || '—'],
    ['Estimated GFA',    t.estimatedGFA ? fmtNum(t.estimatedGFA) + ' m²' : '—'],
    ['Estimated budget', t.estimatedBudget ? '€ ' + fmtNum(t.estimatedBudget) : '—'],
    ['Status',           tenderStatusLabel(t.status)],
  ]);

  if (t.briefNotes) {
    html += section('Brief Notes', [['Notes', escapeHtml(t.briefNotes)]]);
  }

  if (selectedProjects.length) {
    html += `<tr><td colspan="2" ${h2}>Selected Portfolio Projects</td></tr>
    <tr><th ${th}>Project</th><th ${th}>Typology</th></tr>`;
    selectedProjects.forEach((p, i) => {
      html += `<tr><td ${i%2?tda:td}>${escapeHtml(p.name)}</td><td ${i%2?tda:td}>${escapeHtml(p.typology||'—')}</td></tr>`;
    });
    html += `<tr><td colspan="2" style="height:12px"></td></tr>`;
  }

  if (team.length) {
    html += `<tr><td colspan="2" ${h2}>Project Team</td></tr>
    <tr><th ${th}>Name</th><th ${th}>Role</th></tr>`;
    team.forEach((p, i) => {
      html += `<tr><td ${i%2?tda:td}>${escapeHtml(p.name)}</td><td ${i%2?tda:td}>${escapeHtml(p.role||'—')}</td></tr>`;
    });
    html += `<tr><td colspan="2" style="height:12px"></td></tr>`;
  }

  if (t.loi) {
    html += section('Letter of Interest', [['Text', escapeHtml(t.loi).replace(/\n/g,'<br>')]]);
  }

  const cl = t.checklist || {};
  html += `<tr><td colspan="2" ${h2}>Submission Checklist</td></tr>`;
  [['Brief read','briefRead'],['LOI drafted','loiDrafted'],['Projects selected','projectsSelected'],
   ['CVs collected','cvsCollected'],['Portfolio ready','portfolioReady'],['Submitted','submitted']]
    .forEach(([label, key], i) => {
      html += `<tr><td ${i%2?tda:td}>${label}</td><td ${i%2?tda:td}>${cl[key] ? '✓ Done' : '○ Pending'}</td></tr>`;
    });

  html += `</table></body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `DMAA_Tender_${(t.title || 'Submission').replace(/\s+/g,'_')}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNum(n) { return Number(n || 0).toLocaleString('en'); }
function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }); }
  catch { return d; }
}

/* ─── DMAA Project Schedule ────────────────────────────────────────────── */

const PHASE_COLORS = [
  '#00d4ff', '#a78bfa', '#fb923c', '#34d399',
  '#fbbf24', '#f472b6', '#60a5fa', '#ff6b8a'
];

// ── Tiny helpers ──────────────────────────────────────────────────────────

function schDate(str) {
  if (!str) return null;
  const d = new Date(str + 'T12:00:00');
  return isNaN(d) ? null : d;
}

function schFmt(str, opts) {
  const d = schDate(str);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', opts);
}

function schFmtShort(str) {
  return schFmt(str, { day: 'numeric', month: 'short' });
}

function schFmtMon(d) {
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

function schUID() {
  return 'sc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function schEsc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function schPhases() {
  return (currentProject && currentProject.schedule && currentProject.schedule.phases) || [];
}

function schSave() {
  if (currentProject) Store.update(currentProject);
}

function schTaskStatus(task) {
  if (task.done) return 'done';
  const due = schDate(task.dueDate);
  if (!due) return 'normal';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (due < today) return 'overdue';
  if ((due - today) / 864e5 <= 7) return 'soon';
  return 'normal';
}

// ── Main render ───────────────────────────────────────────────────────────

function renderSchedule() {
  if (!currentProject) return;
  if (!currentProject.schedule) currentProject.schedule = { phases: [] };
  const phases = currentProject.schedule.phases;
  renderGantt(phases);
  renderPhaseList(phases);
}

// ── Gantt SVG ─────────────────────────────────────────────────────────────

function renderGantt(phases) {
  const wrap = document.getElementById('sched-gantt');
  if (!wrap) return;

  // Read theme-aware colors at render time
  const cs = getComputedStyle(document.documentElement);
  const clrGrid   = cs.getPropertyValue('--glass-border').trim()  || 'rgba(128,128,128,0.15)';
  const clrLabel  = cs.getPropertyValue('--text-muted').trim()    || 'rgba(128,128,128,0.6)';
  const clrToday  = cs.getPropertyValue('--text-secondary').trim()|| 'rgba(128,128,128,0.8)';
  const clrTaskDot= cs.getPropertyValue('--text-muted').trim()    || 'rgba(128,128,128,0.5)';

  const dated = phases.filter(p => p.startDate || p.endDate);
  if (!dated.length) { wrap.innerHTML = ''; return; }

  const allDates = [];
  phases.forEach(p => {
    if (p.startDate) allDates.push(schDate(p.startDate));
    if (p.endDate)   allDates.push(schDate(p.endDate));
    (p.tasks || []).forEach(t => { if (t.dueDate) allDates.push(schDate(t.dueDate)); });
  });
  const valid = allDates.filter(Boolean);
  if (!valid.length) { wrap.innerHTML = ''; return; }

  let minD = new Date(Math.min(...valid));
  let maxD = new Date(Math.max(...valid));
  minD = new Date(minD.getFullYear(), minD.getMonth() - 1, 1);
  maxD = new Date(maxD.getFullYear(), maxD.getMonth() + 2, 0);
  const span = maxD - minD;

  const W = 800, ROW = 30, HDR = 26, PAD = 4;
  const H = HDR + phases.length * ROW + PAD * 2;
  const xAt = d => ((d - minD) / span) * W;

  // Month ticks
  const months = [];
  let cur = new Date(minD.getFullYear(), minD.getMonth(), 1);
  while (cur <= maxD) { months.push(new Date(cur)); cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); }

  const today = new Date();
  const todayX = xAt(today);

  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMid meet" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">`;

  // Month grid
  months.forEach((m, i) => {
    const x = xAt(m).toFixed(1);
    s += `<line x1="${x}" y1="${HDR}" x2="${x}" y2="${H}" stroke="${clrGrid}" stroke-width="1"/>`;
    s += `<text x="${(+x + 4).toFixed(1)}" y="17" font-size="8.5" fill="${clrLabel}" font-family="Inter,sans-serif" font-weight="500">${schFmtMon(m)}</text>`;
  });

  // Phase rows
  phases.forEach((phase, i) => {
    const y = HDR + i * ROW + 4;
    const bh = ROW - 10;
    const s0 = schDate(phase.startDate), e0 = schDate(phase.endDate);
    if (!s0 || !e0) return;

    const x1 = Math.max(0, xAt(s0));
    const x2 = Math.min(W, xAt(e0));
    const bw = Math.max(4, x2 - x1);
    const done  = (phase.tasks || []).filter(t => t.done).length;
    const total = (phase.tasks || []).length;
    const prog  = total > 0 ? done / total : 0;

    // Track background
    s += `<rect x="${x1.toFixed(1)}" y="${y}" width="${bw.toFixed(1)}" height="${bh}" rx="3" fill="${phase.color}18"/>`;
    // Progress fill
    if (prog > 0)
      s += `<rect x="${x1.toFixed(1)}" y="${y}" width="${(bw * prog).toFixed(1)}" height="${bh}" rx="3" fill="${phase.color}40"/>`;
    // Border
    s += `<rect x="${x1.toFixed(1)}" y="${y}" width="${bw.toFixed(1)}" height="${bh}" rx="3" fill="none" stroke="${phase.color}" stroke-width="1" stroke-opacity="0.55"/>`;

    // Name inside bar if wide enough
    if (bw > 55) {
      s += `<text x="${(x1 + 7).toFixed(1)}" y="${(y + bh / 2 + 3.5).toFixed(1)}" font-size="8.5" fill="${phase.color}" font-family="Inter,sans-serif" font-weight="600" opacity="0.9">${schEsc(phase.name)}</text>`;
    }

    // Task due-date dots
    (phase.tasks || []).forEach(task => {
      if (!task.dueDate) return;
      const td = schDate(task.dueDate); if (!td) return;
      const tx = xAt(td);
      if (tx < 0 || tx > W) return;
      const dc = task.done ? '#34d399'
               : schTaskStatus(task) === 'overdue' ? '#ff6b8a'
               : schTaskStatus(task) === 'soon'    ? '#fbbf24'
               : clrTaskDot;
      s += `<circle cx="${tx.toFixed(1)}" cy="${(y + bh / 2).toFixed(1)}" r="2.5" fill="${dc}" opacity="0.9"/>`;
    });
  });

  // Today marker
  if (todayX >= 0 && todayX <= W) {
    const tx = todayX.toFixed(1);
    s += `<line x1="${tx}" y1="${HDR}" x2="${tx}" y2="${H}" stroke="${clrToday}" stroke-width="1" stroke-dasharray="3,2"/>`;
    s += `<circle cx="${tx}" cy="${HDR}" r="3" fill="${clrToday}"/>`;
    s += `<text x="${(+tx + 4).toFixed(1)}" y="17" font-size="7.5" fill="${clrToday}" font-family="Inter,sans-serif" font-weight="600">TODAY</text>`;
  }

  s += '</svg>';
  wrap.innerHTML = s;
}

// ── Phase list ────────────────────────────────────────────────────────────

function renderPhaseList(phases) {
  const el = document.getElementById('sched-phases');
  if (!el) return;

  if (!phases.length) {
    el.innerHTML = `
      <div class="sched-empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.25">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/>
          <line x1="16" y1="14" x2="16" y2="14"/>
        </svg>
        <div class="sched-empty-title">No phases yet</div>
        <div class="sched-empty-sub">Click <strong>+ Add Phase</strong> to start structuring your project timeline</div>
      </div>`;
    return;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  el.innerHTML = phases.map(phase => {
    const done  = (phase.tasks || []).filter(t => t.done).length;
    const total = (phase.tasks || []).length;
    const prog  = total > 0 ? Math.round(done / total * 100) : null;
    const start = schDate(phase.startDate);
    const end   = schDate(phase.endDate);
    const dr    = [schFmtShort(phase.startDate), schFmtShort(phase.endDate)].filter(v => v !== '—').join(' → ') || 'Dates TBD';

    let badge = 'upcoming';
    if (end && end < today)          badge = 'completed';
    else if (start && start <= today) badge = 'active';

    const taskRows = (phase.tasks || []).map(t => taskHTML(phase.id, t)).join('');

    return `
    <div class="sched-phase" id="sched-phase-${phase.id}">
      <div class="sched-phase-hdr" onclick="schTogglePhase('${phase.id}')">
        <div class="sched-phase-hdr-left">
          <span class="sched-phase-dot" style="background:${phase.color};box-shadow:0 0 8px ${phase.color}55"></span>
          <div>
            <div class="sched-phase-name">${schEsc(phase.name)}</div>
            <div class="sched-phase-dr">${dr}</div>
          </div>
        </div>
        <div class="sched-phase-hdr-right">
          ${prog !== null ? `
          <div class="sched-prog">
            <div class="sched-prog-track"><div class="sched-prog-fill" style="width:${prog}%;background:${phase.color}"></div></div>
            <span class="sched-prog-lbl">${done}/${total}</span>
          </div>` : ''}
          <span class="sched-badge sched-badge--${badge}">${badge}</span>
          <div class="sched-phase-acts" onclick="event.stopPropagation()">
            <button class="sched-act-btn" onclick="schEditPhase('${phase.id}')" title="Edit">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="sched-act-btn sched-act-btn--del" onclick="schDeletePhase('${phase.id}')" title="Delete">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </div>
          <svg class="sched-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      <div class="sched-phase-body" id="sched-body-${phase.id}">
        ${taskRows}
        <div class="sched-add-task-row" id="sched-atf-${phase.id}" style="display:none">
          <input class="sched-inp" id="sched-tname-${phase.id}" type="text" placeholder="Task name…"
                 onkeydown="if(event.key==='Enter')schSaveTask('${phase.id}');if(event.key==='Escape')schCancelTask('${phase.id}')">
          <input class="sched-inp sched-inp--date" id="sched-tdue-${phase.id}" type="date">
          <select class="sched-sel" id="sched-tprio-${phase.id}">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
          <button class="sched-btn-add" onclick="schSaveTask('${phase.id}')">Add</button>
          <button class="sched-btn-x"   onclick="schCancelTask('${phase.id}')">✕</button>
        </div>
        <button class="sched-add-task-btn" onclick="schOpenAddTask('${phase.id}')">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/></svg>
          Add Task
        </button>
      </div>
    </div>`;
  }).join('');
}

function taskHTML(phaseId, task) {
  const st   = schTaskStatus(task);
  const pCol = { low: '#60a5fa', medium: '#fbbf24', high: '#ff6b8a' }[task.priority] || '#fbbf24';
  const dueStr = task.dueDate ? schFmtShort(task.dueDate) : '';
  const dueClass = st === 'overdue' ? 'sched-due--over' : st === 'soon' ? 'sched-due--soon' : '';

  return `
  <div class="sched-task sched-task--${st}" id="sched-task-${task.id}">
    <label class="sched-cb">
      <input type="checkbox" ${task.done ? 'checked' : ''}
             onchange="schToggleTask('${phaseId}','${task.id}',this.checked)">
      <span class="sched-cbmark"></span>
    </label>
    <span class="sched-task-name${task.done ? ' sched-task-struck' : ''}">${schEsc(task.name)}</span>
    <div class="sched-task-right">
      ${dueStr ? `<span class="sched-due ${dueClass}">${dueStr}</span>` : ''}
      <span class="sched-prio" style="color:${pCol}">${task.priority || 'medium'}</span>
    </div>
    <button class="sched-task-del" onclick="schDeleteTask('${phaseId}','${task.id}')">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>`;
}

// ── Phase collapse/expand ─────────────────────────────────────────────────

function schTogglePhase(id) {
  const body  = document.getElementById('sched-body-' + id);
  const phase = document.getElementById('sched-phase-' + id);
  if (!body) return;
  const c = body.classList.toggle('sched-body--col');
  phase.classList.toggle('sched-phase--col', c);
}

// ── Add Phase ─────────────────────────────────────────────────────────────

function schOpenAddPhase() {
  const footer = document.getElementById('sched-footer');
  if (!footer) return;
  if (document.getElementById('sched-phase-form')) {
    document.getElementById('sched-pname').focus(); return;
  }

  const used  = schPhases().map(p => p.color);
  const color = PHASE_COLORS.find(c => !used.includes(c)) || PHASE_COLORS[schPhases().length % 8];

  footer.innerHTML = phaseFormHTML({ id: null, name: '', color, startDate: '', endDate: '' }, false);
  document.getElementById('sched-pname').focus();
}

function schEditPhase(phaseId) {
  const phase = schPhases().find(p => p.id === phaseId);
  if (!phase) return;
  const el = document.getElementById('sched-phase-' + phaseId);
  if (!el) return;
  el.outerHTML = `<div class="sched-phase sched-phase--editing" id="sched-phase-${phaseId}">${phaseFormHTML(phase, true)}</div>`;
  document.getElementById('sched-pname').focus();
}

function phaseFormHTML(phase, isEdit) {
  const swatches = PHASE_COLORS.map(c =>
    `<span class="sched-swatch${c === phase.color ? ' sched-swatch--on' : ''}" style="background:${c}" data-color="${c}" onclick="schPickColor(this)"></span>`
  ).join('');

  return `
    <div class="sched-phase-form" id="sched-phase-form">
      <div class="sched-form-hd">${isEdit ? 'Edit Phase' : 'New Phase'}</div>
      <input class="sched-inp sched-inp--lg" id="sched-pname" type="text" placeholder="Phase name…"
             value="${schEsc(phase.name)}"
             onkeydown="if(event.key==='Escape')schCancelPhaseForm()">
      <div class="sched-form-dates">
        <div class="sched-form-field">
          <label>Start date</label>
          <input class="sched-inp sched-inp--date" id="sched-pstart" type="date" value="${phase.startDate || ''}">
        </div>
        <div class="sched-form-field">
          <label>End date</label>
          <input class="sched-inp sched-inp--date" id="sched-pend" type="date" value="${phase.endDate || ''}">
        </div>
      </div>
      <div class="sched-color-row">
        <label>Color</label>
        <div class="sched-swatches">${swatches}</div>
        <input type="hidden" id="sched-pcolor" value="${phase.color}">
      </div>
      <div class="sched-form-acts">
        <button class="btn btn-ghost" onclick="schCancelPhaseForm()">Cancel</button>
        <button class="btn btn-primary" onclick="schSavePhaseForm('${phase.id || ''}')">
          ${isEdit ? 'Save Changes' : 'Add Phase'}
        </button>
      </div>
    </div>`;
}

function schPickColor(el) {
  el.closest('.sched-swatches').querySelectorAll('.sched-swatch').forEach(s => s.classList.remove('sched-swatch--on'));
  el.classList.add('sched-swatch--on');
  document.getElementById('sched-pcolor').value = el.dataset.color;
}

function schSavePhaseForm(existingId) {
  const name  = (document.getElementById('sched-pname')?.value || '').trim();
  const start = document.getElementById('sched-pstart')?.value || '';
  const end   = document.getElementById('sched-pend')?.value || '';
  const color = document.getElementById('sched-pcolor')?.value || PHASE_COLORS[0];
  if (!name) { document.getElementById('sched-pname').focus(); return; }

  if (!currentProject.schedule) currentProject.schedule = { phases: [] };

  if (existingId) {
    // Edit existing
    const p = currentProject.schedule.phases.find(p => p.id === existingId);
    if (p) { p.name = name; p.startDate = start; p.endDate = end; p.color = color; }
  } else {
    // New phase
    currentProject.schedule.phases.push({ id: schUID(), name, color, startDate: start, endDate: end, tasks: [] });
  }

  schSave();
  schCancelPhaseForm();
  renderSchedule();
}

function schCancelPhaseForm() {
  const footer = document.getElementById('sched-footer');
  if (footer) footer.innerHTML = '';
  renderSchedule(); // re-renders editing phase back to normal card
}

function schDeletePhase(id) {
  if (!confirm('Delete this phase and all its tasks?')) return;
  if (!currentProject.schedule) return;
  currentProject.schedule.phases = currentProject.schedule.phases.filter(p => p.id !== id);
  schSave();
  renderSchedule();
}

// ── Tasks ─────────────────────────────────────────────────────────────────

function schOpenAddTask(phaseId) {
  const row = document.getElementById('sched-atf-' + phaseId);
  if (!row) return;
  row.style.display = '';
  const inp = document.getElementById('sched-tname-' + phaseId);
  if (inp) { inp.value = ''; inp.focus(); }
  const due = document.getElementById('sched-tdue-' + phaseId);
  if (due) due.value = '';
}

function schCancelTask(phaseId) {
  const row = document.getElementById('sched-atf-' + phaseId);
  if (row) row.style.display = 'none';
}

function schSaveTask(phaseId) {
  const nameEl = document.getElementById('sched-tname-' + phaseId);
  const dueEl  = document.getElementById('sched-tdue-'  + phaseId);
  const prioEl = document.getElementById('sched-tprio-' + phaseId);
  const name   = (nameEl?.value || '').trim();
  if (!name) { nameEl?.focus(); return; }

  const phase = schPhases().find(p => p.id === phaseId);
  if (!phase) return;
  if (!phase.tasks) phase.tasks = [];

  phase.tasks.push({
    id: schUID(), name,
    dueDate: dueEl?.value || '',
    done: false,
    priority: prioEl?.value || 'medium'
  });

  schSave();
  renderSchedule();
  // Keep body open after re-render
  setTimeout(() => {
    const body = document.getElementById('sched-body-' + phaseId);
    if (body) body.classList.remove('sched-body--col');
  }, 0);
}

function schToggleTask(phaseId, taskId, done) {
  const phase = schPhases().find(p => p.id === phaseId);
  const task  = (phase?.tasks || []).find(t => t.id === taskId);
  if (!task) return;
  task.done = done;
  schSave();

  // Light DOM update — no full re-render
  const el = document.getElementById('sched-task-' + taskId);
  if (el) {
    const st = schTaskStatus(task);
    el.className = `sched-task sched-task--${st}`;
    const nm = el.querySelector('.sched-task-name');
    if (nm) nm.classList.toggle('sched-task-struck', done);
  }
  // Update Gantt dots
  renderGantt(schPhases());
}

function schDeleteTask(phaseId, taskId) {
  const phase = schPhases().find(p => p.id === phaseId);
  if (!phase) return;
  phase.tasks = (phase.tasks || []).filter(t => t.id !== taskId);
  schSave();
  renderSchedule();
}

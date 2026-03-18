// ─── Team Roster ─────────────────────────────────────────────────────────────

const TeamStore = {
  _key: 'dmaa-team-roster',
  load() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); } catch { return []; }
  },
  save(people) { localStorage.setItem(this._key, JSON.stringify(people)); },
  add(person) {
    const people = this.load();
    people.push(person);
    this.save(people);
    return person;
  },
  update(person) {
    const people = this.load().map(p => p.id === person.id ? person : p);
    this.save(people);
  },
  remove(id) {
    this.save(this.load().filter(p => p.id !== id));
  },
  get(id) { return this.load().find(p => p.id === id) || null; }
};

function defaultPerson() {
  return {
    id: 'person-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
    name: '', role: '', email: '', phone: '',
    yearsExperience: '', education: '', specialization: '', cvNotes: '',
    createdAt: new Date().toISOString()
  };
}

// ─── Roster Panel ─────────────────────────────────────────────────────────────

function openRosterPanel() {
  renderRosterPanel();
  document.getElementById('roster-overlay').classList.add('open');
}

function closeRosterPanel() {
  document.getElementById('roster-overlay').classList.remove('open');
}

function renderRosterPanel() {
  const people = TeamStore.load();
  const selectedIds = (typeof currentTender !== 'undefined' && currentTender)
    ? (currentTender.teamMembers || []) : [];

  const listEl = document.getElementById('roster-person-list');
  if (!listEl) return;

  if (!people.length) {
    listEl.innerHTML = '<div class="roster-empty">No team members yet.<br>Add your first colleague below.</div>';
  } else {
    listEl.innerHTML = people.map(p => {
      const isSelected = selectedIds.includes(p.id);
      const initials = p.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
      return `
        <div class="roster-person-row ${isSelected ? 'selected-for-tender' : ''}"
             onclick="toggleRosterPersonSelection('${p.id}')">
          <div class="team-avatar" style="width:32px;height:32px;font-size:11px">${initials}</div>
          <div class="roster-person-info">
            <div class="roster-person-name">${escapeHtml(p.name || 'Unnamed')}</div>
            <div class="roster-person-role">${escapeHtml(p.role || '—')}</div>
          </div>
          <div class="roster-person-check">
            ${isSelected ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
          </div>
          <button class="roster-person-del" onclick="event.stopPropagation();removeRosterPerson('${p.id}')" title="Remove">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
    }).join('');
  }
}

function toggleRosterPersonSelection(personId) {
  if (typeof currentTender === 'undefined' || !currentTender) return;
  const members = currentTender.teamMembers || [];
  const idx = members.indexOf(personId);
  if (idx === -1) members.push(personId);
  else members.splice(idx, 1);
  currentTender.teamMembers = members;
  TenderStore.update(currentTender);
  renderRosterPanel();
  renderTeamPanel();
}

function removeRosterPerson(id) {
  TeamStore.remove(id);
  // also remove from current tender if present
  if (typeof currentTender !== 'undefined' && currentTender) {
    currentTender.teamMembers = (currentTender.teamMembers || []).filter(mid => mid !== id);
    TenderStore.update(currentTender);
    renderTeamPanel();
  }
  renderRosterPanel();
}

function saveRosterPerson() {
  const name = document.getElementById('roster-inp-name')?.value.trim();
  const role = document.getElementById('roster-inp-role')?.value.trim();
  const email = document.getElementById('roster-inp-email')?.value.trim();
  const exp   = document.getElementById('roster-inp-exp')?.value.trim();
  const edu   = document.getElementById('roster-inp-edu')?.value.trim();
  const cv    = document.getElementById('roster-inp-cv')?.value.trim();
  if (!name) return;

  const person = defaultPerson();
  person.name = name;
  person.role = role || '';
  person.email = email || '';
  person.yearsExperience = exp || '';
  person.education = edu || '';
  person.cvNotes = cv || '';
  TeamStore.add(person);

  // clear form
  ['name','role','email','exp','edu','cv'].forEach(f => {
    const el = document.getElementById('roster-inp-' + f);
    if (el) el.value = '';
  });
  renderRosterPanel();
}

function getRosterPerson(id) { return TeamStore.get(id); }

// ─── escapeHtml helper (safe duplicate — no-op if already defined in app.js) ─
if (typeof escapeHtml === 'undefined') {
  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}

/* ═══════════ js/app.js — bootstrap · board · composer(+edit) · archive (v0.3) ═══════════ */
// Note: escapeHtml, blip, chime, burst moved to fx.js to avoid duplication and load order issues

/* ---------- board ---------- */
const DONE_MSGS = [
  'Board cleared. Dopamine served. 🍽️',
  'All done — go be gloriously unproductive.',
  'That\u2019s the whole list. Iconic.',
  'Every box ticked. Brain, high five. ✋',
];

function habitRow(h){
  const done = !!h.done[dkey(0)];
  const s = streakOf(h);
  
  // Generate 7-day visual dots
  const days = lastNDays(7);
  const dotsHtml = days.map(k => 
    `<span class="sdot ${h.done[k] ? 'on' : ''}" title="${k}"></span>`
  ).join('');

  return `<li class="habit ${done ? 'is-done' : ''}" data-id="${h.id}" style="--tint:${COLORS[h.color] || COLORS.sun}">
    <button class="check" aria-label="${done ? 'uncheck' : 'check'} ${escapeHtml(h.name)}">${done ? h.emoji : ''}</button>
    <div class="habit-meta">
      <span class="habit-name">${escapeHtml(h.name)}</span>
      <span class="habit-sub">${FREQ_LABEL[h.freq] || 'every day'}</span>
    </div>
    <div class="streak-dots">${dotsHtml}</div>
    ${h.note ? `<span class="note-chip" title="${escapeHtml(h.note)}">📝</span>` : ''}
    ${s ? `<span class="flame ${s >= 3 ? 'hot' : ''}" title="streak — one grace day protected">🔥${s}</span>` : ''}
    <button class="edit" title="edit">✎</button>
    <button class="del" title="archive (never lost)">🗄</button>
  </li>`;
}

function renderBoard(){
  document.getElementById('habitList').innerHTML = activeHabits().map(habitRow).join('');
  updateProgress();
}
function refreshBoard(){ renderBoard(); }

function updateProgress(){
  const habits = activeHabits();
  const total = habits.length;
  const done = habits.filter(h => h.done[dkey(0)]).length;
  document.getElementById('ringFg').style.strokeDashoffset = 188.5 * (total ? (1 - done / total) : 1);
  document.getElementById('ringLabel').textContent = `${done}/${total}`;

  const banner = document.getElementById('doneBanner');
  if(total && done === total){
    if(banner.hidden){
      banner.hidden = false;
      banner.textContent = DONE_MSGS[Math.floor(Math.random() * DONE_MSGS.length)];
      const r = banner.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top, ['🎉','✨','🔥']);
      chime();
    }
  } else banner.hidden = true;
}

function renderHeat(){
  const days = lastNDays(7);
  const letters = days.map(k => new Date(k + 'T00:00').toLocaleDateString(undefined, { weekday:'narrow' }));
  let html = `<div class="heat-row heat-head"><span></span>${letters.map(l => `<span>${l}</span>`).join('')}</div>`;
  html += activeHabits().map(h => {
    const cells = days.map(k =>
      `<div class="heat-cell ${h.done[k] ? 'on' : ''}" style="--tint:${COLORS[h.color]}" title="${k}"></div>`).join('');
    return `<div class="heat-row"><span class="heat-label">${h.emoji} ${escapeHtml(h.name)}</span>${cells}</div>`;
  }).join('');
  document.getElementById('heat').innerHTML = html;
}

/* ---------- archive tray ---------- */
function renderArchive(){
  const list = state.habits.filter(h => h.archived);
  const btn = document.getElementById('archiveBtn');
  const tray = document.getElementById('archiveTray');
  btn.hidden = list.length === 0;
  btn.textContent = `🗄 archive (${list.length})`;
  if(list.length === 0) tray.hidden = true;
  tray.innerHTML = list.map(h => `
    <div class="arch-row" data-id="${h.id}">
      <span class="arch-name">${h.emoji} ${escapeHtml(h.name)}</span>
      <button class="btn mini act-restore" title="bring it back">↩</button>
      <button class="btn mini danger act-del" title="delete forever">✕</button>
    </div>`).join('');
}

function wireArchive(){
  document.getElementById('archiveBtn').addEventListener('click', () => {
    const tray = document.getElementById('archiveTray');
    tray.hidden = !tray.hidden;
  });
  document.getElementById('archiveTray').addEventListener('click', e => {
    const row = e.target.closest('.arch-row');
    if(!row) return;
    const id = row.dataset.id;
    if(e.target.closest('.act-restore')){ restoreHabit(id); blip(640); }
    if(e.target.closest('.act-del')){
      if(!confirm('Delete this habit forever?')) return;
      deleteForever(id); blip(280);
    }
    renderBoard(); renderHeat(); renderArchive(); SidePanels.renderSpotlight();
  });
}

/* ---------- list events ---------- */
function wireList(){
  document.getElementById('habitList').addEventListener('click', e => {
    const row = e.target.closest('.habit');
    if(!row) return;
    const id = row.dataset.id;

    if(e.target.closest('.del')){                       // archive
      archiveHabit(id); blip(360);
      renderBoard(); renderHeat(); renderArchive(); SidePanels.renderSpotlight();
      return;
    }
    if(e.target.closest('.edit')){                      // edit
      openComposer(state.habits.find(x => x.id === id));
      return;
    }
    if(e.target.closest('.check') || e.target.closest('.habit-meta')){
      const nowDone = toggleHabit(id);
      if(nowDone){
        const c = row.querySelector('.check').getBoundingClientRect();
        burst(c.left + c.width / 2, c.top + c.height / 2);
        blip(700);
      } else blip(300);
      renderBoard(); renderHeat(); SidePanels.renderSpotlight();
    }
  });
}

/* ---------- composer (add + edit) ---------- */
function wireComposer(){
  const dlg = document.getElementById('composer');
  const form = document.getElementById('habitForm');
  const noteEl = document.getElementById('hNote');
  const titleEl = dlg.querySelector('h3');
  const submitBtn = form.querySelector('[type="submit"]');
  let emoji = EMOJIS[0], color = 'sun', editingId = null;

  const emojiRow = document.getElementById('emojiRow');
  const colorRow = document.getElementById('colorRow');
  emojiRow.innerHTML = EMOJIS.map(e => `<button type="button" class="emoji-opt" data-e="${e}">${e}</button>`).join('');
  colorRow.innerHTML = Object.keys(COLORS).map(k =>
    `<button type="button" class="color-opt" data-c="${k}" style="background:${COLORS[k]}" aria-label="${k}"></button>`).join('');

  const mark = () => {
    emojiRow.querySelectorAll('.emoji-opt').forEach(b => b.classList.toggle('sel', b.dataset.e === emoji));
    colorRow.querySelectorAll('.color-opt').forEach(b => b.classList.toggle('sel', b.dataset.c === color));
  };
  emojiRow.addEventListener('click', e => { const b = e.target.closest('.emoji-opt'); if(b){ emoji = b.dataset.e; mark(); } });
  colorRow.addEventListener('click', e => { const b = e.target.closest('.color-opt'); if(b){ color = b.dataset.c; mark(); } });

  window.openComposer = function(habit){
    editingId = habit ? habit.id : null;
    form.reset();
    if(habit){
      document.getElementById('hName').value = habit.name;
      noteEl.value = habit.note || '';
      document.getElementById('hFreq').value = habit.freq;
      emoji = habit.emoji; color = habit.color;
      titleEl.textContent = 'Edit habit ✏️';
      submitBtn.textContent = 'save changes ✓';
    } else {
      emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      titleEl.textContent = 'New tiny habit ✨';
      submitBtn.textContent = 'add it ✓';
    }
    mark();
    dlg.showModal();
    setTimeout(() => document.getElementById('hName').focus(), 50);
  };

  document.getElementById('addBtn').addEventListener('click', () => openComposer());
  document.getElementById('cancelBtn').addEventListener('click', () => dlg.close());

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('hName').value.trim();
    if(!name){ dlg.classList.add('shake'); setTimeout(() => dlg.classList.remove('shake'), 400); return; }
    const data = { name, emoji, color, freq: document.getElementById('hFreq').value, note: noteEl.value.trim() };
    editingId ? updateHabit(editingId, data) : addHabit(data);
    dlg.close();
    renderBoard(); renderHeat(); SidePanels.renderSpotlight();
    const r = document.getElementById('addBtn').getBoundingClientRect();
    burst(r.left + r.width / 2, r.top, ['✨']);
    chime();
  });
}

function wireSound(){
  const btn = document.getElementById('soundBtn');
  const paint = () => {
    btn.textContent = state.sound ? '🔊' : '🔇';
    btn.setAttribute('aria-pressed', state.sound);
  };
  paint();
  btn.addEventListener('click', () => {
    state.sound = !state.sound; Store.save(state); paint();
    if(state.sound) blip(700);
  });
}

/* ---------- go ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('todayDate').textContent =
    new Date().toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' });

  renderBoard(); renderHeat(); renderArchive();
  wireList(); wireComposer(); wireSound(); wireArchive();
  TimerPanel.init();
  SidePanels.init();

  /* --- 🧠 Wire the Brain Dump --- */
  const dumpEl = document.getElementById('brainDump');
  if(dumpEl){
    // Initialize state object if it doesn't exist
    if(!state.brainDump) state.brainDump = {};
    
    // Load today's dump
    dumpEl.value = state.brainDump[dkey(0)] || '';
    
    // Auto-save on typing (debounced slightly for performance)
    let saveTimeout;
    dumpEl.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        state.brainDump[dkey(0)] = dumpEl.value;
        Store.save(state);
      }, 300);
    });
  }
});

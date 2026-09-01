/* ═══════════ js/settings.js — calm · theme · backup (loads after app.js) ═══════════ */

(function(){

  /* --- 🌿 calm mode --- */
  const calmBtn = document.getElementById('calmBtn');
  const applyCalm = () => {
    document.body.classList.toggle('calm', !!state.calm);
    calmBtn.setAttribute('aria-pressed', String(!!state.calm));
  };
  calmBtn.addEventListener('click', () => {
    state.calm = !state.calm; Store.save(state); applyCalm(); blip(480);
  });
  applyCalm();

  // in calm mode, skip confetti entirely
  const _burst = burst;
  burst = function(...args){ if(state.calm) return; _burst(...args); };

  /* --- 🌙 night mode --- */
  const themeBtn = document.getElementById('themeBtn');
  const applyTheme = () => {
    const night = state.theme === 'night';
    document.documentElement.setAttribute('data-theme', night ? 'night' : 'day');
    themeBtn.textContent = night ? '☀️' : '🌙';
    themeBtn.title = night ? 'switch to day mode' : 'switch to night mode';
  };
  themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'night' ? 'day' : 'night';
    Store.save(state); applyTheme(); blip(520);
  });
  applyTheme();

  /* --- ⬇ export --- */
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `loop-backup-${dkey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    blip(700);
  });

  /* --- ⬆ import --- */
  const fileInput = document.getElementById('importFile');
  document.getElementById('importBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        if(!Array.isArray(data.habits)) throw new Error('bad file');
        state = Object.assign({}, state, data);
        Store.save(state);
        location.reload();
      }catch(e){
        alert('That file doesn\u2019t look like a Loop backup.');
      }
    };
    reader.readAsText(f);
  });

  /* --- 🧨 start fresh --- */
  document.getElementById('wipeBtn').addEventListener('click', () => {
    if(confirm('Start fresh? This deletes all habits & streaks on this device.')){
      localStorage.removeItem(KEY);
      location.reload();
    }
  });

})();
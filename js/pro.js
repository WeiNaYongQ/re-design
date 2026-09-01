/* ═══════════ js/pro.js — Loop Pro: license · badges · month view · CSV · dusk (v0.6) ═══════════ */

/* ↓↓↓ TODO: paste YOUR Gumroad/LemonSqueezy product link here ↓↓↓ */
const PRO_URL = 'https://YOUR-NAME.gumroad.com/l/loop-pro';

function hasPro(){ return !!(state.pro && state.pro.active); }

/* honor-system check for now (any key from a receipt, 8+ chars).
   UPGRADE PATH: replace this body with a fetch() to a tiny Cloudflare Worker
   that verifies against the Gumroad/LemonSqueezy API — nothing else changes. */
function verifyKey(k){ return k.trim().length >= 8; }

function activatePro(key){
  state.pro = { active:true, key:key.trim(), since:dkey() };
  Store.save(state);
}

/* ---------- milestones ---------- */
function bestStreakEver(h){
  const days = Object.keys(h.done).filter(k => h.done[k]).sort();
  if(!days.length) return 0;
  let best = 1, cur = 1;
  for(let i = 1; i < days.length; i++){
    const diff = (new Date(days[i] + 'T00:00') - new Date(days[i-1] + 'T00:00')) / 86400000;
    cur = diff === 1 ? cur + 1 : 1;
    if(cur > best) best = cur;
  }
  return best;
}

const TIERS = [[30,'💎','30-day'], [14,'🥇','14-day'], [7,'🥈','7-day'], [3,'🥉','3-day']];

function renderBadges(){
  const el = document.getElementById('badges');
  if(!el) return;
  let max = 0;
  activeHabits().forEach(h => { max = Math.max(max, bestStreakEver(h)); });
  el.innerHTML = TIERS.map(([n, icon, label]) => `
    <div class="badge ${max >= n ? 'won' : 'not'}">
      <span class="badge-icon">${icon}</span><span class="badge-label">${label}</span>
    </div>`).join('') +
    `<p class="whisper">best streak ever, across all habits: ${max} day${max === 1 ? '' : 's'}</p>`;
}

/* ---------- month view ---------- */
function renderMonth(){
  const grid = document.getElementById('monthGrid');
  if(!grid) return;
  const days = lastNDays(30);
  const habits = activeHabits();
  let total = 0;
  grid.innerHTML = days.map(k => {
    const n = habits.filter(h => h.done[k]).length;
    total += n;
    const lvl = habits.length ? Math.round(n / habits.length * 4) : 0;
    return `<div class="mcell lvl${lvl}" title="${k} · ${n}/${habits.length}"></div>`;
  }).join('');
  const pct = habits.length ? Math.round(total / (habits.length * 30) * 100) : 0;
  const sub = document.getElementById('monthSub');
  if(sub) sub.textContent = `${total} tiny wins · ${pct}% of the last 30 days`;
}

/* ---------- CSV export ---------- */
function exportCSV(){
  const days = lastNDays(30);
  const rows = [['habit', ...days]];
  activeHabits().forEach(h => rows.push([h.name, ...days.map(k => h.done[k] ? 1 : 0)]));
  const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
  a.download = `loop-export-${dkey()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  if(typeof chime === 'function') chime();
}

/* ---------- wire everything ---------- */
(function(){
  const modal = document.getElementById('proModal');

  window.openPro = function(){ if(modal) modal.showModal(); };

  if(modal){
    document.getElementById('buyLink').href = PRO_URL;
    document.getElementById('proClose').addEventListener('click', () => modal.close());

    document.getElementById('activateBtn').addEventListener('click', () => {
      const note = document.getElementById('proNote');
      const k = document.getElementById('proKey').value;
      if(verifyKey(k)){
        activatePro(k);
        note.textContent = 'unlocked — thank you for funding the zigzag 💛';
        if(typeof chime === 'function') chime();
        setTimeout(() => location.reload(), 900);
      } else {
        note.textContent = 'that key doesn\u2019t look right — paste the one from your receipt';
      }
    });

    document.querySelectorAll('.theme-dot').forEach(d => d.addEventListener('click', () => {
      const t = d.dataset.theme;
      if(t === 'dusk' && !hasPro()) return;
      state.theme = t; Store.save(state);
      document.documentElement.setAttribute('data-theme', t);
      if(typeof blip === 'function') blip(520);
    }));
  }

  document.querySelectorAll('.pro-lock, [data-open-pro]').forEach(el =>
    el.addEventListener('click', openPro));

  const csvBtn = document.getElementById('csvBtn');
  if(csvBtn) csvBtn.addEventListener('click', () => hasPro() ? exportCSV() : openPro());

  renderBadges();
  renderMonth();

  /* paint locks + header button */
  const pro = hasPro();
  document.querySelectorAll('.pro-gate').forEach(el => el.classList.toggle('locked', !pro));
  const btn = document.getElementById('proBtn');
  if(btn){
    btn.textContent = pro ? '✨ Pro' : '🔒 Pro';
    btn.title = pro ? 'Loop Pro active — thank you' : 'Loop Pro — $5 once';
    btn.classList.toggle('is-pro', pro);
  }
})();
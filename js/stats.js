/* ═══════════ js/stats.js — the receipts page logic ═══════════ */

const BAR_COLORS = ['#FF6157','#FFC933','#1FBE9C','#4FA6FF','#9C7BFF','#FF8FC0'];
const PAGE_QUOTES = ['tiny wins compound','done beats perfect','zigzag progress is still progress','your brain did good this week','momentum over perfection'];

function esc(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function countUp(el, to, suffix = ''){
  const t0 = performance.now(), dur = 900;
  (function step(t){
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix;
    if(p < 1) requestAnimationFrame(step);
  })(t0);
}

function maxStreak(h){
  const keys = Object.keys(h.done).sort();
  let best = 0, run = 0, prev = null;
  keys.forEach(k => {
    run = prev && (new Date(k + 'T00:00') - new Date(prev + 'T00:00')) / 86400000 === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  });
  return best;
}

/* lightweight theme/calm/sound for this page (same state, same buttons) */
function wireSettings(){
  const themeBtn = document.getElementById('themeBtn');
  const applyTheme = () => {
    const n = state.theme === 'night';
    document.documentElement.setAttribute('data-theme', n ? 'night' : 'day');
    themeBtn.textContent = n ? '☀️' : '🌙';
  };
  themeBtn.addEventListener('click', () => { state.theme = state.theme === 'night' ? 'day' : 'night'; Store.save(state); applyTheme(); });
  applyTheme();

  const calmBtn = document.getElementById('calmBtn');
  const applyCalm = () => {
    document.body.classList.toggle('calm', !!state.calm);
    calmBtn.setAttribute('aria-pressed', String(!!state.calm));
  };
  calmBtn.addEventListener('click', () => { state.calm = !state.calm; Store.save(state); applyCalm(); });
  applyCalm();

  const soundBtn = document.getElementById('soundBtn');
  const applySound = () => { soundBtn.textContent = state.sound ? '🔊' : '🔇'; soundBtn.setAttribute('aria-pressed', state.sound); };
  soundBtn.addEventListener('click', () => { state.sound = !state.sound; Store.save(state); applySound(); });
  applySound();
}

function renderAll(){
  const days = lastNDays(7);
  const habits = activeHabits();
  const fmt = k => new Date(k + 'T00:00').toLocaleDateString(undefined, { month:'short', day:'numeric' });

  document.getElementById('range').textContent = `${fmt(days[0])} → ${fmt(days[6])}`;
  document.getElementById('quoteLine').textContent = '“' + PAGE_QUOTES[Math.floor(Math.random() * PAGE_QUOTES.length)] + '”';

  const counts = days.map(k => habits.filter(h => h.done[k]).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const pct = habits.length ? Math.min(100, Math.round(total / (habits.length * 7) * 100)) : 0;

  setTimeout(() => { document.getElementById('bigRing').style.strokeDashoffset = 527.8 * (1 - pct / 100); }, 120);
  countUp(document.getElementById('bigPct'), pct, '%');
  countUp(document.getElementById('vChecks'), total);

  let best = { streak:0, emoji:'✦' };
  habits.forEach(h => { const s = streakOf(h); if(s > best.streak) best = { streak:s, emoji:h.emoji }; });
  document.getElementById('vStreak').textContent = `${best.streak} ${best.emoji}`;

  let vDay = '—', max = 0;
  counts.forEach((c, i) => { if(c > max){ max = c; vDay = new Date(days[i] + 'T00:00').toLocaleDateString(undefined, { weekday:'short' }); } });
  document.getElementById('vDay').textContent = vDay;

  /* animated bars */
  const top = Math.max(1, ...counts);
  const bars = document.getElementById('bars');
  bars.innerHTML = days.map((k, i) => `
    <div class="bar-col">
      <span class="bar-count">${counts[i]}</span>
      <div class="bar" style="background:${BAR_COLORS[i % BAR_COLORS.length]}" data-h="${14 + (counts[i] / top) * 130}"></div>
      <span class="bar-day">${new Date(k + 'T00:00').toLocaleDateString(undefined, { weekday:'short' })}</span>
    </div>`).join('');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bars.querySelectorAll('.bar').forEach(b => b.style.height = b.dataset.h + 'px');
  }));

  /* leaderboard */
  const lb = document.getElementById('lb');
  if(!habits.length){
    lb.innerHTML = `<p class="empty">no active habits yet — <a href="index.html" style="text-decoration:underline">go add a tiny one</a> 🌱</p>`;
  } else {
    const medals = ['🥇','','🥉'];
    lb.innerHTML = habits
      .map(h => ({ h, wk: days.filter(k => h.done[k]).length }))
      .sort((a, b) => b.wk - a.wk)
      .map((r, i) => `
      <div class="lb-row" style="--tint:${COLORS[r.h.color] || COLORS.sun}">
        <span class="lb-name">${medals[i] || '·'} ${r.h.emoji} ${esc(r.h.name)}</span>
        <span class="lb-cells">${days.map(k => `<i class="${r.h.done[k] ? 'on' : ''}"></i>`).join('')}</span>
        <span class="lb-streak">🔥${streakOf(r.h)}</span>
        <span class="lb-pct">${Math.round(r.wk / 7 * 100)}%</span>
      </div>`).join('');
  }

  /* all-time */
  let totalEver = 0, longest = 0, perfect = 0;
  const dateSet = new Set();
  habits.forEach(h => {
    const keys = Object.keys(h.done);
    totalEver += keys.length;
    keys.forEach(k => dateSet.add(k));
    longest = Math.max(longest, maxStreak(h));
  });
  dateSet.forEach(k => {
    if(habits.length && habits.filter(h => h.done[k]).length === habits.length) perfect++;
  });
  countUp(document.getElementById('tChecks'), totalEver);
  countUp(document.getElementById('tStreak'), longest);
  countUp(document.getElementById('tPerfect'), perfect);
  document.getElementById('tHabits').textContent = habits.length;
}

document.addEventListener('DOMContentLoaded', () => {
  wireSettings();
  renderAll();
  LoopReport.bindDownload('dlBtn');
});
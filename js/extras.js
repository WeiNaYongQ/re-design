/* ═══════════ js/extras.js — energy check-in · "just one thing" · reveals · CTA ═══════════ */

const NOTES = {
  1:'running on fumes — pick the tiniest win',
  2:'low battery — gentle mode engaged',
  3:'steady-ish. one thing at a time',
  4:'good sparks today ✦',
  5:'fully charged — aim at the big one'
};

const SidePanels = (() => {
  let renderSpot = null;

  function init(){ battery(); renderSpot = buildSpotlight(); reveal(); cta(); }

  function battery(){
    const cells = [...document.querySelectorAll('#batteryCells .bcell')];
    const note = document.getElementById('batteryNote');
    const paint = n => {
      cells.forEach((c, i) => c.classList.toggle('on', i < n));
      note.textContent = n ? NOTES[n] : 'how\u2019s your battery right now?';
    };
    paint(state.energy[dkey(0)] || 0);
    cells.forEach((c, i) => c.addEventListener('click', () => {
      state.energy[dkey(0)] = i + 1; Store.save(state);
      paint(i + 1); blip(520 + i * 90);
    }));
  }

  function buildSpotlight(){
    document.getElementById('spotShuffle').addEventListener('click', render);
    document.getElementById('spotDone').addEventListener('click', () => {
      const card = document.getElementById('spotCard');
      const id = card.dataset.id;
      if(!id) return;
      if(toggleHabit(id)){
        const r = card.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2);
        chime();
      }
      refreshBoard(); render();
    });
    render();
    return render;
  }

  function render(){
    const card = document.getElementById('spotCard');
    const doneBtn = document.getElementById('spotDone');

    if(!activeHabits().length){
      card.dataset.id = ''; doneBtn.disabled = true;
      card.innerHTML = `<div class="spot-emoji">🌱</div>
        <div class="spot-name">No habits yet</div>
        <p class="spot-hint">add one tiny thing to get rolling</p>`;
      return;
    }
    const open = activeHabits().filter(h => !h.done[dkey(0)]);
    if(!open.length){
      card.dataset.id = ''; doneBtn.disabled = true;
      card.innerHTML = `<div class="spot-emoji">🌿</div>
        <div class="spot-name">All clear!</div>
        <p class="spot-hint">nothing left today. go exist outside.</p>`;
      return;
    }
    const h = open[Math.floor(Math.random() * open.length)];
    const low = (state.energy[dkey(0)] || 5) <= 2;
    card.dataset.id = h.id; doneBtn.disabled = false;
    card.innerHTML = `<div class="spot-emoji">${h.emoji}</div>
      <div class="spot-name">${escapeHtml(h.name)}</div>
      <p class="spot-hint">${low ? 'low-battery day: do the laziest version' : 'ignore the rest of the list — just this'}</p>`;
  }

  function reveal(){
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold:.15 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  function cta(){
    document.getElementById('ctaBtn').addEventListener('click', () => {
      document.getElementById('app').scrollIntoView({ behavior:'smooth' });
      setTimeout(() => {
        const first = document.querySelector('.habit:not(.is-done)') || document.querySelector('.habit');
        if(first){ first.classList.add('pulse-me'); setTimeout(() => first.classList.remove('pulse-me'), 2200); }
      }, 600);
    });
  }

  return { init, renderSpotlight: () => renderSpot && renderSpot() };
})();
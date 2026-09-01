/* ═══════════ js/timer.js — visible focus timer + body-double whispers ═══════════ */

const TimerPanel = (() => {
  const C = 339.3;
  const PHRASES = [
    'You don\'t have to feel ready.',
    'Just the first two minutes.',
    'Boring is allowed. Boring works.',
    'One tab. One task. One brain.',
    'Progress over polish.',
    'Future you says thanks.',
  ];

  let dur = 15 * 60, left = dur, running = false, endAt = 0;
  let interval = null, whisperTimer = null, whisperIdx = 0;

  function init(){
    document.querySelectorAll('.preset').forEach(b => {
      b.addEventListener('click', () => {
        if (running) stop();
        dur = +b.dataset.min * 60; 
        left = dur;
        endAt = 0;  // ⬅️ FIX: clear old end time
        document.querySelectorAll('.preset').forEach(x => x.classList.toggle('active', x === b));
        paint();
      });
    });
    document.getElementById('tStart').addEventListener('click', () => running ? stop() : start());
    document.getElementById('tReset').addEventListener('click', () => { stop(); left = dur; endAt = 0; paint(); });
    paint();
  }

  function start(){
    running = true;
    endAt = Date.now() + left * 1000;
    document.getElementById('tStart').textContent = 'Pause';
    interval = setInterval(tick, 250);
    rotateWhisper();
    whisperTimer = setInterval(rotateWhisper, 20000);
    blip(520);
  }

  function stop(){
    running = false;
    clearInterval(interval);
    clearInterval(whisperTimer);
    document.getElementById('tStart').textContent = 'Start';
    if (endAt > 0) {  // ⬅️ FIX: only calculate if timer was running
      left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    }
  }

  function tick(){
    left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    paint();
    if(left <= 0) finish();
  }

  function paint(){
    const m = String(Math.floor(left / 60)).padStart(2,'0');
    const s = String(left % 60).padStart(2,'0');
    document.getElementById('tDigits').textContent = `${m}:${s}`;
    document.getElementById('tRing').style.strokeDashoffset = C * (1 - left / dur);
  }

  function rotateWhisper(){
    const el = document.getElementById('tWhisper');
    el.style.opacity = 0;
    setTimeout(() => {
      whisperIdx = (whisperIdx + 1) % PHRASES.length;
      el.textContent = PHRASES[whisperIdx];
      el.style.opacity = 1;
    }, 350);
  }

  function finish(){
    stop();
    left = dur;
    endAt = 0;  // ⬅️ FIX: clear end time
    paint();
    const panel = document.getElementById('focus');
    panel.classList.add('timer-done');
    setTimeout(() => panel.classList.remove('timer-done'), 2000);
    const r = panel.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 3, ['⏰','✨','💧']);
    document.getElementById('tWhisper').textContent = 'Time! Stand up. Water. Stretch. You did it.';
    chime();
  }

  return { init };
})();
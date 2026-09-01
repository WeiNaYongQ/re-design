/* ═══════════ js/fx.js — shared sugar: escape · sound · confetti ═══════════ */

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let actx = null;
function blip(freq = 660){
  if(!state.sound) return;
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(.15, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + .2);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + .22);
  }catch(e){}
}
function chime(){ [660, 880, 1175].forEach((f, i) => setTimeout(() => blip(f), i * 110)); }

const BITS = ['✦','✚','●','▲','♥','★'];
function burst(x, y, extra = []){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.getElementById('confettiLayer');
  if(!layer) return;
  const pool = [...BITS, ...extra];
  const colors = Object.values(COLORS);
  for(let i = 0; i < 16; i++){
    const b = document.createElement('span');
    b.className = 'bit';
    b.textContent = pool[Math.floor(Math.random() * pool.length)];
    b.style.left = x + 'px'; b.style.top = y + 'px';
    b.style.color = colors[Math.floor(Math.random() * colors.length)];
    layer.appendChild(b);
    const ang = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 90;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 40;
    b.animate([
      { transform:'translate(-50%,-50%) scale(1) rotate(0deg)', opacity:1 },
      { transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 80}px)) scale(${.4 + Math.random() * .8}) rotate(${(Math.random() * 2 - 1) * 240}deg)`, opacity:0 }
    ], { duration: 800 + Math.random() * 500, easing:'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => b.remove();
  }
}
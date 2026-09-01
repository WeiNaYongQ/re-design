/* ═══════════ js/storage.js — state model + persistence ═══════════ */

const KEY = 'loop.state.v1';

const COLORS = { sun:'#FFC933', coral:'#FF6157', mint:'#1FBE9C', sky:'#4FA6FF', grape:'#9C7BFF', pink:'#FF8FC0' };
const EMOJIS = ['💧','🏃','💊','📓','🧘','🦷','🌞','🎨','📚','💤','🧹','🎧'];

/** local-day key, `offset` days ago → "YYYY-MM-DD" */
function dkey(offset = 0){
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function seedState(){
  const seed = [
    { name:'Take meds',           emoji:'💊', color:'coral', freq:'daily' },
    { name:'One glass of water',  emoji:'💧', color:'sky',   freq:'daily' },
    { name:'10-min walk',         emoji:'🏃', color:'mint',  freq:'daily' },
    { name:'Brain dump on paper', emoji:'📓', color:'grape', freq:'daily' },
  ].map((h, i) => ({ id:'h' + (i + 1), ...h, done:{} }));

  // a little history so streaks feel alive on first visit
  seed[0].done[dkey(1)] = true; seed[0].done[dkey(2)] = true;
  seed[1].done[dkey(1)] = true;
  seed[2].done[dkey(2)] = true;

  return { sound:true, energy:{}, habits:seed };
}

const Store = {
  load(){ try{ const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; } },
  save(state){ try{ localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){} }
};

let state = Store.load() || seedState();
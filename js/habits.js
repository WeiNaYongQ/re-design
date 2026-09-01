/* ═══════════ js/habits.js — CRUD · streaks · archive (v0.3) ═══════════ */

const FREQ_LABEL = { daily:'every day', weekdays:'weekdays', '3x':'3× a week' };

/** everything the board cares about — archived habits are invisible everywhere */
const activeHabits = () => state.habits.filter(h => !h.archived);

function streakOf(habit){
  let s = 0, misses = 0;
  const offset = habit.done[dkey(0)] ? 0 : 1;
  for(let i = offset; i < 365; i++){
    if(habit.done[dkey(i)]){ s++; misses = 0; }
    else{ misses++; if(misses > 1) break; }
  }
  return s;
}

function toggleHabit(id){
  const h = state.habits.find(x => x.id === id);
  if(!h) return false;
  const k = dkey(0);
  const nowDone = !h.done[k];
  nowDone ? h.done[k] = true : delete h.done[k];
  Store.save(state);
  return nowDone;
}

function addHabit(data){
  state.habits.push({ id:'h' + Date.now(), done:{}, note:'', archived:false, ...data });
  Store.save(state);
}

function updateHabit(id, patch){
  const h = state.habits.find(x => x.id === id);
  if(h){ Object.assign(h, patch); Store.save(state); }
}

function archiveHabit(id){ updateHabit(id, { archived:true }); }
function restoreHabit(id){ updateHabit(id, { archived:false }); }

function deleteForever(id){
  state.habits = state.habits.filter(h => h.id !== id);
  Store.save(state);
}

function lastNDays(n){
  return Array.from({ length:n }, (_, i) => dkey(n - 1 - i));
}
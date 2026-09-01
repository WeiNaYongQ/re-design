/* ═══════════ js/reminder-ui.js — Reminder modal UI handler ═══════════ */

(function(){

  const modal = document.getElementById('reminderModal');
  const reminderBtn = document.getElementById('reminderBtn');
  
  if(!modal || !reminderBtn){
    console.warn('Reminder UI elements not found');
    return;
  }

  // Open reminder modal
  reminderBtn.addEventListener('click', () => {
    Reminders.requestPermission().then(granted => {
      if(granted || Notification.permission === 'granted'){
        loadReminderUI();
        modal.showModal();
        reminderBtn.setAttribute('aria-pressed', 'true');
      }
    });
  });

  // Close modal
  document.getElementById('reminderClose').addEventListener('click', () => {
    modal.close();
    reminderBtn.setAttribute('aria-pressed', 'false');
  });

  // Toggle reminders on/off
  const enabledCheckbox = document.getElementById('reminderEnabled');
  enabledCheckbox.addEventListener('change', () => {
    const reminders = Reminders.load();
    reminders.enabled = enabledCheckbox.checked;
    Reminders.save(reminders);
    
    if(enabledCheckbox.checked){
      blip(520);
    }else{
      blip(380);
    }
  });

  // Add new time
  const addTimeBtn = document.getElementById('addTimeBtn');
  const newTimeInput = document.getElementById('newTimeInput');
  
  addTimeBtn.addEventListener('click', () => {
    const timeValue = newTimeInput.value;
    if(!timeValue){
      alert('Please select a time');
      return;
    }
    
    const reminders = Reminders.load();
    
    // Avoid duplicates
    if(reminders.times.includes(timeValue)){
      alert('This time is already added');
      return;
    }
    
    // Add and sort times
    reminders.times.push(timeValue);
    reminders.times.sort();
    Reminders.save(reminders);
    
    // Clear input and reload UI
    newTimeInput.value = '';
    loadReminderUI();
    blip(480);
  });

  // Test notification button
  document.getElementById('testNotifBtn').addEventListener('click', () => {
    Reminders.sendTest();
    blip(600);
  });

  // Load reminder settings into UI
  function loadReminderUI(){
    const reminders = Reminders.load();
    
    // Set toggle state
    enabledCheckbox.checked = reminders.enabled;
    
    // Render time list
    const timeList = document.getElementById('timeList');
    if(reminders.times.length === 0){
      timeList.innerHTML = '<p class="hint">No reminder times set yet.</p>';
    }else{
      timeList.innerHTML = reminders.times.map(time => `
        <div class="time-item">
          <span>${formatTime(time)}</span>
          <button class="btn btn-small remove-time" data-time="${time}">✕</button>
        </div>
      `).join('');
      
      // Wire up remove buttons
      timeList.querySelectorAll('.remove-time').forEach(btn => {
        btn.addEventListener('click', () => {
          const timeToRemove = btn.dataset.time;
          const rems = Reminders.load();
          rems.times = rems.times.filter(t => t !== timeToRemove);
          Reminders.save(rems);
          loadReminderUI();
          blip(420);
        });
      });
    }
  }

  // Format time for display (24h → 12h with AM/PM)
  function formatTime(timeStr){
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }

  // Initial load
  loadReminderUI();

})();

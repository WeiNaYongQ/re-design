/* ═══════════ js/reminders.js — browser notifications for habits ═══════════ */

(function(){

  const REMINDER_KEY = 'loop.reminders.v1';
  
  // Default reminder structure
  const defaultReminders = {
    enabled: false,
    times: ['08:00']  // Start with one morning reminder
  };

  // Load saved reminders or return defaults
  function loadReminders(){
    try{
      const raw = localStorage.getItem(REMINDER_KEY);
      return raw ? JSON.parse(raw) : {...defaultReminders};
    }catch(e){
      return {...defaultReminders};
    }
  }

  // Save reminders to localStorage
  function saveReminders(reminders){
    try{
      localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
    }catch(e){}
  }

  // Request notification permission
  function requestPermission(){
    if(!('Notification' in window)){
      alert('Your browser does not support notifications.');
      return Promise.resolve(false);
    }
    
    if(Notification.permission === 'granted'){
      return Promise.resolve(true);
    }
    
    if(Notification.permission === 'denied'){
      alert('Notifications are blocked. Please enable them in your browser settings.');
      return Promise.resolve(false);
    }
    
    return Notification.requestPermission().then(permission => permission === 'granted');
  }

  // Get today's date key
  function todayKey(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // Find a random undone habit
  function getRandomUndoneHabit(){
    const today = todayKey();
    const activeHabits = (state.habits || []).filter(h => !h.archived);
    const undone = activeHabits.filter(h => !h.done[today]);
    
    if(undone.length === 0){
      return null;  // All done!
    }
    
    const idx = Math.floor(Math.random() * undone.length);
    return undone[idx];
  }

  // Send a notification
  function sendNotification(){
    const habit = getRandomUndoneHabit();
    
    let title, body;
    
    if(habit){
      title = habit.name;
      body = `${habit.emoji} Time to ${habit.name.toLowerCase()}?`;
    }else{
      title = 'All done today! 🎉';
      body = 'You\'ve completed all your habits. Great job!';
    }
    
    if(!('Notification' in window) || Notification.permission !== 'granted'){
      // Fall back to requesting permission
      if(!('Notification' in window)){
        console.warn('Notifications not supported');
        return;
      }
      if(Notification.permission === 'default'){
        requestPermission().then(granted => {
          if(granted) sendNotification();
        });
        return;
      }
      return;
    }
    
    // Show notification
    new Notification(title, {
      body: body,
      icon: './icons/icon.svg',
      badge: './icons/icon.svg',
      tag: 'loop-reminder',  // Replace previous notifications
      requireInteraction: false
    });
    
    // Play sound if enabled
    if(state.sound !== false){
      blip(600);
    }
  }

  // Check if it's time for a reminder
  function checkReminders(){
    const reminders = loadReminders();
    
    if(!reminders.enabled){
      return;
    }
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const currentSeconds = now.getSeconds();
    
    // Only trigger at the start of the minute (seconds = 0)
    if(currentSeconds !== 0 && currentSeconds !== 30){
      return;
    }
    
    // Check if current time matches any reminder time
    if(reminders.times.includes(currentTime)){
      // Prevent duplicate notifications in the same minute
      const lastNotifKey = 'loop.last_notification';
      const lastNotif = localStorage.getItem(lastNotifKey);
      
      if(lastNotif === currentTime){
        return;  // Already sent notification this minute
      }
      
      localStorage.setItem(lastNotifKey, currentTime);
      sendNotification();
    }
  }

  // Initialize reminders
  function init(){
    // Check every 30 seconds for reminders
    setInterval(checkReminders, 30000);
    
    // Also check immediately on load (in case we're within the minute)
    setTimeout(checkReminders, 1000);
  }

  // Expose API for UI
  window.Reminders = {
    load: loadReminders,
    save: saveReminders,
    requestPermission: requestPermission,
    sendTest: sendNotification,
    init: init
  };

  // Auto-init when DOM is ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }

})();

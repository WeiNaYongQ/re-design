/* ═══════════ js/pwa.js — service worker registration + install button ═══════════ */

(function(){
  /* register the service worker (needs http/https, not file://) */
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  /* custom install button */
  const btn = document.getElementById('installBtn');
  if(!btn) return;
  let promptEvt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    promptEvt = e;
    btn.hidden = false;
  });

  btn.addEventListener('click', async () => {
    if(!promptEvt) return;
    promptEvt.prompt();
    await promptEvt.userChoice;
    promptEvt = null;
    btn.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    btn.hidden = true;
    if(typeof chime === 'function') chime();
  });
})();
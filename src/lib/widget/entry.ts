import './Widget.svelte';

// Auto-bootstrap if the user uses the Wombat div snippet
const target = document.getElementById('wombat_thread');
if (target) {
  const widget = document.createElement('wombat-widget');

  // dataset.appid  ← "data-appid"
  // dataset.appId  ← "data-app-id"   (farklı!)
  // Snippet'te "data-appid" kullanıldığından aşağıdaki isimleri kullan:
  widget.setAttribute('host',      target.dataset.host      || '');
  widget.setAttribute('appid',     target.dataset.appid     || '');
  widget.setAttribute('pageid',    target.dataset.pageid    || '');
  widget.setAttribute('pagetitle', target.dataset.pagetitle || '');
  widget.setAttribute('pageurl',   target.dataset.pageurl   || '');
  target.replaceWith(widget);
}

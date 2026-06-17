import './Widget.svelte';

// Auto-bootstrap if the user uses the Wombat div snippet
const target = document.getElementById('wombat_thread');
if (target) {
  const widget = document.createElement('wombat-widget');
  widget.setAttribute('host', target.dataset.host || '');
  widget.setAttribute('appid', target.dataset.appId || '');
  widget.setAttribute('pageid', target.dataset.pageId || '');
  widget.setAttribute('pagetitle', target.dataset.pageTitle || '');
  widget.setAttribute('pageurl', target.dataset.pageUrl || '');
  target.replaceWith(widget);
}

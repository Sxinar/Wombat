import './Widget.svelte';

// Auto-bootstrap if the user uses the Wombat div snippet
const target = document.getElementById('wombat_thread');
if (target) {
  const d = target.dataset;

  // Her iki format desteklenir:
  //   data-appid   → dataset.appid
  //   data-app-id  → dataset.appId  (admin panel bu formatı üretir)
  const appid     = d.appid     || d.appId     || '';
  const pageid    = d.pageid    || d.pageId    || '';
  const pagetitle = d.pagetitle || d.pageTitle || '';
  const pageurl   = d.pageurl   || d.pageUrl   || '';
  const host      = d.host      || '';

  const widget = document.createElement('wombat-widget');
  widget.setAttribute('host',      host);
  widget.setAttribute('appid',     appid);
  widget.setAttribute('pageid',    pageid);
  widget.setAttribute('pagetitle', pagetitle);
  widget.setAttribute('pageurl',   pageurl);
  target.replaceWith(widget);
}

/* Adesh apps — shared update + new-app notifier.
 *
 * Drop into any app with:
 *   <script>window.__APP__={id:'<app-id>',version:'<x.y.z>'}</script>
 *   <script defer src="https://adesh2151.github.io/updates.js"></script>
 *
 * It reads the central registry (apps.json, same origin as every app page),
 * and shows a small dismissible banner when:
 *   1. a newer version of THIS app exists (APK link on Android, reload on PWA)
 *   2. another app in the suite is worth trying (cross-promo, newest first)
 *
 * Needs internet only for the check; the host app keeps working offline.
 * Fails silently on any error. No dependencies.
 */
(function () {
  var CFG = window.__APP__ || {}
  if (!CFG.id) return
  var REGISTRY = 'https://adesh2151.github.io/apps.json'

  function cmp(a, b) {
    a = String(a || '0').split('.').map(Number)
    b = String(b || '0').split('.').map(Number)
    for (var i = 0; i < 3; i++) {
      var x = a[i] || 0, y = b[i] || 0
      if (x > y) return 1
      if (x < y) return -1
    }
    return 0
  }
  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
  }
  function lget(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
  function lset(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }

  function injectStyle() {
    if (document.getElementById('amu-style')) return
    var s = document.createElement('style')
    s.id = 'amu-style'
    s.textContent =
      '.amu{position:fixed;left:0;right:0;bottom:0;z-index:99999;display:flex;flex-direction:column;gap:8px;padding:10px;pointer-events:none}' +
      '.amu-card{pointer-events:auto;max-width:460px;margin:0 auto;width:calc(100% - 20px);background:#15202b;color:#fff;border-radius:12px;padding:11px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 28px #0006;font-family:system-ui,-apple-system,"Noto Sans",sans-serif;font-size:14px;line-height:1.3}' +
      '.amu-card b{font-weight:700}' +
      '.amu-btn{margin-left:auto;background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:8px 13px;font-weight:700;text-decoration:none;font-size:13px;white-space:nowrap;cursor:pointer}' +
      '.amu-x{background:transparent;border:none;color:#9fb0c0;font-size:20px;line-height:1;padding:0 2px;cursor:pointer}'
    document.head.appendChild(s)
  }
  function root() {
    var c = document.getElementById('amu-root')
    if (c) return c
    c = document.createElement('div')
    c.id = 'amu-root'
    c.className = 'amu'
    document.body.appendChild(c)
    return c
  }
  function card(html) {
    injectStyle()
    var d = document.createElement('div')
    d.className = 'amu-card'
    d.innerHTML = html
    root().appendChild(d)
    return d
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }

  function run(data) {
    var apps = (data && data.apps) || []
    var me = apps.filter(function (a) { return a.id === CFG.id })[0]

    // 1) update available for this app
    if (me && cmp(me.version, CFG.version) > 0) {
      var native = isNative() && me.apk
      var btn = native
        ? '<a class="amu-btn" href="' + esc(me.apk) + '">Update</a>'
        : '<button class="amu-btn" id="amu-upd">Update</button>'
      var c = card('<span>⬆️ <b>' + esc(me.name) + '</b> — new version available</span>' + btn + '<button class="amu-x">×</button>')
      c.querySelector('.amu-x').onclick = function () { c.remove() }
      var u = c.querySelector('#amu-upd')
      if (u) u.onclick = function () {
        try {
          if (navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then(function (rs) {
              rs.forEach(function (r) { r.update() })
            })
          }
        } catch (e) {}
        location.reload()
      }
    }

    // 2) new-app cross-promo (another app, newest first, not dismissed)
    var others = apps
      .filter(function (a) { return a.id !== CFG.id && a.url && a.promote !== false })
      .sort(function (a, b) { return String(b.added || '').localeCompare(String(a.added || '')) })
    var pick = others.filter(function (a) { return lget('amu_seen_' + a.id) !== '1' })[0]
    if (pick) {
      var c2 = card('<span>' + (pick.emoji || '✨') + ' Try my new app: <b>' + esc(pick.name) + '</b></span><a class="amu-btn" href="' + esc(pick.url) + '" target="_blank" rel="noreferrer">Open</a><button class="amu-x">×</button>')
      var close = function () { lset('amu_seen_' + pick.id, '1'); c2.remove() }
      c2.querySelector('.amu-x').onclick = close
      c2.querySelector('.amu-btn').addEventListener('click', close)
    }
  }

  fetch(REGISTRY, { cache: 'no-cache' })
    .then(function (r) { return r.json() })
    .then(run)
    .catch(function () {})
})()

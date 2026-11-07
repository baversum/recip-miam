
/*
 * Recip Miam - recipe export tool.
 *
 * Client-side tool for the "Téléchargements / Downloads" page: lets visitors
 * select recipes with checkboxes (plus select all / deselect all) and
 * download them as a ZIP archive containing either:
 *   - Markdown: the recipe source file (fetched from this repository)
 *   - HTML: a standalone, self-contained page per recipe
 *
 * No external library: the ZIP archive is written by hand in the browser
 * (stored entries + CRC32). The recipe list is read from the site
 * navigation at runtime, so new recipes are picked up automatically.
 */
(function () {
  'use strict';

  var RAW_BASE = 'https://raw.githubusercontent.com/baversum/recip-miam/main/docs/recettes/';
  var SITE_NAME = 'Recip Miam';
  var NL = String.fromCharCode(10);

  var container = document.getElementById('recipe-export');
  if (!container) return;

  var lang = window.location.pathname.indexOf('/en/') === 0 ? 'en' : 'fr';

  var STR = {
    fr: {
      selectAll: 'Tout sélectionner',
      deselectAll: 'Tout désélectionner',
      selection: function (n) {
        return n + ' recette' + (n > 1 ? 's' : '') + ' sélectionnée' + (n > 1 ? 's' : '');
      },
      fetching: function (i, n, t) {
        return 'Récupération ' + i + '/' + n + ' : ' + t + '...';
      },
      zipping: 'Création de l’archive...',
      done: function (n) {
        return 'Archive prête (' + n + ' fichier' + (n > 1 ? 's' : '') + ').';
      },
      failed: ' Recettes en échec : ',
      emptySelection: 'Sélectionne au moins une recette.',
      noneFound: 'Impossible de lire la liste des recettes depuis la navigation du site.',
      error: 'Erreur : '
    },
    en: {
      selectAll: 'Select all',
      deselectAll: 'Deselect all',
      selection: function (n) {
        return n + ' recipe' + (n > 1 ? 's' : '') + ' selected';
      },
      fetching: function (i, n, t) {
        return 'Fetching ' + i + '/' + n + ': ' + t + '...';
      },
      zipping: 'Building the archive...',
      done: function (n) {
        return 'Archive ready (' + n + ' file' + (n > 1 ? 's' : '') + ').';
      },
      failed: ' Failed recipes: ',
      emptySelection: 'Select at least one recipe.',
      noneFound: 'Could not read the recipe list from the site navigation.',
      error: 'Error: '
    }
  };
  var T = STR[lang];

  var listEl = container.querySelector('#rex-list');
  var toggleBtn = container.querySelector('#rex-toggle-all');
  var statusEl = container.querySelector('#rex-status');
  var countEl = container.querySelector('#rex-count');
  var mdBtn = container.querySelector('#rex-download-md');
  var htmlBtn = container.querySelector('#rex-download-html');
  if (!listEl || !toggleBtn) return;
  if (!statusEl) {
    statusEl = document.createElement('p');
    statusEl.id = 'rex-status';
    container.appendChild(statusEl);
  }

  var recipes = [];
  var busy = false;

  /* ---------- recipe discovery ---------- */

  function findRecipes() {
    var found = [];
    var seen = {};
    var anchors = document.querySelectorAll('nav a[href*="recettes/"]');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var url;
      try {
        url = new URL(a.getAttribute('href'), document.baseURI);
      } catch (e) {
        continue;
      }
      var m = url.pathname.match(/\/recettes\/([^/]+)\/?$/);
      if (!m) continue;
      var slug = m[1];
      if (seen[slug]) continue;
      seen[slug] = true;
      var category = '';
      if (a.closest) {
        var li = a.closest('li');
        var nav = li ? li.closest('nav') : null;
        var prev = nav ? nav.previousElementSibling : null;
        if (prev) category = (prev.textContent || '').trim();
      }
      found.push({
        slug: slug,
        title: (a.textContent || '').trim() || slug,
        category: category,
        pageUrl: url.href
      });
    }
    return found;
  }

  function findRecipesFromSitemap(xml) {
    var doc = new DOMParser().parseFromString(xml, 'application/xml');
    var locs = doc.querySelectorAll('loc');
    var found = [];
    var seen = {};
    for (var i = 0; i < locs.length; i++) {
      var href = (locs[i].textContent || '').trim();
      if (href.indexOf('/en/') !== -1) continue;
      var m = href.match(/\/recettes\/([^/]+)\/?$/);
      if (!m || seen[m[1]]) continue;
      seen[m[1]] = true;
      found.push({
        slug: m[1],
        title: m[1],
        category: '',
        pageUrl: new URL('../recettes/' + m[1] + '/', document.baseURI).href
      });
    }
    return found;
  }

  /* ---------- ZIP writer (stored entries, no compression) ---------- */

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeZip(files) {
    var now = new Date();
    var dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    var dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    var parts = [];
    var central = [];
    var offset = 0;

    files.forEach(function (f) {
      var name = new TextEncoder().encode(f.name);
      var crc = crc32(f.data);
      var len = f.data.length;

      var lh = new Uint8Array(30 + name.length);
      var v = new DataView(lh.buffer);
      v.setUint32(0, 0x04034b50, true);
      v.setUint16(4, 20, true);
      v.setUint16(6, 0x0800, true);
      v.setUint16(8, 0, true);
      v.setUint16(10, dosTime, true);
      v.setUint16(12, dosDate, true);
      v.setUint32(14, crc, true);
      v.setUint32(18, len, true);
      v.setUint32(22, len, true);
      v.setUint16(26, name.length, true);
      v.setUint16(28, 0, true);
      lh.set(name, 30);
      parts.push(lh);
      parts.push(f.data);

      var ch = new Uint8Array(46 + name.length);
      var w = new DataView(ch.buffer);
      w.setUint32(0, 0x02014b50, true);
      w.setUint16(4, 20, true);
      w.setUint16(6, 20, true);
      w.setUint16(8, 0x0800, true);
      w.setUint16(10, 0, true);
      w.setUint16(12, dosTime, true);
      w.setUint16(14, dosDate, true);
      w.setUint32(16, crc, true);
      w.setUint32(20, len, true);
      w.setUint32(24, len, true);
      w.setUint16(28, name.length, true);
      w.setUint16(30, 0, true);
      w.setUint16(32, 0, true);
      w.setUint16(34, 0, true);
      w.setUint16(36, 0, true);
      w.setUint32(38, 0, true);
      w.setUint32(42, offset, true);
      ch.set(name, 46);
      central.push(ch);

      offset += lh.length + len;
    });

    var cdSize = 0;
    central.forEach(function (c) { cdSize += c.length; });

    var end = new Uint8Array(22);
    var e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true);
    e.setUint16(8, files.length, true);
    e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true);
    e.setUint32(16, offset, true);

    var chunks = parts.concat(central, [end]);
    var total = 0;
    chunks.forEach(function (c) { total += c.length; });
    var out = new Uint8Array(total);
    var pos = 0;
    chunks.forEach(function (c) {
      out.set(c, pos);
      pos += c.length;
    });
    return new Blob([out], { type: 'application/zip' });
  }

  /* ---------- fetch + formats ---------- */

  function fetchText(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  var PAGE_CSS = [
    ':root { color-scheme: light dark; }',
    'body { margin: 0; padding: 1.5rem 1rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #242424; background: #fff; }',
    'main { max-width: 42rem; margin: 0 auto; }',
    'h1 { border-bottom: 1px solid #ddd; padding-bottom: 0.3em; }',
    'h2 { margin-top: 2em; }',
    'table { border-collapse: collapse; width: 100%; margin: 1em 0; }',
    'th, td { border: 1px solid #ccc; padding: 0.4em 0.6em; text-align: left; vertical-align: top; }',
    'th { background: #f2f2f2; }',
    'img { max-width: 100%; }',
    'code { background: #f0f0f0; padding: 0.1em 0.3em; border-radius: 3px; }',
    'blockquote { border-left: 4px solid #ff7043; padding-left: 1em; margin-left: 0; color: #555; }',
    '.page-footer { max-width: 42rem; margin: 2.5rem auto 0; font-size: 0.8em; color: #999; border-top: 1px solid #eee; padding-top: 0.6em; }',
    '@media (prefers-color-scheme: dark) { body { background: #1e1e1e; color: #e0e0e0; } h1 { border-color: #444; } th { background: #2a2a2a; } th, td { border-color: #555; } code { background: #333; } .page-footer { border-color: #333; } }'
  ].join(NL);

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function buildStandaloneHtml(recipe, html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var article = doc.querySelector('article') || doc.querySelector('.md-content') || doc.body;
    var junk = article.querySelectorAll('script, style, noscript, .md-clipboard, form');
    for (var i = junk.length - 1; i >= 0; i--) {
      if (junk[i].parentNode) junk[i].parentNode.removeChild(junk[i]);
    }
    var body = article.innerHTML;
    if (!article.querySelector('h1')) {
      body = '<h1>' + esc(recipe.title) + '</h1>' + NL + body;
    }
    return '<!DOCTYPE html>' + NL +
      '<html lang="' + lang + '">' + NL +
      '<head>' + NL +
      '<meta charset="utf-8">' + NL +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' + NL +
      '<title>' + esc(recipe.title) + ' - ' + SITE_NAME + '</title>' + NL +
      '<style>' + NL + PAGE_CSS + NL + '</style>' + NL +
      '</head>' + NL +
      '<body>' + NL +
      '<main>' + NL + body + NL + '</main>' + NL +
      '<footer class="page-footer">' + esc(SITE_NAME) + ' · <a href="' + esc(recipe.pageUrl) + '">' + esc(recipe.title) + '</a> · ' + new Date().toISOString().slice(0, 10) + '</footer>' + NL +
      '</body>' + NL +
      '</html>' + NL;
  }

  /* ---------- UI ---------- */

  function buildUi() {
    var byCat = {};
    var order = [];
    recipes.forEach(function (r) {
      var c = r.category || (lang === 'fr' ? 'Recettes' : 'Recipes');
      if (!byCat[c]) {
        byCat[c] = [];
        order.push(c);
      }
      byCat[c].push(r);
    });
    order.forEach(function (cat) {
      var fs = document.createElement('fieldset');
      fs.className = 'rex-group';
      var legend = document.createElement('legend');
      var catLabel = document.createElement('label');
      catLabel.className = 'rex-cat-all';
      var catCb = document.createElement('input');
      catCb.type = 'checkbox';
      catLabel.appendChild(catCb);
      catLabel.appendChild(document.createTextNode(cat));
      legend.appendChild(catLabel);
      fs.appendChild(legend);
      byCat[cat].forEach(function (r) {
        var item = document.createElement('label');
        item.className = 'rex-item';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        item.appendChild(cb);
        item.appendChild(document.createTextNode(' ' + r.title));
        fs.appendChild(item);
        r.checkbox = cb;
        cb.addEventListener('change', updateUi);
      });
      catCb.addEventListener('change', function () {
        byCat[cat].forEach(function (r) { r.checkbox.checked = catCb.checked; });
        updateUi();
      });
      fs._recipes = byCat[cat];
      fs._catCheckbox = catCb;
      listEl.appendChild(fs);
    });
  }

  function updateUi() {
    var n = 0;
    recipes.forEach(function (r) {
      if (r.checkbox.checked) n++;
    });
    var allChecked = recipes.length > 0 && n === recipes.length;
    toggleBtn.textContent = allChecked ? T.deselectAll : T.selectAll;
    if (mdBtn) mdBtn.disabled = busy || n === 0;
    if (htmlBtn) htmlBtn.disabled = busy || n === 0;
    if (countEl) countEl.textContent = n ? T.selection(n) : '';
    var groups = listEl.querySelectorAll('fieldset');
    for (var i = 0; i < groups.length; i++) {
      var fs = groups[i];
      var rs = fs._recipes || [];
      var k = 0;
      rs.forEach(function (r) {
        if (r.checkbox.checked) k++;
      });
      fs._catCheckbox.checked = k > 0 && k === rs.length;
      fs._catCheckbox.indeterminate = k > 0 && k < rs.length;
    }
  }

  /* ---------- download ---------- */

  function download(format) {
    if (busy) return;
    var sel = [];
    recipes.forEach(function (r) {
      if (r.checkbox.checked) sel.push(r);
    });
    if (!sel.length) {
      statusEl.textContent = T.emptySelection;
      return;
    }
    busy = true;
    updateUi();
    var files = [];
    var failures = [];
    var i = 0;

    function step() {
      if (i >= sel.length) {
        finish();
        return;
      }
      var r = sel[i];
      i += 1;
      statusEl.textContent = T.fetching(i, sel.length, r.title);
      var p = format === 'md'
        ? fetchText(RAW_BASE + r.slug + '.' + lang + '.md')
        : fetchText(r.pageUrl).then(function (html) {
            return buildStandaloneHtml(r, html);
          });
      p.then(function (content) {
        files.push({
          name: r.slug + (format === 'md' ? '.md' : '.html'),
          data: new TextEncoder().encode(content)
        });
      }).catch(function () {
        failures.push(r.title);
      }).then(step);
    }

    function finish() {
      if (!files.length) {
        statusEl.textContent = T.error + (failures.join(', ') || '?');
        busy = false;
        updateUi();
        return;
      }
      statusEl.textContent = T.zipping;
      var stamp = new Date().toISOString().slice(0, 10);
      var blob = makeZip(files);
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'recip-miam-' + (format === 'md' ? 'markdown' : 'html') + '-' + stamp + '.zip';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 5000);
      statusEl.textContent = T.done(files.length) + (failures.length ? T.failed + failures.join(', ') : '');
      busy = false;
      updateUi();
    }

    step();
  }

  /* ---------- init ---------- */

  toggleBtn.addEventListener('click', function () {
    var allChecked = recipes.length > 0 && recipes.every(function (r) { return r.checkbox.checked; });
    recipes.forEach(function (r) { r.checkbox.checked = !allChecked; });
    updateUi();
  });
  if (mdBtn) mdBtn.addEventListener('click', function () { download('md'); });
  if (htmlBtn) htmlBtn.addEventListener('click', function () { download('html'); });

  function init(rs) {
    recipes = rs;
    if (!recipes.length) {
      statusEl.textContent = T.noneFound;
      toggleBtn.disabled = true;
      if (mdBtn) mdBtn.disabled = true;
      if (htmlBtn) htmlBtn.disabled = true;
      return;
    }
    buildUi();
    updateUi();
  }

  var discovered = findRecipes();
  if (discovered.length) {
    init(discovered);
  } else {
    fetchText(new URL(lang === 'en' ? '../../sitemap.xml' : '../sitemap.xml', document.baseURI).href)
      .then(function (xml) { init(findRecipesFromSitemap(xml)); })
      .catch(function () { init([]); });
  }
})();

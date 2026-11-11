/* Inglizcha Qadam — asosiy kod */
(function () {
  "use strict";
  var ADMIN_PIN = "2302";          // admin panel PIN kodi (xohlasangiz o'zgartiring)
  var PASS = 80;                   // keyingi betga o'tish uchun foiz
  var LS_PROG = "iq_progress", LS_DRAFT = "iq_draft", LS_ADMIN = "iq_admin";

  var view = document.getElementById("view");
  var titleEl = document.getElementById("title");
  var backBtn = document.getElementById("back");
  var CONTENT = { videos: [], pages: { B1: [], B2: [], C1: [] } };

  /* ---------- yordamchilar ---------- */
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function toast(t) { var x = document.getElementById("toast"); x.textContent = t; x.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { x.hidden = true; }, 2200); }
  function norm(s) {
    return String(s || "").toLowerCase().replace(/[‘’ʼ`´]/g, "'").replace(/[“”]/g, '"')
      .replace(/\s+/g, " ").replace(/^[\s.,!?;:]+|[\s.,!?;:]+$/g, "").trim();
  }
  function shuffle(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); for (var j = n - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)); var t = a[j]; a[j] = a[r]; a[r] = t; } return a; }
  function setHeader(t, back) { titleEl.textContent = t; backBtn.hidden = !back; backBtn.onclick = function () { location.hash = back || "#/"; }; window.scrollTo(0, 0); }

  function prog() { return load(LS_PROG, { levels: {}, watched: {} }); }
  function setScore(L, i, pct) { var p = prog(); p.levels[L] = p.levels[L] || {}; var old = p.levels[L][i] || 0; if (pct > old) p.levels[L][i] = pct; save(LS_PROG, p); }
  function score(L, i) { var p = prog(); return (p.levels[L] && p.levels[L][i]) || 0; }
  function unlocked(L, i) { return i === 0 || score(L, i - 1) >= PASS; }

  function content() { return load(LS_DRAFT, null) || CONTENT; }
  function pagesOf(L) { var base = (window.LEVELS[L] && window.LEVELS[L].pages) || []; var extra = (content().pages && content().pages[L]) || []; return base.concat(extra.map(function (p) { p._custom = true; return p; })); }

  /* ---------- bosh sahifa ---------- */
  function home() {
    setHeader("Inglizcha Qadam", null);
    var p = prog(), vids = content().videos || [];
    var watched = Object.keys(p.watched || {}).length;
    var h = '<div class="hero"><h2>Ingliz tilini noldan o\'rganamiz! 🚀</h2><p>Avval videodarslar, so\'ng B1 → B2 → C1 mashqlari. Har betdan ' + PASS + '% to\'g\'ri javob bilan keyingisi ochiladi.</p></div><div class="grid">';
    h += '<button class="tile" data-go="#/videos"><span class="badge" style="background:linear-gradient(135deg,#f97316,#ec4899)">▶</span><span><b>Videodarslar</b><small>Noldan boshlovchilar uchun · ' + vids.length + ' ta dars</small><div class="bar-p"><i style="width:' + (vids.length ? Math.round(100 * Math.min(watched, vids.length) / vids.length) : 0) + '%"></i></div></span></button>';
    ["B1", "B2", "C1"].forEach(function (L) {
      var lv = window.LEVELS[L], pages = pagesOf(L), done = 0;
      pages.forEach(function (_, i) { if (score(L, i) >= PASS) done++; });
      h += '<button class="tile" data-go="#/level/' + L + '"><span class="badge" style="background:' + lv.color + '">' + L + '</span><span><b>' + L + ' mashqlari</b><small>' + lv.sub + ' · ' + pages.length + ' bet</small><div class="bar-p"><i style="width:' + Math.round(100 * done / Math.max(1, pages.length)) + '%"></i></div></span><span class="right">' + done + '/' + pages.length + '</span></button>';
    });
    h += '</div><p class="muted" style="text-align:center;margin-top:18px" id="adm">© Raufov H.R.</p>';
    view.innerHTML = h;
    bindGo();
    // admin panelga kirish: muallif yozuviga 5 marta bosish
    var n = 0, a = document.getElementById("adm");
    a.onclick = function () { if (++n >= 5) location.hash = "#/admin"; };
  }
  function bindGo() { view.querySelectorAll("[data-go]").forEach(function (b) { b.onclick = function () { location.hash = b.getAttribute("data-go"); }; }); }

  /* ---------- videodarslar ---------- */
  function parseLink(link) {
    link = String(link || "").trim();
    var m;
    if ((m = link.match(/t\.me\/c\/(\d+)\/(\d+)/))) return { kind: "tgprivate", url: link };
    if ((m = link.match(/t\.me\/(?:s\/)?([A-Za-z0-9_]{4,})\/(\d+)/))) return { kind: "tg", post: m[1] + "/" + m[2], url: "https://t.me/" + m[1] + "/" + m[2] };
    if ((m = link.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/))) return { kind: "yt", id: m[1], url: link };
    if (/\.(mp4|webm|m3u8)(\?|$)/i.test(link)) return { kind: "file", url: link };
    return { kind: "link", url: link };
  }
  function videos() {
    setHeader("Videodarslar", "#/");
    var vids = content().videos || [], p = prog();
    if (!vids.length) { view.innerHTML = '<div class="card">Videodarslar hali qo\'shilmagan. Tez orada shu yerda paydo bo\'ladi!</div>'; return; }
    var h = '<div class="grid">';
    vids.forEach(function (v, i) {
      var w = p.watched && p.watched[i];
      h += '<button class="tile" data-go="#/video/' + i + '"><span class="badge" style="background:' + (w ? "#16a34a" : "linear-gradient(135deg,#f97316,#ec4899)") + '">' + (w ? "✓" : (i + 1)) + '</span><span><b>' + esc(v.title) + '</b><small>' + esc(v.desc || "") + '</small></span></button>';
    });
    view.innerHTML = h + '</div>';
    bindGo();
  }
  function video(i) {
    var vids = content().videos || [], v = vids[i];
    if (!v) return videos();
    setHeader((i + 1) + "-dars", "#/videos");
    var L = parseLink(v.link), h = '<div class="card"><h3>' + esc(v.title) + '</h3>' + (v.desc ? '<p class="muted">' + esc(v.desc) + '</p>' : '');
    if (L.kind === "tg") h += '<div class="tgpost" id="tgpost"></div><button class="btn tg" id="open">Telegramda ochish</button>';
    else if (L.kind === "yt") h += '<div class="video-wrap"><iframe style="width:100%;aspect-ratio:16/9;border:0" src="https://www.youtube.com/embed/' + L.id + '?rel=0" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe></div>';
    else if (L.kind === "file") h += '<div class="video-wrap"><video controls playsinline src="' + esc(L.url) + '"></video></div>';
    else h += '<p style="margin:10px 0">Bu dars Telegram kanalda joylashgan. Ko\'rish uchun tugmani bosing.</p><button class="btn tg" id="open">▶ Darsni Telegramda ko\'rish</button>' + (L.kind === "tgprivate" ? '<p class="muted" style="margin-top:6px">Yopiq kanal: video ochilishi uchun kanalga a\'zo bo\'lishingiz kerak.</p>' : '');
    h += '</div><button class="btn green" id="done">✓ Darsni ko\'rdim</button>';
    if (i + 1 < vids.length) h += '<button class="btn alt" data-go="#/video/' + (i + 1) + '">Keyingi dars ›</button>';
    view.innerHTML = h;
    bindGo();
    var o = document.getElementById("open"); if (o) o.onclick = function () { window.open(L.url, "_blank"); };
    if (L.kind === "tg") {
      var s = document.createElement("script"); s.async = true; s.src = "https://telegram.org/js/telegram-widget.js?22";
      s.setAttribute("data-telegram-post", L.post); s.setAttribute("data-width", "100%");
      document.getElementById("tgpost").appendChild(s);
    }
    document.getElementById("done").onclick = function () {
      var p = prog(); p.watched = p.watched || {}; p.watched[i] = 1; save(LS_PROG, p); toast("Barakalla! 👏");
      if (i + 1 < vids.length) location.hash = "#/video/" + (i + 1); else location.hash = "#/videos";
    };
  }

  /* ---------- daraja ---------- */
  function level(L) {
    var lv = window.LEVELS[L]; if (!lv) return home();
    setHeader(L + " · " + lv.sub, "#/");
    var pages = pagesOf(L), h = '<div class="grid">';
    pages.forEach(function (pg, i) {
      var ok = unlocked(L, i), sc = score(L, i);
      h += '<button class="tile ' + (ok ? "" : "locked") + '" ' + (ok ? 'data-go="#/page/' + L + '/' + i + '"' : 'data-lock="1"') + '><span class="badge" style="background:' + (sc >= PASS ? "#16a34a" : lv.color) + '">' + (ok ? (sc >= PASS ? "✓" : (i + 1)) : "🔒") + '</span><span><b>' + (i + 1) + '-bet' + (pg._custom ? '<span class="pill">Kitob</span>' : '') + '</b><small>' + esc(pg.title) + '</small></span><span class="right">' + (sc ? sc + "%" : "") + '</span></button>';
    });
    view.innerHTML = h + '</div>';
    bindGo();
    view.querySelectorAll("[data-lock]").forEach(function (b) { b.onclick = function () { toast("Avval oldingi betdan " + PASS + "% to'plang 🔒"); }; });
  }

  /* ---------- bet (mashqlar) ---------- */
  var TYPE = { mc: "To'g'ri variantni tanlang", gap: "Bo'sh joyni to'ldiring", wf: "So'z yasash: katta harfli so'zdan foydalaning", kw: "Kalit so'z bilan qayta yozing (2–5 so'z)" };
  function page(L, i) {
    var pages = pagesOf(L), pg = pages[i];
    if (!pg) return level(L);
    if (!unlocked(L, i)) { toast("Bu bet hali yopiq 🔒"); location.hash = "#/level/" + L; return; }
    setHeader(L + " · " + (i + 1) + "-bet", "#/level/" + L);
    var h = '<div class="card theory"><h3>' + esc(pg.title) + '</h3>' + esc(pg.theory || "") + '</div><div id="qs">';
    var orders = [];
    (pg.qs || []).forEach(function (q, k) {
      h += '<div class="card q" data-k="' + k + '"><span class="num">' + (k + 1) + '</span><span class="type">' + TYPE[q.t] + '</span>';
      if (q.t === "kw") h += '<p class="orig">' + esc(q.s) + '</p><p><span class="key">' + esc(q.k) + '</span></p>';
      h += '<p>' + esc(q.q).replace(/_{3,}/g, "<b>______</b>") + (q.t === "wf" ? ' <span class="key">' + esc(q.w) + '</span>' : '') + '</p>';
      if (q.t === "mc") {
        var ord = shuffle(q.o.length); orders[k] = ord;
        h += '<div class="opts">' + ord.map(function (oi) { return '<button class="opt" data-o="' + oi + '">' + esc(q.o[oi]) + '</button>'; }).join("") + '</div>';
      } else h += '<input class="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Javobingiz...">';
      h += '<div class="fix" hidden></div></div>';
    });
    h += '</div><div id="res"></div><button class="btn" id="check">Tekshirish</button>';
    view.innerHTML = h;
    view.querySelectorAll(".opts").forEach(function (box) {
      box.querySelectorAll(".opt").forEach(function (b) { b.onclick = function () { if (box.dataset.locked) return; box.querySelectorAll(".opt").forEach(function (x) { x.classList.remove("sel"); }); b.classList.add("sel"); }; });
    });
    document.getElementById("check").onclick = function () { check(L, i, pg, pages.length); };
  }
  function check(L, i, pg, total) {
    var qs = pg.qs || [], right = 0, empty = 0;
    view.querySelectorAll(".q").forEach(function (box) {
      var q = qs[+box.dataset.k], ok = false, fix = box.querySelector(".fix");
      if (q.t === "mc") {
        var sel = box.querySelector(".opt.sel");
        if (!sel) empty++;
        ok = sel && +sel.dataset.o === q.a;
        box.querySelector(".opts").dataset.locked = 1;
        box.querySelectorAll(".opt").forEach(function (b) { if (+b.dataset.o === q.a) b.classList.add("right"); else if (b === sel) b.classList.add("wrong"); });
        if (!ok) { fix.hidden = false; fix.textContent = "To'g'ri javob: " + q.o[q.a]; }
      } else {
        var inp = box.querySelector(".ans"), v = norm(inp.value);
        if (!v) empty++;
        ok = (q.a || []).some(function (a) { return norm(a) === v; });
        inp.classList.add(ok ? "right" : "wrong"); inp.readOnly = true;
        if (!ok) { fix.hidden = false; fix.textContent = "To'g'ri javob: " + q.a[0]; }
      }
      if (ok) right++;
    });
    var pct = Math.round(100 * right / Math.max(1, qs.length));
    setScore(L, i, pct);
    var pass = pct >= PASS, res = document.getElementById("res"), last = i + 1 >= total;
    res.innerHTML = '<div class="result ' + (pass ? "pass" : "fail") + '">' + right + ' / ' + qs.length + ' to\'g\'ri — ' + pct + '%<br><span style="font-size:15px;font-weight:600">' +
      (pass ? (last ? "Ajoyib! Bu darajani tugatdingiz 🎉" : "Barakalla! Keyingi bet ochildi 🎉") : "Keyingi betga o'tish uchun kamida " + PASS + "% kerak. Xatolarni ko'rib chiqing va qayta urinib ko'ring.") + '</span></div>';
    var btn = document.getElementById("check");
    if (pass) {
      confetti();
      if (!last) {
        btn.textContent = "Keyingi bet ›"; btn.className = "btn green";
        btn.onclick = function () { clearTimeout(check._t); location.hash = "#/page/" + L + "/" + (i + 1); };
        check._t = setTimeout(function () { if (location.hash === "#/page/" + L + "/" + i) location.hash = "#/page/" + L + "/" + (i + 1); }, 4000);
      } else { btn.textContent = "Darajalarga qaytish"; btn.onclick = function () { location.hash = "#/"; }; }
    } else {
      btn.textContent = "Qayta urinish ↻"; btn.className = "btn alt";
      btn.onclick = function () { page(L, i); };
    }
    res.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ---------- konfetti ---------- */
  function confetti() {
    var c = document.getElementById("confetti"), x = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
    var cols = ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"], ps = [];
    for (var i = 0; i < 140; i++) ps.push({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5, r: 4 + Math.random() * 6, vy: 2 + Math.random() * 4, vx: -2 + Math.random() * 4, c: cols[i % 6], a: Math.random() * 6 });
    var t = 0;
    (function f() { x.clearRect(0, 0, c.width, c.height); ps.forEach(function (p) { p.y += p.vy; p.x += p.vx; p.a += .1; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6); x.restore(); }); if (++t < 150) requestAnimationFrame(f); else x.clearRect(0, 0, c.width, c.height); })();
  }

  /* ---------- admin panel ---------- */
  function draft() { var d = load(LS_DRAFT, null); if (!d) { d = JSON.parse(JSON.stringify(CONTENT)); } d.videos = d.videos || []; d.pages = d.pages || {}; ["B1", "B2", "C1"].forEach(function (L) { d.pages[L] = d.pages[L] || []; }); return d; }
  function saveDraft(d) { save(LS_DRAFT, d); }
  function admin(tab) {
    setHeader("Admin panel", "#/");
    if (!load(LS_ADMIN, false)) {
      view.innerHTML = '<div class="card"><label>PIN kod</label><input class="f" id="pin" type="password" inputmode="numeric"><button class="btn" id="go">Kirish</button></div>';
      document.getElementById("go").onclick = function () { if (document.getElementById("pin").value === ADMIN_PIN) { save(LS_ADMIN, true); admin(); } else toast("PIN noto'g'ri"); };
      return;
    }
    tab = tab || "v";
    var h = '<div class="row" style="margin-bottom:12px"><button class="btn ' + (tab === "v" ? "" : "alt") + '" data-go="#/admin/v">Videolar</button><button class="btn ' + (tab === "p" ? "" : "alt") + '" data-go="#/admin/p">Mashqlar</button><button class="btn ' + (tab === "c" ? "" : "alt") + '" data-go="#/admin/c">Saqlash</button></div><div id="adm"></div>';
    view.innerHTML = h; bindGo();
    var box = document.getElementById("adm");
    if (tab === "v") adminVideos(box); else if (tab === "p") adminPages(box); else adminCode(box);
  }
  function adminVideos(box) {
    var d = draft();
    var h = '<div class="card"><h3>Yangi videodars</h3><label>Dars nomi</label><input class="f" id="vt" placeholder="1-dars. Alifbo va tovushlar"><label>Telegram post havolasi</label><input class="f" id="vl" placeholder="https://t.me/kanal_nomi/12"><label>Qisqa izoh (ixtiyoriy)</label><input class="f" id="vd"><button class="btn" id="vadd">+ Qo\'shish</button>' +
      '<p class="muted" style="margin-top:8px">Havolani olish: Telegramda videoni bosib turing → «Havolani nusxalash» (Copy link).</p></div><div class="card"><h3>Darslar (' + d.videos.length + ')</h3>';
    d.videos.forEach(function (v, i) { h += '<div class="row" style="align-items:center;border-top:1px solid var(--line);padding:8px 0"><span style="flex:3"><b>' + (i + 1) + '. ' + esc(v.title) + '</b><br><span class="muted">' + esc(v.link) + '</span></span><span style="flex:none"><button class="del" data-up="' + i + '">↑</button> <button class="del" data-del="' + i + '">✕</button></span></div>'; });
    box.innerHTML = h + '</div>';
    document.getElementById("vadd").onclick = function () {
      var t = document.getElementById("vt").value.trim(), l = document.getElementById("vl").value.trim();
      if (!t || !l) return toast("Nom va havolani kiriting");
      d.videos.push({ title: t, link: l, desc: document.getElementById("vd").value.trim() }); saveDraft(d); toast("Qo'shildi"); adminVideos(box);
    };
    box.querySelectorAll("[data-del]").forEach(function (b) { b.onclick = function () { d.videos.splice(+b.dataset.del, 1); saveDraft(d); adminVideos(box); }; });
    box.querySelectorAll("[data-up]").forEach(function (b) { b.onclick = function () { var i = +b.dataset.up; if (i > 0) { var t = d.videos[i]; d.videos[i] = d.videos[i - 1]; d.videos[i - 1] = t; saveDraft(d); adminVideos(box); } }; });
  }
  var cur = null; // tahrirlanayotgan bet
  function adminPages(box) {
    var d = draft();
    if (!cur) cur = { L: "B1", title: "", theory: "", qs: [] };
    var h = '<div class="card"><h3>Yangi bet (kitob mashqlari)</h3><label>Daraja</label><select id="pl">' + ["B1", "B2", "C1"].map(function (L) { return '<option' + (cur.L === L ? " selected" : "") + '>' + L + '</option>'; }).join("") + '</select>' +
      '<label>Bet nomi</label><input class="f" id="pt" value="' + esc(cur.title) + '" placeholder="Unit 1 — Present time"><label>Qisqa nazariya (ixtiyoriy)</label><textarea id="ph" rows="3">' + esc(cur.theory) + '</textarea></div>' +
      '<div class="card"><h3>Mashq qo\'shish</h3><label>Turi</label><select id="qt"><option value="mc">Test (4 variant)</option><option value="gap">Bo\'sh joyni to\'ldirish</option><option value="wf">So\'z yasash</option><option value="kw">Kalit so\'z bilan qayta yozish</option></select>' +
      '<div id="kwf" hidden><label>Asl gap</label><input class="f" id="qs"><label>Kalit so\'z</label><input class="f" id="qk"></div>' +
      '<label>Savol (bo\'sh joyni ___ bilan belgilang)</label><input class="f" id="qq" placeholder="She ___ to school every day.">' +
      '<div id="wff" hidden><label>Asos so\'z (katta harfda)</label><input class="f" id="qw"></div>' +
      '<div id="mcf"><label>Variantlar</label><input class="f" id="o0" placeholder="A"><input class="f" id="o1" placeholder="B" style="margin-top:6px"><input class="f" id="o2" placeholder="C" style="margin-top:6px"><input class="f" id="o3" placeholder="D" style="margin-top:6px"><label>To\'g\'ri variant</label><select id="oa"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></div>' +
      '<div id="ansf" hidden><label>To\'g\'ri javob(lar) — bir nechta bo\'lsa | bilan ajrating</label><input class="f" id="qa" placeholder="goes | is going"></div>' +
      '<button class="btn" id="qadd">+ Mashqni qo\'shish</button></div>' +
      '<div class="card"><h3>Shu betdagi mashqlar (' + cur.qs.length + ')</h3>' + cur.qs.map(function (q, k) { return '<div class="row" style="align-items:center;border-top:1px solid var(--line);padding:6px 0"><span style="flex:3">' + (k + 1) + '. ' + esc(q.q) + '</span><span style="flex:none"><button class="del" data-dq="' + k + '">✕</button></span></div>'; }).join("") +
      '<button class="btn green" id="psave">Betni saqlash</button></div>';
    h += '<div class="card"><h3>Qo\'shilgan betlar</h3>';
    ["B1", "B2", "C1"].forEach(function (L) { d.pages[L].forEach(function (p, i) { h += '<div class="row" style="align-items:center;border-top:1px solid var(--line);padding:6px 0"><span style="flex:3"><b>' + L + '</b> · ' + esc(p.title) + ' (' + p.qs.length + ' mashq)</span><span style="flex:none"><button class="del" data-dp="' + L + ':' + i + '">✕</button></span></div>'; }); });
    box.innerHTML = h + '</div>';
    var qt = document.getElementById("qt");
    function sync() { var t = qt.value; document.getElementById("mcf").hidden = t !== "mc"; document.getElementById("ansf").hidden = t === "mc"; document.getElementById("wff").hidden = t !== "wf"; document.getElementById("kwf").hidden = t !== "kw"; }
    qt.onchange = sync; sync();
    function keep() { cur.L = document.getElementById("pl").value; cur.title = document.getElementById("pt").value; cur.theory = document.getElementById("ph").value; }
    document.getElementById("qadd").onclick = function () {
      keep();
      var t = qt.value, q = { t: t, q: document.getElementById("qq").value.trim() };
      if (!q.q) return toast("Savolni kiriting");
      if (t === "mc") { q.o = [0, 1, 2, 3].map(function (n) { return document.getElementById("o" + n).value.trim(); }).filter(Boolean); q.a = +document.getElementById("oa").value; if (q.o.length < 2 || q.a >= q.o.length) return toast("Variantlarni to'liq kiriting"); }
      else { q.a = document.getElementById("qa").value.split("|").map(function (s) { return s.trim(); }).filter(Boolean); if (!q.a.length) return toast("To'g'ri javobni kiriting"); }
      if (t === "wf") q.w = document.getElementById("qw").value.trim().toUpperCase();
      if (t === "kw") { q.s = document.getElementById("qs").value.trim(); q.k = document.getElementById("qk").value.trim().toUpperCase(); }
      cur.qs.push(q); toast("Mashq qo'shildi"); adminPages(box);
    };
    box.querySelectorAll("[data-dq]").forEach(function (b) { b.onclick = function () { keep(); cur.qs.splice(+b.dataset.dq, 1); adminPages(box); }; });
    document.getElementById("psave").onclick = function () {
      keep(); if (!cur.title || !cur.qs.length) return toast("Bet nomi va kamida 1 ta mashq kerak");
      d.pages[cur.L].push({ title: cur.title, theory: cur.theory, qs: cur.qs }); saveDraft(d); cur = null; toast("Bet saqlandi"); adminPages(box);
    };
    box.querySelectorAll("[data-dp]").forEach(function (b) { b.onclick = function () { var x = b.dataset.dp.split(":"); d.pages[x[0]].splice(+x[1], 1); saveDraft(d); adminPages(box); }; });
  }
  function adminCode(box) {
    var json = JSON.stringify(draft(), null, 1);
    box.innerHTML = '<div class="card"><h3>Talabalarga chiqarish</h3><p>Qo\'shganlaringiz hozircha faqat shu telefonda ko\'rinadi. Hammaga chiqishi uchun:</p><ol style="margin:8px 0 8px 20px"><li>«Kodni nusxalash» tugmasini bosing.</li><li>GitHub\'dagi <b>ingliz</b> reposida <b>content.json</b> faylini oching → ✏️ (Edit).</li><li>Eski matnni o\'chirib, nusxani qo\'ying → «Commit changes».</li></ol><button class="btn" id="cp">Kodni nusxalash</button><button class="btn alt" id="rs">Saytdagi versiyani qayta yuklash</button></div><pre class="code">' + esc(json) + '</pre>';
    document.getElementById("cp").onclick = function () {
      if (navigator.clipboard) navigator.clipboard.writeText(json).then(function () { toast("Nusxalandi ✓"); }, function () { toast("Pastdagi matnni qo'lda belgilang"); });
      else toast("Pastdagi matnni qo'lda belgilang");
    };
    document.getElementById("rs").onclick = function () { localStorage.removeItem(LS_DRAFT); toast("Saytdagi versiya yuklandi"); admin("c"); };
  }

  /* ---------- router ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, "").split("/");
    if (h[0] === "videos") videos();
    else if (h[0] === "video") video(+h[1] || 0);
    else if (h[0] === "level") level(h[1]);
    else if (h[0] === "page") page(h[1], +h[2] || 0);
    else if (h[0] === "admin") admin(h[1]);
    else home();
  }
  window.addEventListener("hashchange", route);

  fetch("content.json?v=" + Date.now()).then(function (r) { return r.json(); }).then(function (j) { CONTENT = j; }).catch(function () {}).then(route);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
})();

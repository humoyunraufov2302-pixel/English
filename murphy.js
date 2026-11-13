// Murphy bo'limlari: ixcham matn formatini sahifalarga aylantirish
// Format:  @@ Unit nomi
//   # sarlavha   - matn   = formula qatori   > inglizcha | o'zbekcha   ! xato | to'g'ri | izoh
//   ? savol ___ | variant | *to'g'ri | variant      _ savol ___ (ishora) | javob / javob2
window.MURPHY = window.MURPHY || {};
window.MURPHY_ADD = function (book, text) {
  var units = (window.MURPHY[book] = window.MURPHY[book] || []), cur = null, last = null;
  text.split("\n").forEach(function (raw) {
    var l = raw.trim(); if (!l) return;
    var tag = l.slice(0, 2), body = l.slice(2).trim();
    if (l.indexOf("@@") === 0) { cur = { title: l.slice(2).trim(), explain: [], qs: [] }; units.push(cur); last = null; return; }
    if (!cur) return;
    var E = cur.explain;
    if (tag === "# ") { last = { h: body }; E.push(last); }
    else if (tag === "- ") { if (last && last.h && !last.p && !last.f && !last.ex) last.p = body; else { last = { p: body }; E.push(last); } }
    else if (tag === "= ") { if (last && last.f) last.f.push(body); else if (last && last.h && !last.f && !last.p && !last.ex) last.f = [body]; else { last = { f: [body] }; E.push(last); } }
    else if (tag === "> ") { var p = body.split(" | "); if (last && last.ex) last.ex.push([p[0], p[1] || ""]); else { last = { ex: [[p[0], p[1] || ""]] }; E.push(last); } }
    else if (tag === "! ") { var w = body.split(" | "); last = { w: [w[0], w[1], w[2] || ""] }; E.push(last); }
    else if (tag === "? ") { var o = body.split(" | "), q = o.shift(), a = 0; o = o.map(function (x, i) { if (x[0] === "*") { a = i; return x.slice(1); } return x; }); cur.qs.push({ t: "mc", q: q, o: o, a: a }); }
    else if (tag === "_ ") { var g = body.split(" | "); cur.qs.push({ t: "gap", q: g[0], a: g[1].split(" / ").map(function (x) { return x.trim(); }) }); }
  });
};
window.MURPHY_BUILD = function () {
  var books = { EG: ["Murphy 1", "Essential Grammar in Use", "#ef4444"], GU: ["Murphy 2", "English Grammar in Use", "#2563eb"] };
  Object.keys(books).forEach(function (k) {
    var u = window.MURPHY[k]; if (!u || !u.length) return;
    var b = books[k];
    window.LEVELS[k] = { title: b[0], badge: k === "EG" ? "M1" : "M2", color: b[2], sub: b[1], murphy: true, pages: u.map(function (x, i) {
      var th = x.explain.filter(function (e) { return e.h || e.p; }).slice(0, 3).map(function (e) { return (e.h ? e.h + (e.p ? ": " : "") : "") + (e.p || ""); }).join("\n");
      return { title: "Unit " + (i + 1) + " · " + x.title, theory: th, explain: x.explain, qs: x.qs };
    }) };
    // Lug'at: har 10 unitdagi yangi so'zlar (lug'atdagi tarjimasi bilan)
    var dict = {}, basic = {};
    (window.VOC || []).forEach(function (t) { t[2].trim().split("\n").forEach(function (l) { var p = l.split(" | "); if (p[1]) { var w = p[0].trim().toLowerCase(); if (!dict[w]) dict[w] = p[1].trim(); if (t[1] === "A1" && /fe'llar 1|Asosiy sifatlar|Predloglar|Ravishlar|Raqamlar|Ranglar/.test(t[0])) basic[w] = 1; } }); });
    for (var s = 0; s < u.length; s += 10) {
      var seen = {}, lines = [];
      u.slice(s, s + 10).forEach(function (x) {
        var txt = []; x.qs.forEach(function (q) { txt.push(q.q.replace(/\(.*?\)/g, " ")); (q.t === "mc" ? [q.o[q.a]] : q.a.slice(0, 1)).forEach(function (a) { txt.push(a); }); });
        x.explain.forEach(function (e) { (e.ex || []).forEach(function (p) { txt.push(p[0]); }); });
        txt.join(" ").toLowerCase().replace(/[^a-z' -]/g, " ").split(/\s+/).forEach(function (w) {
          w = w.replace(/^'+|'+$/g, ""); if (w.length < 3 || seen[w] || basic[w]) return;
          var base = dict[w] ? w : dict[w.replace(/s$/, "")] ? w.replace(/s$/, "") : dict[w.replace(/es$/, "")] ? w.replace(/es$/, "") : dict[w.replace(/ed$/, "")] ? w.replace(/ed$/, "") : dict[w.replace(/ing$/, "")] ? w.replace(/ing$/, "") : null;
          if (!base || seen[base]) return; seen[w] = seen[base] = 1; lines.push(base + " | " + dict[base]);
        });
      });
      if (lines.length) (window.VOC = window.VOC || []).push([b[0] + ": Unit " + (s + 1) + "–" + Math.min(u.length, s + 10), k === "EG" ? "A2" : "B1", "\n" + lines.join("\n") + "\n"]);
    }
  });
};

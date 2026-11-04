(function () {
  "use strict";
  var J = window.JUCO, LOGOS = window.JUCO_LOGOS || {};
  var SITE = "Great Lakes JUCO Stats";
  var app = document.getElementById("app");

  // ---------- data ----------
  var schools = J.schools, players = J.players;
  var S = {}, P = {}, B = {}, PI = {};
  schools.forEach(function (s) { S[s.id] = s; s.dslug = slug(s.state + " " + s.div); });
  players.forEach(function (p) { P[p.id] = p; });
  J.batting.forEach(function (b) { B[b.id] = b; b.p = P[b.id]; });
  J.pitching.forEach(function (r) { PI[r.id] = r; r.p = P[r.id]; });
  var STATES = ["Michigan", "Ohio", "Indiana"];
  var MIN_AB = 40, MIN_OUTS = 45;
  function divsOf(state) { var o = []; schools.forEach(function (s) { if (s.state === state && o.indexOf(s.div) < 0) o.push(s.div); }); return o.sort(); }
  function schoolsIn(state, div) { return schools.filter(function (s) { return s.state === state && (!div || s.div === div); }); }
  function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function lastName(n) { var a = n.split(" "); return a[a.length - 1]; }
  function qualB(b) { return b.AB >= MIN_AB; }
  function qualP(r) { return r.outs >= MIN_OUTS; }

  // ---------- dom helpers ----------
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style") el.setAttribute("style", v);
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
  }
  function link(href, text, cls) { return h("a", { href: "#" + href, class: cls }, text); }
  function plink(p) { return link("p-" + p.id, p.name); }
  function tlink(s, short) { return link("t-" + s.id, short ? s.short : s.name); }
  function logo(s, size) {
    var box = h("span", { class: size === "mini" ? "mini" : "logo" });
    if (LOGOS[s.id]) box.appendChild(h("img", { src: LOGOS[s.id], alt: s.name + " logo" }));
    else box.appendChild(h("span", { class: "mono", style: "background:" + s.c1 + ";border-bottom:4px solid " + s.c2 }, s.short.replace(/[^A-Za-z0-9&]/g, "").slice(0, 4)));
    return box;
  }
  function toast(msg) { var t = h("div", { class: "toast", role: "status" }, msg); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 1800); }

  // ---------- formatting ----------
  function r3(x) { if (x == null || isNaN(x)) return ""; var s = x.toFixed(3); return s.indexOf("0.") === 0 ? s.slice(1) : s; }
  function f2(x) { return x == null || isNaN(x) ? "" : x.toFixed(2); }
  function f1(x) { return x == null || isNaN(x) ? "" : x.toFixed(1); }
  function ipFromOuts(o) { return Math.floor(o / 3) + "." + (o % 3); }

  // ---------- column sets ----------
  var C = {
    rk: { k: "_rk", l: "Rk", t: "Rank", f: String, cls: "rk", nosort: true },
    name: { k: "_name", l: "Player", t: "Player name", cls: "l nm", v: function (r) { return r.p.name; }, cell: function (r) { return plink(r.p); }, sortv: function (r) { return lastName(r.p.name) + " " + r.p.name; }, asc: true },
    fname: { k: "_name", l: "Player", t: "Player name (star to save as a favorite)", cls: "l nm", v: function (r) { return r.p.name; }, cell: function (r) { return [star("p", r.p.id, r.p.name), plink(r.p)]; }, sortv: function (r) { return lastName(r.p.name) + " " + r.p.name; }, asc: true },
    school: { k: "_school", l: "School", t: "School", cls: "l", v: function (r) { return S[r.p.sid].name; }, cell: function (r) { var s = S[r.p.sid]; return [logo(s, "mini"), tlink(s)]; }, asc: true },
    bt: { k: "_bt", l: "B/T", t: "Bats/Throws", cls: "l", v: function (r) { return r.p.bt === "NA" ? "" : r.p.bt; }, asc: true },
    home: { k: "_home", l: "Hometown", t: "Hometown", cls: "l", v: function (r) { return r.p.home === "NA" ? "" : r.p.home; }, asc: true },
    hs: { k: "_hs", l: "High School", t: "High school", cls: "l", v: function (r) { return r.p.hs === "NA" ? "" : r.p.hs; }, asc: true },
    prev: { k: "_prev", l: "Prev. School", t: "Previous college", cls: "l", v: function (r) { return r.p.prev === "NA" ? "" : r.p.prev; }, asc: true },
    cls: { k: "_cls", l: "Cls", t: "Class (FR, redshirt FR, or first year where class isn't published)", cls: "l", v: function (r) { return r.p.cls; }, asc: true },
    pos: { k: "_pos", l: "Pos", t: "Position", cls: "l", v: function (r) { return r.p.pos === "NA" ? "" : r.p.pos; }, asc: true },
    no: { k: "_no", l: "#", t: "Jersey number", v: function (r) { return r.p.no; }, sortv: function (r) { return +r.p.no || 999; }, asc: true },
    score: { k: "score", l: "Score", t: "Freshman composite score, 0-100 (see Glossary)", f: function (v) { return v == null ? "" : v.toFixed(1); } }
  };
  function n(k, l, t, f, asc) { return { k: k, l: l, t: t, f: f || String, asc: !!asc }; }
  var BAT = [n("G", "G", "Games played"), n("PA", "PA", "Plate appearances"), n("AB", "AB", "At bats"), n("R", "R", "Runs scored"), n("H", "H", "Hits"),
    n("D", "2B", "Doubles"), n("T", "3B", "Triples"), n("HR", "HR", "Home runs"), n("RBI", "RBI", "Runs batted in"), n("SB", "SB", "Stolen bases"),
    n("CS", "CS", "Caught stealing"), n("BB", "BB", "Walks"), n("SO", "SO", "Strikeouts"), n("BA", "BA", "Batting average", r3), n("OBP", "OBP", "On-base percentage", r3),
    n("SLG", "SLG", "Slugging percentage", r3), n("OPS", "OPS", "On-base plus slugging", r3), n("ISO", "ISO", "Isolated power (SLG minus BA)", r3),
    n("BBK", "BB/K", "Walks per strikeout", f2), n("TB", "TB", "Total bases"), n("HBP", "HBP", "Hit by pitch"), n("SF", "SF", "Sacrifice flies")];
  var PIT = [n("W", "W", "Wins"), n("L", "L", "Losses"), n("ERA", "ERA", "Earned run average (9 innings)", f2, true), n("G", "G", "Games pitched"), n("GS", "GS", "Games started"),
    n("SV", "SV", "Saves"), { k: "outs", l: "IP", t: "Innings pitched", f: ipFromOuts }, n("H", "H", "Hits allowed", null, true), n("R", "R", "Runs allowed", null, true),
    n("ER", "ER", "Earned runs allowed", null, true), n("HR", "HR", "Home runs allowed", null, true), n("BB", "BB", "Walks", null, true), n("SO", "SO", "Strikeouts"),
    n("HBP", "HBP", "Hit batters", null, true), n("WHIP", "WHIP", "(Walks + hits) per inning", f2, true), n("H9", "H9", "Hits per 9 innings", f1, true),
    n("K9", "SO9", "Strikeouts per 9 innings", f1), n("BB9", "BB9", "Walks per 9 innings", f1, true), n("SOW", "SO/W", "Strikeouts per walk", f2),
    n("BAA", "BAA*", "Batting average against, estimated as H / (H + outs recorded)", r3, true)];
  var RATE_B = { BA: 1, OBP: 1, SLG: 1, OPS: 1, ISO: 1, BBK: 1 }, RATE_P = { ERA: 1, WHIP: 1, H9: 1, K9: 1, BB9: 1, SOW: 1, BAA: 1 };

  // ---------- table component ----------
  var sortState = {};
  function table(opts) {
    var id = opts.id, cols = opts.cols, rows = opts.rows.slice();
    var st = sortState[id] || opts.sort || null;
    if (st) {
      var col = cols.filter(function (c) { return c.k === st.k; })[0];
      if (col) rows.sort(function (a, b) {
        var x = val(col, a, true), y = val(col, b, true);
        var nx = x === "" || x == null, ny = y === "" || y == null;
        if (nx && !ny) return 1; if (ny && !nx) return -1;
        if (typeof x === "number" && typeof y === "number") return (x - y) * st.dir;
        return String(x).localeCompare(String(y)) * st.dir;
      });
    }
    var leads = {};
    if (opts.leaders) cols.forEach(function (c) {
      if (c.k.charAt(0) === "_" || c.k === "score" || (opts.leaders === "bat" && (c.k === "SO" || c.k === "CS"))) return;
      var rate = opts.leaders === "bat" ? RATE_B[c.k] : RATE_P[c.k];
      var pool = rows.filter(function (r) { return !rate || (opts.leaders === "bat" ? qualB(r) : qualP(r)); });
      if (!pool.length) return;
      var best = null;
      pool.forEach(function (r) { var v = r[c.k]; if (v == null) return; if (best == null || (c.asc ? v < best : v > best)) best = v; });
      if (best != null && best !== 0) leads[c.k] = best;
    });
    var thead = h("tr", null, cols.map(function (c) {
      var th = h("th", { class: /l/.test(c.cls || "") ? "l" : null, scope: "col", title: c.t },
        h("abbr", { title: c.t }, c.l));
      if (st && st.k === c.k) th.setAttribute("aria-sort", st.dir > 0 ? "ascending" : "descending");
      if (!c.nosort) th.addEventListener("click", function () {
        var cur = sortState[id] || opts.sort;
        sortState[id] = { k: c.k, dir: cur && cur.k === c.k ? -cur.dir : (c.asc ? 1 : -1) };
        render();
      });
      return th;
    }));
    var tb = h("tbody");
    rows.forEach(function (r, i) {
      var tr = h("tr");
      cols.forEach(function (c) {
        var td = h("td", { class: c.cls || null });
        if (c.k === "_rk") { td.textContent = r._rk != null ? r._rk : (i + 1); if (r.p) td.style.setProperty("--rowc", S[r.p.sid].c1); }
        else if (c.cell) add(td, c.cell(r));
        else if (c.v) td.textContent = c.v(r);
        else { var v = r[c.k]; td.textContent = v == null ? "" : (c.f ? c.f(v) : v); }
        if (leads[c.k] != null && r[c.k] === leads[c.k]) td.className = (td.className + " lead").trim();
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    var tf = null;
    if (opts.foot) {
      tf = h("tfoot", null, h("tr", null, cols.map(function (c, i) {
        var v = opts.foot[c.k];
        return h("td", { class: c.cls ? c.cls.replace("nm", "") : null }, i === 0 ? opts.foot._label : (v == null ? "" : (c.f ? c.f(v) : v)));
      })));
    }
    var tbl = h("table", { class: "stats", id: id }, h("thead", null, thead), tb, tf);
    var csv = function () {
      var lines = [cols.map(function (c) { return c.l; }).join(",")];
      rows.forEach(function (r, i) {
        lines.push(cols.map(function (c) {
          var v = c.k === "_rk" ? (r._rk != null ? r._rk : i + 1) : c.v ? c.v(r) : (r[c.k] == null ? "" : (c.f ? c.f(r[c.k]) : r[c.k]));
          v = String(v); return /[",]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
        }).join(","));
      });
      return lines.join("\n");
    };
    var tools = h("div", { class: "tools" },
      h("button", { type: "button", onclick: function () {
        var t = csv();
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast("Table copied as CSV"); }, function () { showCsv(t); });
        else showCsv(t);
      } }, "Copy CSV"),
      h("button", { type: "button", onclick: function () {
        try {
          var a = h("a", { href: URL.createObjectURL(new Blob([csv()], { type: "text/csv" })), download: (opts.file || id) + ".csv" });
          document.body.appendChild(a); a.click(); a.remove();
        } catch (e) { showCsv(csv()); }
      } }, "Download CSV"));
    return h("section", { class: "section", id: "sec-" + id },
      h("div", { class: "sechead" }, h("h2", null, opts.title), opts.note ? h("span", { class: "note" }, opts.note) : null, tools),
      h("div", { class: "tablewrap" }, tbl));
  }
  function val(c, r, forSort) {
    if (forSort && c.sortv) return c.sortv(r);
    if (c.v) return c.v(r);
    return r[c.k];
  }
  function showCsv(t) {
    var ta = h("textarea", { style: "width:100%;height:200px;font:12px monospace", readonly: true }); ta.value = t;
    var box = h("div", { class: "infobox", style: "position:fixed;inset:auto 16px calc(16px + env(safe-area-inset-bottom,0px)) 16px;z-index:60;max-width:720px;margin:auto" },
      h("p", null, "Select the text and copy it:"), ta, h("button", { class: "btn", type: "button", onclick: function () { box.remove(); } }, "Close"));
    document.body.appendChild(box); ta.focus(); ta.select();
  }

  // ---------- totals ----------
  function batTotals(rows) {
    var t = { _label: "Freshman totals" };
    ["G", "PA", "AB", "R", "H", "D", "T", "HR", "RBI", "SB", "CS", "BB", "SO", "HBP", "SF", "TB"].forEach(function (k) { t[k] = rows.reduce(function (a, r) { return a + r[k]; }, 0); });
    t.G = null;
    if (t.AB) { t.BA = t.H / t.AB; t.SLG = t.TB / t.AB; t.OBP = (t.H + t.BB + t.HBP) / (t.AB + t.BB + t.HBP + t.SF); t.OPS = t.OBP + t.SLG; t.ISO = t.SLG - t.BA; t.BBK = t.SO ? t.BB / t.SO : t.BB; }
    return t;
  }
  function pitTotals(rows) {
    var t = { _label: "Freshman totals" };
    ["W", "L", "SV", "outs", "H", "R", "ER", "HR", "BB", "SO", "HBP"].forEach(function (k) { t[k] = rows.reduce(function (a, r) { return a + r[k]; }, 0); });
    if (t.outs) { t.ERA = t.ER * 27 / t.outs; t.WHIP = (t.H + t.BB) * 3 / t.outs; t.H9 = t.H * 27 / t.outs; t.K9 = t.SO * 27 / t.outs; t.BB9 = t.BB * 27 / t.outs; t.SOW = t.BB ? t.SO / t.BB : t.SO; t.BAA = t.H / (t.H + t.outs); }
    return t;
  }

  // ---------- rankings ----------
  function ranked(list, scopeFn) {
    return list.filter(function (r) { return r.score != null && scopeFn(r); }).sort(function (a, b) { return b.score - a.score; });
  }
  function rankOf(list, r, scopeFn) { var L = ranked(list, scopeFn); var i = L.indexOf(r); return i < 0 ? null : { n: i + 1, of: L.length }; }
  function inState(st) { return function (r) { return S[r.p.sid].state === st; }; }
  function inDiv(st, dv) { return function (r) { var s = S[r.p.sid]; return s.state === st && s.div === dv; }; }
  function all() { return true; }

  // ---------- leader boxes ----------
  var LB = [
    { k: "BA", l: "Batting Average", f: r3, q: qualB, src: "bat" }, { k: "OBP", l: "On-Base %", f: r3, q: qualB, src: "bat" },
    { k: "SLG", l: "Slugging %", f: r3, q: qualB, src: "bat" }, { k: "OPS", l: "OPS", f: r3, q: qualB, src: "bat" },
    { k: "HR", l: "Home Runs", src: "bat" }, { k: "RBI", l: "Runs Batted In", src: "bat" }, { k: "H", l: "Hits", src: "bat" },
    { k: "R", l: "Runs", src: "bat" }, { k: "SB", l: "Stolen Bases", src: "bat" }, { k: "BB", l: "Walks", src: "bat" },
    { k: "ISO", l: "Isolated Power", f: r3, q: qualB, src: "bat" }, { k: "TB", l: "Total Bases", src: "bat" },
    { k: "ERA", l: "ERA", f: f2, q: qualP, asc: true, src: "pit" }, { k: "WHIP", l: "WHIP", f: f2, q: qualP, asc: true, src: "pit" },
    { k: "SO", l: "Strikeouts", src: "pit" }, { k: "outs", l: "Innings Pitched", f: ipFromOuts, src: "pit" },
    { k: "W", l: "Wins", src: "pit" }, { k: "SV", l: "Saves", src: "pit" }, { k: "K9", l: "Strikeouts per 9", f: f1, q: qualP, src: "pit" },
    { k: "BB9", l: "Walks per 9", f: f1, q: qualP, asc: true, src: "pit" }, { k: "SOW", l: "Strikeout-to-Walk", f: f2, q: qualP, src: "pit" },
    { k: "BAA", l: "Opp. Batting Avg*", f: r3, q: qualP, asc: true, src: "pit" }
  ];
  function leaderBox(def, scopeFn, nTop) {
    var src = def.src === "bat" ? J.batting : J.pitching;
    var L = src.filter(function (r) { return scopeFn(r) && (!def.q || def.q(r)); }).sort(function (a, b) { return def.asc ? a[def.k] - b[def.k] : b[def.k] - a[def.k]; }).slice(0, nTop || 10);
    var rank = 0, prev = null;
    return h("div", { class: "lbox" },
      h("h3", null, def.l, h("small", null, def.q ? (def.src === "bat" ? "min. 40 AB" : "min. 15 IP") : "")),
      h("ol", null, L.map(function (r, i) {
        if (r[def.k] !== prev) { rank = i + 1; prev = r[def.k]; }
        var s = S[r.p.sid];
        return h("li", null, h("span", { class: "n" }, rank + "."),
          h("span", { class: "who" }, plink(r.p), " ", h("small", null, s.name)),
          h("span", { class: "v" }, def.f ? def.f(r[def.k]) : r[def.k]));
      })));
  }

  // ---------- shell ----------
  function crumbs(list) {
    var c = h("nav", { class: "crumbs", "aria-label": "Breadcrumb" });
    list.forEach(function (x, i) { if (i) add(c, " > "); add(c, x[1] ? link(x[1], x[0]) : x[0]); });
    return c;
  }
  // ---------- favorites (saved in this browser) ----------
  var FAVKEY = "glj-favorites";
  var FAV = (function () { try { var v = JSON.parse(localStorage.getItem(FAVKEY) || "{}"); return { p: v.p || [], t: v.t || [] }; } catch (e) { return { p: [], t: [] }; } })();
  function saveFav() { try { localStorage.setItem(FAVKEY, JSON.stringify(FAV)); } catch (e) {} }
  function isFav(kind, id) { return FAV[kind].indexOf(id) >= 0; }
  function star(kind, id, label) {
    var b = h("button", { type: "button", class: "star", "data-fav": kind + ":" + id });
    function paint() { var on = isFav(kind, id); b.textContent = on ? "\u2605" : "\u2606"; b.setAttribute("aria-pressed", on ? "true" : "false"); b.setAttribute("aria-label", (on ? "Remove " : "Add ") + label + (on ? " from" : " to") + " favorites"); b.title = on ? "Remove from favorites" : "Add to favorites"; }
    b.onclick = function (e) {
      e.preventDefault(); e.stopPropagation();
      var L = FAV[kind], i = L.indexOf(id); if (i >= 0) L.splice(i, 1); else L.push(id); saveFav();
      document.querySelectorAll('.star[data-fav="' + kind + ":" + id + '"]').forEach(function (x) { x._paint && x._paint(); });
      if (location.hash === "" || location.hash === "#home") render();
    };
    b._paint = paint; paint(); return b;
  }

  function setNav(key) {
    document.querySelectorAll(".nav a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-k") === key); });
  }

  // ---------- pages ----------
  function pageHome() {
    setNav("home"); document.title = SITE;
    var topH = ranked(J.batting, all).slice(0, 5), topP = ranked(J.pitching, all).slice(0, 5);
    var hero = h("div", { class: "home-hero" },
      h("div", null,
        h("h1", { style: "font-size:34px" }, "2025-26 JUCO Freshman Stats"),
        h("p", { class: "lede" }, "Batting and pitching for every freshman at the " + schools.length + " junior college baseball programs in Michigan, Ohio and Indiana. " + players.length + " players, sortable tables, leaderboards, and a composite ranking built for recruiting."),
        h("dl", { class: "summary", style: "margin-top:16px" }, [["Programs", schools.length], ["States", 3], ["Divisions", STATES.reduce(function (a, st) { return a + divsOf(st).length; }, 0)], ["Freshmen", players.length], ["Ranked hitters", ranked(J.batting, all).length], ["Ranked pitchers", ranked(J.pitching, all).length]].map(function (x) { return h("div", null, h("dt", null, x[0]), h("dd", null, x[1])); })),
        h("div", { class: "section", style: "margin-top:18px" }, h("div", { class: "sechead" }, h("h2", null, "Browse by division")),
          h("table", { class: "stats" }, h("tbody", null, STATES.map(function (st) { return h("tr", null, h("td", { class: "l" }, h("b", null, link("lg-" + slug(st), st))), h("td", { class: "l", style: "white-space:normal" }, divsOf(st).map(function (dv, i) { return [i ? " · " : "", link("d-" + slug(st + " " + dv), dv), " (" + schoolsIn(st, dv).length + ")"]; }))); }))))),
      h("aside", { class: "infobox" },
        h("h3", null, "Top-ranked freshmen"),
        h("p", { style: "margin:0 0 4px;font-weight:700" }, "Hitters"),
        h("ol", { style: "margin:0 0 8px;padding-left:20px" }, topH.map(function (r) { return h("li", null, plink(r.p), " · ", S[r.p.sid].name, " · ", h("b", null, r.score.toFixed(1))); })),
        h("p", { style: "margin:0 0 4px;font-weight:700" }, "Pitchers"),
        h("ol", { style: "margin:0;padding-left:20px" }, topP.map(function (r) { return h("li", null, plink(r.p), " · ", S[r.p.sid].name, " · ", h("b", null, r.score.toFixed(1))); })),
        h("p", { style: "margin:8px 0 0" }, link("rankings", "Full rankings »"))));
    var boxes = ["BA", "HR", "OPS", "SB", "ERA", "SO", "outs", "WHIP"].map(function (k) { return leaderBox(LB.filter(function (d) { return d.k === k && (d.src === (["ERA", "SO", "outs", "WHIP"].indexOf(k) >= 0 ? "pit" : "bat")); })[0], all, 5); });
    var teams = h("div", { class: "grid2" }, STATES.map(function (st) {
      return h("div", { class: "section" }, h("div", { class: "sechead" }, h("h2", null, link("lg-" + slug(st), st))),
        h("div", { class: "grid", style: "margin-top:10px" }, schoolsIn(st).map(teamCard)));
    }));
    return [favSection(), hero, h("div", { class: "section" }, h("div", { class: "sechead" }, h("h2", null, "League leaders"), h("span", { class: "note" }, "All three states"), h("span", { class: "tools" }, link("leaders", "All leaderboards »"))),
      h("div", { class: "grid", style: "margin-top:12px" }, boxes)), teams];
  }
  function favSection() {
    var B = {}, PI = {};
    J.batting.forEach(function (b) { B[b.id] = b; }); J.pitching.forEach(function (r) { PI[r.id] = r; });
    var favP = FAV.p.map(function (id) { return P[id]; }).filter(Boolean), favT = FAV.t.map(function (id) { return S[id]; }).filter(Boolean);
    var head = h("div", { class: "sechead" }, h("h2", null, "\u2605 My Favorites"), h("span", { class: "note" }, favP.length + (favP.length === 1 ? " player · " : " players · ") + favT.length + (favT.length === 1 ? " team" : " teams") + " · saved in this browser"));
    if (!favP.length && !favT.length) return h("div", { class: "section favs" }, head, h("p", { class: "lede", style: "margin:8px 0 0" }, "Tap the \u2606 next to a player's name on the ", link("players", "Players"), " or ", link("teams", "Teams"), " pages to pin them here."));
    var out = [head];
    if (favP.length) {
      var rows = favP.map(function (p) { return { p: p, b: B[p.id], r: PI[p.id] }; });
      out.push(table({ id: "favp", title: "Favorite Players", file: "favorite-players", cols: [C.fname, C.school, C.cls, C.pos, C.bt, C.home, C.hs,
        { k: "_line", l: "Batting", t: "BA/OBP/SLG, HR, AB", cls: "l", nosort: true, v: function (r) { return r.b ? r3(r.b.BA) + "/" + r3(r.b.OBP) + "/" + r3(r.b.SLG) + ", " + r.b.HR + " HR, " + r.b.AB + " AB" : ""; } },
        { k: "_pline", l: "Pitching", t: "ERA, IP, SO, BB", cls: "l", nosort: true, v: function (r) { return r.r ? f2(r.r.ERA) + " ERA, " + r.r.IP + " IP, " + r.r.SO + " SO, " + r.r.BB + " BB" : ""; } },
        { k: "_sc", l: "Score", t: "Best composite score (hitting or pitching)", v: function (r) { var a = r.b && r.b.score, c = r.r && r.r.score; var m = Math.max(a == null ? -1 : a, c == null ? -1 : c); return m < 0 ? "" : m.toFixed(1); }, sortv: function (r) { return Math.max((r.b && r.b.score) || 0, (r.r && r.r.score) || 0); } }],
        rows: rows }));
    }
    if (favT.length) out.push(h("div", { class: "grid", style: "margin-top:12px" }, favT.map(function (s) { return teamCard(s, true); })));
    return h("div", { class: "section favs" }, out);
  }
  function teamCard(s, withStar) {
    var a = h("a", { href: "#t-" + s.id, class: "tcard", style: "--c1:" + s.c1 }, logo(s), h("span", null, h("b", null, s.name), h("small", null, s.mascot + " · " + s.rec)));
    return withStar ? h("div", { class: "tcwrap" }, a, star("t", s.id, s.name)) : a;
  }

  function pagePlayer(id) {
    var p = P[id]; if (!p) return notFound();
    var s = S[p.sid], b = B[id], r = PI[id];
    setNav("players"); document.title = p.name + " Stats | " + SITE;
    var bio = [];
    function line(lbl, v) { if (v && v !== "NA") bio.push(h("p", null, h("strong", null, lbl + ": "), v)); }
    line("Position", p.pos); line("Bats/Throws", p.bt); line("Class", p.cls + " (2025-26)");
    bio.push(h("p", null, h("strong", null, "School: "), tlink(s), " (" + s.div + ", " + s.state + ")"));
    line("High School", p.hs); line("Hometown", p.home); line("Previous School", p.prev); line("Major", p.major);
    if (p.no) line("Uniform", "#" + p.no);
    var sum = [];
    if (b) sum.push(["G", b.G], ["AB", b.AB], ["H", b.H], ["HR", b.HR], ["BA", r3(b.BA)], ["OBP", r3(b.OBP)], ["SLG", r3(b.SLG)], ["OPS", r3(b.OPS)]);
    if (r) sum.push(["W-L", r.W + "-" + r.L], ["ERA", f2(r.ERA)], ["IP", r.IP], ["SO", r.SO], ["WHIP", f2(r.WHIP)]);
    var rankBits = [];
    [[b, J.batting, "Hitter"], [r, J.pitching, "Pitcher"]].forEach(function (x) {
      var row = x[0]; if (!row) return;
      if (row.score == null) { rankBits.push(h("p", null, h("strong", null, x[2] + " score: "), h("span", { class: "unq" }, "not ranked (below " + (x[2] === "Hitter" ? "40 AB" : "15 IP") + ")"))); return; }
      var d = rankOf(x[1], row, inDiv(s.state, s.div)), st = rankOf(x[1], row, inState(s.state)), a = rankOf(x[1], row, all);
      rankBits.push(h("p", null, h("strong", null, x[2] + " score: "), row.score.toFixed(1),
        " · #" + d.n + " in ", link("d-" + s.dslug, s.div), " · #" + st.n + " in ", link("rankings", s.state), " · #" + a.n + " of " + a.of + " overall"));
    });
    var head = h("div", { class: "pagehead" }, logo(s),
      h("div", { class: "meta" }, h("h1", null, p.name, " ", star("p", p.id, p.name)), bio, rankBits,
        h("dl", { class: "summary" }, sum.map(function (x) { return h("div", null, h("dt", null, x[0]), h("dd", null, x[1])); })),
        h("div", { class: "teambar", style: "background:linear-gradient(90deg," + s.c1 + " 70%," + s.c2 + " 70%)" })));
    var out = [crumbs([["Home", "home"], [s.state, "lg-" + slug(s.state)], [s.name, "t-" + s.id], [p.name]]), head];
    if (b) { var rb = Object.assign({}, b, { _season: J.season, _team: s.name }); out.push(table({ id: "bat-" + id, title: "Standard Batting", file: slug(p.name) + "-batting", cols: [{ k: "_season", l: "Year", t: "Season", cls: "l", v: function () { return J.season; }, cell: function () { return J.season; } }, { k: "_team", l: "Tm", t: "Team", cls: "l", v: function () { return s.name; }, cell: function () { return tlink(s); } }, C.cls].concat(BAT, [C.score]), rows: [rb] })); }
    if (r) { var rp = Object.assign({}, r); out.push(table({ id: "pit-" + id, title: "Standard Pitching", file: slug(p.name) + "-pitching", cols: [{ k: "_season", l: "Year", t: "Season", cls: "l", v: function () { return J.season; }, cell: function () { return J.season; } }, { k: "_team", l: "Tm", t: "Team", cls: "l", v: function () { return s.name; }, cell: function () { return tlink(s); } }, C.cls].concat(PIT, [C.score]), rows: [rp] })); }
    var mates = players.filter(function (q) { return q.sid === p.sid && q.id !== p.id; }).sort(function (a, c) { return lastName(a.name).localeCompare(lastName(c.name)); });
    out.push(h("section", { class: "section" }, h("div", { class: "sechead" }, h("h2", null, "More " + s.name + " freshmen")),
      h("p", { style: "font-size:13px;line-height:1.9" }, mates.map(function (q, i) { return [i ? " · " : "", plink(q)]; }))));
    return out;
  }

  function rosterOf(id) {
    return J.players.filter(function (p) { return p.sid === id; }).map(function (p) { return { p: p }; });
  }
  function pageTeam(id) {
    var s = S[id]; if (!s) return notFound();
    setNav("teams"); document.title = s.name + " Freshman Stats | " + SITE;
    var bat = J.batting.filter(function (b) { return b.p.sid === id; });
    var pit = J.pitching.filter(function (r) { return r.p.sid === id; });
    var head = h("div", { class: "pagehead" }, logo(s),
      h("div", { class: "meta" }, h("h1", null, J.season + " " + s.name + " " + s.mascot, " ", star("t", s.id, s.name)),
        h("p", null, h("strong", null, "Record: "), s.rec),
        h("p", null, h("strong", null, "Division: "), link("d-" + s.dslug, s.div), " · ", link("lg-" + slug(s.state), s.state)),
        h("p", null, h("strong", null, "Freshmen: "), bat.length + " batters, " + pit.length + " pitchers"),
        h("p", null, h("strong", null, "Colors: "), h("span", { class: "swatch", style: "background:" + s.c1 }), s.c1 + "  ", h("span", { class: "swatch", style: "background:" + s.c2 }), s.c2),
        h("div", { class: "teambar", style: "background:linear-gradient(90deg," + s.c1 + " 70%," + s.c2 + " 70%)" })));
    return [crumbs([["Home", "home"], ["Teams", "teams"], [s.state, "lg-" + slug(s.state)], [s.name]]), head,
      table({ id: "tr-" + id, title: "Freshman Roster", note: "Position, hometown and high school from team rosters, The Baseball Cube and PBR", file: slug(s.short) + "-roster", cols: [C.no, C.fname, C.cls, C.pos, C.bt, C.home, C.hs, C.prev], rows: rosterOf(id), sort: { k: "_name", dir: 1 } }),
      table({ id: "tb-" + id, title: "Freshman Batting", note: "Turquoise marks the team leader · rate leaders need 40 AB", file: slug(s.short) + "-batting", leaders: "bat", cols: [C.no, C.fname, C.cls, C.pos].concat(BAT, [C.score]), rows: bat, sort: { k: "PA", dir: -1 }, foot: batTotals(bat) }),
      table({ id: "tp-" + id, title: "Freshman Pitching", note: "Rate leaders need 15 IP", file: slug(s.short) + "-pitching", leaders: "pit", cols: [C.no, C.fname, C.cls].concat(PIT, [C.score]), rows: pit, sort: { k: "outs", dir: -1 }, foot: pitTotals(pit) })];
  }

  function pageTeams() {
    setNav("teams"); document.title = "Teams | " + SITE;
    var out = [crumbs([["Home", "home"], ["Teams"]]), h("div", { class: "pagehead" }, h("div", { class: "meta" }, h("h1", null, "Teams"), h("p", { class: "lede" }, schools.length + " junior college baseball programs, by state and conference division.")))];
    STATES.forEach(function (st) {
      divsOf(st).forEach(function (dv) {
        out.push(h("section", { class: "section" }, h("div", { class: "sechead" }, h("h2", null, link("d-" + slug(st + " " + dv), st + " · " + dv))),
          h("div", { class: "grid", style: "margin-top:10px" }, schoolsIn(st, dv).map(function (s) { return teamCard(s, true); }))));
      });
    });
    return out;
  }

  function teamRowsFor(list) {
    return list.map(function (s) {
      var bat = J.batting.filter(function (b) { return b.p.sid === s.id; }), pit = J.pitching.filter(function (r) { return r.p.sid === s.id; });
      var bt = batTotals(bat), pt = pitTotals(pit);
      return { s: s, _team: s.name, rec: s.rec, nb: bat.length, np: pit.length, BA: bt.BA, OPS: bt.OPS, HR: bt.HR, ERA: pt.ERA, SO: pt.SO, outs: pt.outs,
        top: ranked(bat.concat(pit), all)[0] };
    });
  }
  var TEAMCOLS = [
    { k: "_team", l: "Team", t: "School", cls: "l", v: function (r) { return r.s.name; }, cell: function (r) { return [logo(r.s, "mini"), tlink(r.s)]; }, asc: true },
    { k: "rec", l: "Record", t: "2025-26 overall (conference)", cls: "l", nosort: true },
    n("nb", "Fr Bat", "Freshman batters"), n("np", "Fr Pit", "Freshman pitchers"),
    n("BA", "Fr BA", "Freshman batting average", r3), n("OPS", "Fr OPS", "Freshman OPS", r3), n("HR", "Fr HR", "Freshman home runs"),
    n("ERA", "Fr ERA", "Freshman ERA", f2, true), { k: "outs", l: "Fr IP", t: "Freshman innings", f: ipFromOuts }, n("SO", "Fr SO", "Freshman strikeouts"),
    { k: "_top", l: "Top-ranked freshman", t: "Highest composite score on the team", cls: "l", nosort: true, v: function (r) { return r.top ? r.top.p.name : ""; }, cell: function (r) { return r.top ? [plink(r.top.p), " (" + r.top.score.toFixed(1) + ")"] : ""; } }];

  function rankTables(scopeFn, limit, idp, label) {
    var hc = [C.rk, C.name, C.school, C.cls, n("AB", "AB", "At bats"), n("BA", "BA", "Batting average", r3), n("OBP", "OBP", "On-base %", r3), n("OPS", "OPS", "OPS", r3), n("BBK", "BB/K", "Walks per strikeout", f2), n("ISO", "ISO", "Isolated power", r3), n("HR", "HR", "Home runs"), n("RBI", "RBI", "Runs batted in"), n("SB", "SB", "Stolen bases"), C.score];
    var pc = [C.rk, C.name, C.school, C.cls, { k: "outs", l: "IP", t: "Innings pitched", f: ipFromOuts }, n("ERA", "ERA", "ERA", f2, true), n("K9", "SO9", "Strikeouts per 9", f1), n("BB9", "BB9", "Walks per 9", f1, true), n("BAA", "BAA*", "Est. batting average against", r3, true), n("SO", "SO", "Strikeouts"), n("BB", "BB", "Walks", null, true), n("WHIP", "WHIP", "WHIP", f2, true), C.score];
    var hb = ranked(J.batting, scopeFn).slice(0, limit).map(function (r, i) { return Object.assign(Object.create(r), { _rk: i + 1 }); });
    var pb = ranked(J.pitching, scopeFn).slice(0, limit).map(function (r, i) { return Object.assign(Object.create(r), { _rk: i + 1 }); });
    return [table({ id: idp + "-h", title: label + " Hitters", note: "OPS 40% · BB/K 25% · ISO 20% · BA 15% · min. 40 AB" + (hb.length < limit ? " · only " + hb.length + " qualify" : ""), cols: hc, rows: hb, file: idp + "-hitters" }),
      table({ id: idp + "-p", title: label + " Pitchers", note: "ERA 35% · IP 25% · SO9 20% · BB9 12% · BAA 8% · min. 15 IP" + (pb.length < limit ? " · only " + pb.length + " qualify" : ""), cols: pc, rows: pb, file: idp + "-pitchers" })];
  }

  function pageLeague(st) {
    st = STATES.filter(function (x) { return slug(x) === st; })[0]; if (!st) return notFound();
    setNav("lg-" + slug(st)); document.title = st + " JUCOs | " + SITE;
    var out = [crumbs([["Home", "home"], [st + " JUCOs"]]), h("div", { class: "pagehead" }, h("div", { class: "meta" }, h("h1", null, J.season + " " + st + " Junior College Baseball"),
      h("p", { class: "lede" }, schoolsIn(st).length + " programs in " + divsOf(st).length + " divisions. Freshman stats only."),
      h("div", { class: "chips" }, divsOf(st).map(function (dv) { return link("d-" + slug(st + " " + dv), dv, "chip"); }))))];
    divsOf(st).forEach(function (dv) {
      out.push(table({ id: "div-" + slug(dv), title: dv, note: "Team freshman totals", cols: TEAMCOLS, rows: teamRowsFor(schoolsIn(st, dv)), file: slug(st + " " + dv) + "-teams" }));
    });
    return out.concat(rankTables(inState(st), 25, "st-" + slug(st), st + " Top 25"));
  }

  function pageDivision(ds) {
    var s0 = schools.filter(function (s) { return s.dslug === ds; })[0]; if (!s0) return notFound();
    var st = s0.state, dv = s0.div;
    setNav("lg-" + slug(st)); document.title = dv + " (" + st + ") | " + SITE;
    return [crumbs([["Home", "home"], [st + " JUCOs", "lg-" + slug(st)], [dv]]),
      h("div", { class: "pagehead" }, h("div", { class: "meta" }, h("h1", null, J.season + " " + dv), h("p", null, st + " · " + schoolsIn(st, dv).length + " teams"),
        h("div", { class: "chips" }, divsOf(st).map(function (d) { return link("d-" + slug(st + " " + d), d, "chip"); }), link("lg-" + slug(st), st + " Top 25", "chip")))),
      table({ id: "dt-" + ds, title: "Teams", cols: TEAMCOLS, rows: teamRowsFor(schoolsIn(st, dv)), file: ds + "-teams" })]
      .concat(rankTables(inDiv(st, dv), 10, "dv-" + ds, "Top 10"),
        [h("section", { class: "section" }, h("div", { class: "sechead" }, h("h2", null, "Division leaders")), h("div", { class: "grid", style: "margin-top:12px" }, ["BA", "OPS", "HR", "SB", "ERA", "SO"].map(function (k) { return leaderBox(LB.filter(function (d) { return d.k === k && d.src === (["ERA", "SO"].indexOf(k) >= 0 ? "pit" : "bat"); })[0], inDiv(st, dv), 5); })))]);
  }

  var rankUI = { scope: "All", sub: null };
  function pageRankings() {
    setNav("rankings"); document.title = "Freshman Rankings | " + SITE;
    var scope = rankUI.scope, out = [crumbs([["Home", "home"], ["Freshman Rankings"]]),
      h("div", { class: "pagehead" }, h("div", { class: "meta" }, h("h1", null, "Freshman Rankings"),
        h("p", { class: "lede" }, "Composite score from 0 to 100. Each stat is a percentile against every qualified freshman in all three states, so a score means the same thing everywhere. ", link("glossary", "How it's calculated")),
        h("div", { class: "chips", role: "tablist" }, ["All"].concat(STATES).map(function (x) {
          return h("button", { class: "chip", type: "button", "aria-pressed": scope === x ? "true" : "false", onclick: function () { rankUI.scope = x; rankUI.sub = null; render(); } }, x === "All" ? "All 3 States · Top 40" : x);
        }))))];
    if (scope === "All") return out.concat(rankTables(all, 40, "all", "Top 40"));
    var divs = divsOf(scope), sub = rankUI.sub || "TOP";
    out.push(h("div", { class: "chips" }, divs.concat(["TOP"]).map(function (d) {
      return h("button", { class: "chip", type: "button", "aria-pressed": sub === d ? "true" : "false", onclick: function () { rankUI.sub = d; render(); } }, d === "TOP" ? scope + " Top 25" : d + " Top 10");
    })));
    if (sub === "TOP") return out.concat(rankTables(inState(scope), 25, "st-" + slug(scope), scope + " Top 25"));
    return out.concat(rankTables(inDiv(scope, sub), 10, "dv-" + slug(scope + " " + sub), sub + " Top 10"));
  }

  var leadUI = { scope: "all" };
  function pageLeaders() {
    setNav("leaders"); document.title = "Leaderboards | " + SITE;
    var opts = [["all", "All 3 states"]];
    STATES.forEach(function (st) { opts.push(["s:" + st, st]); divsOf(st).forEach(function (d) { opts.push(["d:" + st + "|" + d, st + " · " + d]); }); });
    var sel = h("select", { id: "lead-scope", onchange: function (e) { leadUI.scope = e.target.value; render(); } }, opts.map(function (o) { return h("option", { value: o[0], selected: leadUI.scope === o[0] }, o[1]); }));
    var sc = leadUI.scope, fn = all;
    if (sc.indexOf("s:") === 0) fn = inState(sc.slice(2));
    if (sc.indexOf("d:") === 0) { var a = sc.slice(2).split("|"); fn = inDiv(a[0], a[1]); }
    return [crumbs([["Home", "home"], ["Leaderboards"]]),
      h("div", { class: "pagehead" }, h("div", { class: "meta" }, h("h1", null, J.season + " Freshman Leaderboards"),
        h("div", { class: "filters" }, h("label", { for: "lead-scope" }, "Show: "), sel, h("span", { class: "unq" }, "Rate stats need 40 AB or 15 IP")))),
      h("h2", { style: "font-size:22px;margin:0 0 10px" }, "Batting"), h("div", { class: "grid", style: "margin-bottom:24px" }, LB.filter(function (d) { return d.src === "bat"; }).map(function (d) { return leaderBox(d, fn, 10); })),
      h("h2", { style: "font-size:22px;margin:0 0 10px" }, "Pitching"), h("div", { class: "grid" }, LB.filter(function (d) { return d.src === "pit"; }).map(function (d) { return leaderBox(d, fn, 10); }))];
  }

  var plUI = { letter: "All", state: "all", role: "all" };
  function pagePlayers() {
    setNav("players"); document.title = "Players | " + SITE;
    var letters = ["All"].concat("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
    var rows = players.filter(function (p) {
      var s = S[p.sid];
      if (plUI.letter !== "All" && lastName(p.name).charAt(0).toUpperCase() !== plUI.letter) return false;
      if (plUI.state !== "all" && s.state !== plUI.state) return false;
      if (plUI.role === "bat" && !B[p.id]) return false;
      if (plUI.role === "pit" && !PI[p.id]) return false;
      return true;
    }).map(function (p) { return { p: p, b: B[p.id], r: PI[p.id] }; });
    var cols = [C.fname, C.school, C.cls, C.pos, C.bt, C.home, C.hs,
      { k: "_role", l: "Role", t: "Batting and/or pitching lines", cls: "l", v: function (r) { return (r.b ? "Bat" : "") + (r.b && r.r ? " / " : "") + (r.r ? "Pitch" : ""); }, asc: true },
      { k: "_line", l: "Line", t: "Key stats", cls: "l", nosort: true, v: function (r) { return (r.b ? r3(r.b.BA) + "/" + r3(r.b.OBP) + "/" + r3(r.b.SLG) : "") + (r.b && r.r ? "; " : "") + (r.r ? f2(r.r.ERA) + " ERA, " + r.r.IP + " IP" : ""); } }];
    cols.forEach(function (c) { if (!c.cell && c.v) c.cell = c.v; });
    return [crumbs([["Home", "home"], ["Players"]]),
      h("div", { class: "pagehead" }, h("div", { class: "meta" }, h("h1", null, "Players"), h("p", { class: "lede" }, players.length + " freshmen. Pick a letter of the last name, or use the search box at the top."),
        h("div", { class: "letters" }, letters.map(function (L) { return h("button", { type: "button", "aria-pressed": plUI.letter === L ? "true" : "false", style: L === "All" ? "width:auto;padding:0 8px" : null, onclick: function () { plUI.letter = L; render(); } }, L); })),
        h("div", { class: "filters" },
          h("label", { for: "pl-state" }, "State "), h("select", { id: "pl-state", onchange: function (e) { plUI.state = e.target.value; render(); } }, [["all", "All"]].concat(STATES.map(function (s) { return [s, s]; })).map(function (o) { return h("option", { value: o[0], selected: plUI.state === o[0] }, o[1]); })),
          h("label", { for: "pl-role" }, "Role "), h("select", { id: "pl-role", onchange: function (e) { plUI.role = e.target.value; render(); } }, [["all", "All"], ["bat", "Hitters"], ["pit", "Pitchers"]].map(function (o) { return h("option", { value: o[0], selected: plUI.role === o[0] }, o[1]); })),
          h("span", { class: "unq" }, rows.length + " shown")))),
      table({ id: "players", title: "Player Index", cols: cols, rows: rows, sort: { k: "_name", dir: 1 }, file: "players" })];
  }

  function pageGlossary() {
    setNav("glossary"); document.title = "Glossary | " + SITE;
    var dl = h("dl", { class: "glossary" });
    BAT.concat(PIT).forEach(function (c) { add(dl, [h("dt", null, c.l), h("dd", null, c.t)]); });
    return [crumbs([["Home", "home"], ["Glossary"]]), h("div", { class: "pagehead" }, h("div", { class: "meta" }, h("h1", null, "Glossary & Methods"))),
      h("div", { class: "grid2" },
        h("section", { class: "infobox" }, h("h3", null, "Freshman composite score"),
          h("ul", null,
            h("li", null, "Each stat is turned into a percentile against every qualified freshman in Michigan, Ohio and Indiana, then weighted and scaled to 0-100."),
            h("li", null, "Hitters (min. 40 AB): OPS 40%, walks per strikeout 25%, ISO 20%, batting average 15%."),
            h("li", null, "Pitchers (min. 15 IP): ERA 35%, innings 25%, strikeouts per 9 IP 20%, walks per 9 IP 12% (fewer is better), BAA 8% (lower is better)."),
            h("li", null, "Ranks within a division, state or all three states sort that same score."))),
        h("section", { class: "infobox" }, h("h3", null, "Data notes"),
          h("ul", null,
            h("li", null, "Freshmen only (FR and redshirt FR), 2025-26 season. Lorain County doesn't publish class, so its first-year players are included as \"1st yr\"."),
            h("li", null, "Rate stats are recomputed from counting stats. BAA* is estimated as H / (H + outs recorded) because at-bats against aren't published."),
            h("li", null, "Stats: NJCAA Region XII and Region 24 stats pages, via The Baseball Cube. Ohio records: OCCAC standings. Divisions: MCCAA and OCCAC."),
            h("li", null, "Roster details (position, B/T, high school, hometown) are filled for Delta, Henry Ford, Jackson and Mid Michigan; elsewhere they're blank until added.")))),
      h("section", { class: "section", style: "margin-top:20px" }, h("div", { class: "sechead" }, h("h2", null, "Stat definitions")), dl)];
  }

  function notFound() { setNav(""); return [h("h1", null, "Page not found"), h("p", null, link("home", "Back to the home page"))]; }

  // ---------- router ----------
  function route() {
    var hsh = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!hsh || hsh === "home") return pageHome();
    if (hsh === "players") return pagePlayers();
    if (hsh === "teams") return pageTeams();
    if (hsh === "leaders") return pageLeaders();
    if (hsh === "rankings") return pageRankings();
    if (hsh === "glossary") return pageGlossary();
    if (hsh.indexOf("p-") === 0) return pagePlayer(hsh.slice(2));
    if (hsh.indexOf("t-") === 0) return pageTeam(hsh.slice(2));
    if (hsh.indexOf("lg-") === 0) return pageLeague(hsh.slice(3));
    if (hsh.indexOf("d-") === 0) return pageDivision(hsh.slice(2));
    return notFound();
  }
  var lastHash = null;
  function render() {
    var y = window.scrollY, same = lastHash === location.hash;
    app.replaceChildren(); add(app, route());
    if (!same) window.scrollTo(0, 0); else window.scrollTo(0, y);
    lastHash = location.hash;
  }
  window.addEventListener("hashchange", render);

  // ---------- search ----------
  var idx = players.map(function (p) { return { t: p.name, s: S[p.sid].name + " · " + p.cls, href: "p-" + p.id, key: p.name.toLowerCase() }; })
    .concat(schools.map(function (s) { return { t: s.name + " " + s.mascot, s: "Team · " + s.state, href: "t-" + s.id, key: (s.name + " " + s.mascot + " " + s.short).toLowerCase() }; }));
  var q = document.getElementById("q"), box = document.getElementById("sugg"), cur = -1, hits = [];
  function showSugg() {
    var v = q.value.trim().toLowerCase();
    if (v.length < 2) { box.hidden = true; return; }
    hits = idx.filter(function (x) { return x.key.indexOf(v) >= 0; }).sort(function (a, b) { return a.key.indexOf(v) - b.key.indexOf(v); }).slice(0, 12);
    cur = hits.length ? 0 : -1;
    box.replaceChildren(); box.hidden = false;
    if (!hits.length) { box.appendChild(h("a", { href: "#players" }, "No matches. Browse the player index", h("small", null, ""))); return; }
    hits.forEach(function (x, i) { box.appendChild(h("a", { href: "#" + x.href, class: i === cur ? "on" : null, onclick: function () { box.hidden = true; q.value = ""; } }, h("span", null, x.t), h("small", null, x.s))); });
  }
  q.addEventListener("input", showSugg);
  q.addEventListener("keydown", function (e) {
    if (box.hidden || !hits.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); cur = (cur + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length; Array.prototype.forEach.call(box.children, function (a, i) { a.classList.toggle("on", i === cur); }); }
    if (e.key === "Enter") { e.preventDefault(); location.hash = hits[Math.max(cur, 0)].href; box.hidden = true; q.value = ""; q.blur(); }
    if (e.key === "Escape") { box.hidden = true; }
  });
  document.getElementById("searchform").addEventListener("submit", function (e) { e.preventDefault(); });
  document.addEventListener("click", function (e) { if (!e.target.closest(".search")) box.hidden = true; });

  document.getElementById("updated").textContent = "Stats through the end of the " + J.season + " season · updated " + J.updated;
  render();
})();

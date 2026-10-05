/* ===== Гипотеза тренажері: қозғалтқыш. Мазмұн tx_kk.js, tx_en.js, data.js ішінде. =====
   Ешқандай дерек сыртқа жіберілмейді. localStorage тек ыңғайлылық үшін (try/catch ішінде). */
const $ = id => document.getElementById(id);
const KEY = "jur401_hyp_trainer_v1";
let LANG = "kk";
let S = {v:{}, pick:{}, tries:{}, checked:{}, score:{}};

function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function load(){
  try{ const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if(s && s.v) S = Object.assign({v:{}, pick:{}, tries:{}, checked:{}, score:{}}, s); }catch(e){}
  try{ const l = localStorage.getItem(KEY + "_lang"); if(l === "en" || l === "kk") LANG = l; }catch(e){}
}
const t = (k, ...a) => { let v = TX[LANG][k]; if(v === undefined) v = TX.kk[k]; if(v === undefined) return "";
  return typeof v === "function" ? v(...a) : v; };
const L = o => o == null ? "" : (typeof o === "string" ? o : (o[LANG] != null ? o[LANG] : o.kk));
const E = (code, part) => { const e = ERR[code]; if(!e) return ""; return L(e[part]); };
const num = v => parseFloat(String(v).replace(/\s/g, "").replace("%", "").replace(",", "."));
function fmt(x, d){ const s = Number(x).toLocaleString(LANG === "kk" ? "ru-RU" : "en-US", {minimumFractionDigits:d, maximumFractionDigits:d});
  return s.replace(/ /g, " "); }
const val = k => (S.v[k] == null ? "" : String(S.v[k])).trim();
function el(tag, cls, html){ const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }

/* ---------- кері байланыс блогы ---------- */
function showFb(box, kind, msg, more, extra){
  box.className = "fb " + kind; box.innerHTML = "";
  const pre = kind === "ok" ? "✓ " : kind === "warn" ? "⚠ " : "✗ ";
  box.appendChild(el("div", null, pre + msg));
  if(extra) box.appendChild(el("div", "extra", extra));
  if(more){ const m = el("div", "more"); m.appendChild(el("b", null, t("more"))); m.appendChild(el("div", null, more)); box.appendChild(m); }
}
function showList(box, kind, head, items, mores){
  box.className = "fb " + kind; box.innerHTML = "";
  box.appendChild(el("div", null, (kind === "ok" ? "✓ " : kind === "warn" ? "⚠ " : "✗ ") + head));
  if(items.length){ const ul = el("ul"); items.forEach(i => ul.appendChild(el("li", null, i))); box.appendChild(ul); }
  if(mores && mores.length){ const m = el("div", "more"); m.appendChild(el("b", null, t("more")));
    mores.forEach(x => m.appendChild(el("p", null, x))); box.appendChild(m); }
}
function bump(key, count){ if(count) S.tries[key] = (S.tries[key] || 0) + 1; return S.tries[key] || 0; }

/* ---------- таңдау жаттығулары (mcq және sort) ---------- */
function optsOf(key, item){ const ex = EX[key]; return ex.cats ? ex.cats : item.opts; }
function renderEx(key){
  const ex = EX[key], box = $("ex_" + key); if(!box) return; box.innerHTML = "";
  ex.items.forEach((it, n) => {
    const d = el("div", "item");
    const q = el("div", "q", (n + 1) + ". " + L(it.q) + (it.sec ? '<span class="sec">' + L(OPTS.sectors.find(s => s.id === it.sec).t) + "</span>" : ""));
    d.appendChild(q);
    const o = el("div", "opts" + (ex.cats ? "" : " col"));
    optsOf(key, it).forEach(op => {
      const lab = el("label"); const r = document.createElement("input");
      r.type = "radio"; r.name = key + "_" + it.id; r.value = op.id;
      const pk = key + "." + it.id;
      if(S.pick[pk] === op.id){ r.checked = true; lab.classList.add("sel"); }
      r.onchange = () => { S.pick[pk] = op.id; save(); o.querySelectorAll("label").forEach(x => x.classList.remove("sel")); lab.classList.add("sel"); updateWs(); };
      lab.appendChild(r); lab.appendChild(el("span", null, L(op.t))); o.appendChild(lab);
    });
    d.appendChild(o);
    const f = el("div", "fb"); f.id = "fb_" + key + "_" + it.id; d.appendChild(f);
    box.appendChild(d);
  });
}
function sortCode(it, pick){
  if(it.ans === "topic") return "topic";
  if(it.ans === "question") return "question";
  if(it.ans === "weak") return pick === "strong" ? it.code : "isclaim";
  return pick === "weak" ? "strongok" : "isclaim";
}
function checkEx(key, count){
  const ex = EX[key]; let ok = 0;
  ex.items.forEach(it => {
    const pk = key + "." + it.id, pick = S.pick[pk], f = $("fb_" + key + "_" + it.id);
    if(!f) return;
    if(!pick){ showFb(f, "bad", t("choose")); return; }
    if(pick === it.ans){ ok++; showFb(f, "ok", L(it.why)); return; }
    const n = bump(pk, count);
    const code = ex.cats ? sortCode(it, pick) : (optsOf(key, it).find(o => o.id === pick) || {}).code;
    showFb(f, "bad", E(code, "h") || t("tryAgain"), n >= 2 ? [L(it.hint2 || it.why), E(code, "m")].filter(Boolean).join(" ") : null);
  });
  S.checked[key] = true; S.score[key] = ok + "/" + ex.items.length; save();
  $("sc_" + key).textContent = t("score", ok, ex.items.length);
  updateWs();
}

/* ---------- 5-қадам: кесте және сан жаттығуы ---------- */
function renderTable(){
  const D = DATA, b = $("t_table"); const yrs = [2016, 2017, 2018, 2019];
  let h = '<table class="ex"><thead><tr><th>' + t("tYear") + "</th><th>" + t("tMD") + "</th><th>" + t("tMP") + "</th><th>" + t("tKD") + "</th><th>" + t("tKP") + "</th></tr></thead><tbody>";
  yrs.forEach(y => { h += "<tr><td>" + y + "</td><td>" + fmt(D.M.d[y], 0) + "</td><td>" + fmt(D.M.p[y], 0) + "</td><td>" + fmt(D.K.d[y], 0) + "</td><td>" + fmt(D.K.p[y], 0) + "</td></tr>"; });
  b.innerHTML = h + "</tbody></table>";
}
function renderNum(){
  const b = $("ex_num"); b.innerHTML = "";
  NUM.forEach((it, n) => {
    const w = el("div", "num");
    const lab = el("label", null, (n + 1) + ". " + L(it.q)); lab.htmlFor = "n_" + it.id;
    const inp = document.createElement("input"); inp.id = "n_" + it.id; inp.inputMode = "decimal"; inp.autocomplete = "off";
    inp.value = S.v["n_" + it.id] || "";
    inp.oninput = () => { S.v["n_" + it.id] = inp.value; save(); };
    const f = el("div", "fb"); f.id = "fb_n_" + it.id;
    w.appendChild(lab); w.appendChild(inp); w.appendChild(f); b.appendChild(w);
  });
}
function checkNum(count){
  let ok = 0;
  NUM.forEach(it => {
    const f = $("fb_n_" + it.id), raw = S.v["n_" + it.id], x = num(raw), key = "n." + it.id;
    if(raw == null || String(raw).trim() === ""){ showFb(f, "bad", t("needNum")); return; }
    if(!isFinite(x)){ showFb(f, "bad", t("needNum")); return; }
    if(x >= it.lo && x <= it.hi){ ok++; showFb(f, "ok", L(it.why)); return; }
    const c = (it.cands || []).find(c => Math.abs(x - c.v) <= (c.tol != null ? c.tol : Math.max(0.011, Math.abs(c.v) * 0.004)));
    if(c && c.ok){ ok++; showFb(f, "warn", E(c.code, "h"), null, L(it.why)); return; }
    const n = bump(key, count), code = c ? c.code : it.gen;
    showFb(f, "bad", E(code, "h"), n >= 2 ? [E(code, "m"), L(it.calc)].filter(Boolean).join(" ") : null);
  });
  S.checked.num = true; S.score.num = ok + "/" + NUM.length; save();
  $("sc_num").textContent = t("score", ok, NUM.length);
  updateWs();
}

/* ---------- 1-қадам: мақала ---------- */
function checkS1(count){
  const iss = [], codes = [];
  if(!val("art_sector")){ iss.push(E("s1sector", "h")); codes.push("s1sector"); }
  if(!/^https?:\/\/[^\s.]+\.[^\s]+/i.test(val("art_link"))){ iss.push(E("s1link", "h")); codes.push("s1link"); }
  if(!/\d/.test(val("art_number"))){ iss.push(E("s1num", "h")); codes.push("s1num"); }
  if(!S.v.art_c1 || !S.v.art_c2 || !S.v.art_c3 || !S.v.art_c4){ iss.push(E("s1chk", "h")); codes.push("s1chk"); }
  if(!S.v.art_c2){ codes.push("s1src"); }
  const f = $("f_s1");
  if(!iss.length){ showFb(f, "ok", t("s1ok")); S.checked.s1 = true; save(); return; }
  const n = bump("s1", count);
  showList(f, "bad", t("fixThese"), iss, n >= 2 ? [...new Set(codes)].map(c => E(c, "m")).filter(Boolean) : null);
  save();
}

/* ---------- 2-қадам: өз датаңыздың төркіні ---------- */
function yearsOf(s){ const m = String(s).match(/(19|20)\d\d/g); return m ? m.map(Number) : []; }
function checkS2(count){
  const iss = [], codes = [], f = $("f_s2"), ty = val("or_type");
  if(!val("or_body")){ iss.push(E("s2body", "h")); codes.push("s2body"); }
  if(!val("or_table")){ iss.push(E("s2table", "h")); codes.push("s2table"); }
  if(yearsOf(val("or_years")).length < 2){ iss.push(E("s2years", "h")); codes.push("s2years"); }
  if(!val("or_level")){ iss.push(E("s2level", "h")); codes.push("s2level"); }
  if(!ty){ iss.push(E("s2type", "h")); codes.push("s2type"); }
  const red = ["press", "article", "person", "pct"].includes(ty);
  if(red){ iss.unshift(E("srcRed", "h")); codes.unshift("srcRed"); }
  if(val("or_primary") === "second"){ iss.push(E("srcSecond", "h")); codes.push("srcSecond"); }
  if(val("or_primary") === "unknown"){ iss.push(E("srcUnknown", "h")); codes.push("srcUnknown"); }
  if(!iss.length){ showFb(f, "ok", ty === "report" ? t("s2okYellow") : t("s2ok")); S.checked.s2 = true; save(); updateWs(); return; }
  const n = bump("s2", count);
  showList(f, red ? "bad" : "warn", red ? t("s2red") : t("fixThese"), iss, n >= 2 ? [...new Set(codes)].map(c => E(c, "m")).filter(Boolean) : null);
  save(); updateWs();
}

/* ---------- 3-қадам: гипотеза құрастырғыш ---------- */
function preview(){
  const g = k => val(k) ? "<b>" + esc(val(k)) + "</b>" : '<span class="gap">[' + t("gap_" + k) + "]</span>";
  const per = (val("b_from") || val("b_to")) ? "<b>" + esc(val("b_from") || "?") + "–" + esc(val("b_to") || "?") + "</b>" : '<span class="gap">[' + t("gap_period") + "]</span>";
  let h = t("previewTpl", per, g("b_where"), g("b_what"), g("b_change"), g("b_cmp"));
  if(val("b_why")) h += " <i>" + t("previewWhy", esc(val("b_why"))) + "</i>";
  $("b_preview").innerHTML = h;
}
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c])); }
function plainPreview(){ return $("b_preview").textContent.replace(/\[[^\]]*\]/g, "...").replace(/\s+/g, " ").trim(); }
const LEVEL_RANK = {country:0, oblast:1, city:2, district:2, inst:3};
function hypIssues(){
  const txt = val("hyp_final"), out = [];
  const add = (code, kind) => out.push({code, kind: kind || "bad"});
  const R = RULES;
  if(!txt){ add("hypEmpty"); return out; }
  if(R.question.test(txt)) add("question");
  if(R.plan.test(txt)) add("plan");
  if(txt.split(/\s+/).length < 6) add("topic");
  const yrs = yearsOf(txt);
  if(yrs.length < 2) add("noperiod");
  if(!val("b_where")) add("noplace");
  if(!R.compare.test(txt) && !val("b_cmp")) add("nocompare");
  if(!val("b_kind")) add("kindmissing");
  else if(val("b_kind") === "count" && (R.compare.test(txt) || val("b_cmp"))) add("absrate", "warn");
  if(!val("b_unit")) add("nounit", "warn");
  if(R.causal.test(txt) || val("b_why")) add("causal", "warn");
  if(R.vague.test(txt)) add("vague", "warn");
  if(R.two.test(txt)) add("twoclaims", "warn");
  const oy = yearsOf(val("or_years"));
  if(yrs.length >= 2 && oy.length >= 2){ const lo = Math.min(...oy), hi = Math.max(...oy);
    if(Math.min(...yrs) < lo || Math.max(...yrs) > hi) add("fitperiod"); }
  const bl = val("b_level"), ol = val("or_level");
  if(bl && ol && LEVEL_RANK[bl] > LEVEL_RANK[ol]) add("fitlevel");
  if(bl && ol && bl !== ol && LEVEL_RANK[bl] === LEVEL_RANK[ol]) add("fitlevel", "warn");
  return out;
}
function checkS3(count){
  const f = $("f_s3"), iss = hypIssues();
  if(!iss.length){ showFb(f, "ok", t("s3ok")); S.checked.s3 = true; save(); updateWs(); return; }
  const hard = iss.filter(i => i.kind === "bad");
  const n = hard.length ? bump("s3", count) : (S.tries.s3 || 0);
  showList(f, hard.length ? "bad" : "warn", hard.length ? t("fixThese") : t("s3warn"),
    iss.map(i => (i.kind === "warn" ? "⚠ " : "") + E(i.code, "h")),
    (n >= 2 || !hard.length) ? iss.map(i => E(i.code, "m")).filter(Boolean) : null);
  save(); updateWs();
}

/* ---------- 4-қадам: өз нөлдік гипотезаңыз ---------- */
function words(s){ return new Set(String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(w => w.length > 3)); }
function overlap(a, b){ const A = words(a), B = words(b); if(!A.size || !B.size) return 0; let n = 0; A.forEach(w => { if(B.has(w)) n++; }); return n / Math.min(A.size, B.size); }
function checkS4(count){
  const f = $("f_s4"), line = val("null_line"), thr = val("null_thr"), iss = [];
  const R = RULES;
  if(!line) iss.push("nullEmpty");
  else{
    if(R.confirm.test(line)) iss.push("nullConfirm");
    else if(!R.falsePhrase.test(line)) iss.push("nullNoFalse");
    if(R.source.test(line) && !/\d/.test(line)) iss.push("nullSource");
    if(val("hyp_final") && overlap(line, val("hyp_final")) > 0.8 && !R.negation.test(line)) iss.push("nullRestate");
  }
  if(!/\d/.test(thr)) iss.push("nullNoThr");
  else if(!/\d/.test(line)) iss.push("nullThrNotInLine");
  if(!val("null_h0")) iss.push("nullNoH0");
  if(!iss.length){ showFb(f, "ok", t("s4ok")); S.checked.s4 = true; save(); updateWs(); return; }
  const n = bump("s4", count);
  showList(f, "bad", t("fixThese"), iss.map(c => E(c, "h")), n >= 2 ? iss.map(c => E(c, "m")).filter(Boolean) : null);
  save(); updateWs();
}

/* ---------- 7-қадам: өз үш сөйлеміңіз ---------- */
function checkS7(count){
  const f = $("f_s7"), R = RULES, iss = [];
  const lead = val("st_lead"), nut = val("st_nut"), src = val("st_src");
  if(!/\d/.test(lead)) iss.push("stLeadNum");
  if(!/\d/.test(nut)) iss.push("stNutNum");
  if(!R.compare.test(nut)) iss.push("stNutCmp");
  if(!R.doubt.test(nut)) iss.push("stNutDoubt");
  if(!R.next.test(nut)) iss.push("stNutNext");
  if(R.causal.test(lead + " " + nut)) iss.push("stCausal");
  if(!R.source.test(src) || yearsOf(src).length < 1) iss.push("stSrc");
  if(!iss.length){ showFb(f, "ok", t("s7ok")); S.checked.s7 = true; save(); updateWs(); return; }
  const n = bump("s7", count);
  showList(f, "bad", t("fixThese"), iss.map(c => E(c, "h")), n >= 2 ? iss.map(c => E(c, "m")).filter(Boolean) : null);
  save(); updateWs();
}

/* ---------- жұмыс парағы ---------- */
function optLabel(list, id){ const o = (OPTS[list] || []).find(x => x.id === id); return o ? L(o.t) : ""; }
function wsText(){
  const W = (k) => val(k) || t("wsEmpty");
  const lines = [];
  const H = s => { lines.push(""); lines.push(s); lines.push("-".repeat(Math.min(60, s.length))); };
  lines.push(t("h1")); lines.push(t("sub"));
  if(val("ws_name")) lines.push(t("ws_nameL") + ": " + val("ws_name"));
  lines.push(t("wsDate") + ": " + new Date().toISOString().slice(0, 10));
  H(t("s1h"));
  lines.push(t("art_sectorL") + ": " + (optLabel("sectors", val("art_sector")) || t("wsEmpty")));
  lines.push(t("art_linkL") + ": " + W("art_link"));
  lines.push(t("art_numberL") + ": " + W("art_number"));
  lines.push(t("wsChecklist") + ": " + [1, 2, 3, 4].map(i => (S.v["art_c" + i] ? "[x] " : "[ ] ") + t("art_c" + i).replace(/<[^>]+>/g, "")).join(" · "));
  H(t("s2h"));
  ["or_body", "or_table", "or_years"].forEach(k => lines.push(t(k + "L") + ": " + W(k)));
  lines.push(t("or_levelL") + ": " + (optLabel("levels", val("or_level")) || t("wsEmpty")));
  lines.push(t("or_typeL") + ": " + (optLabel("srcTypes", val("or_type")) || t("wsEmpty")));
  lines.push(t("or_primaryL") + ": " + (optLabel("primary", val("or_primary")) || t("wsEmpty")));
  H(t("s3h"));
  lines.push(t("wsBuilder") + ": " + plainPreview());
  lines.push(t("b_kindL") + ": " + (optLabel("kinds", val("b_kind")) || t("wsEmpty")) + " · " + t("b_unitL") + ": " + W("b_unit"));
  if(val("b_why")) lines.push(t("b_whyL") + ": " + val("b_why") + " (" + t("wsWhyFlag") + ")");
  lines.push(t("hyp_finalL") + ": " + W("hyp_final"));
  H(t("s4h"));
  lines.push(t("null_lineL") + ": " + W("null_line"));
  lines.push(t("null_thrL") + ": " + W("null_thr"));
  lines.push(t("null_h0L") + ": " + W("null_h0"));
  H(t("s5h"));
  lines.push(t("own_numbersL") + ": " + W("own_numbers"));
  lines.push(t("own_verdictL") + ": " + (optLabel("verdicts", val("own_verdict")) || t("wsEmpty")) + (val("own_verdict_num") ? " · " + val("own_verdict_num") : ""));
  H(t("s6h"));
  lines.push(t("ex_altL") + ": " + W("ex_alt"));
  lines.push(t("ex_data2L") + ": " + W("ex_data2"));
  H(t("s7h"));
  lines.push(t("st_leadL") + ": " + W("st_lead"));
  lines.push(t("st_nutL") + ": " + W("st_nut"));
  lines.push(t("st_srcL") + ": " + W("st_src"));
  H(t("wsScores"));
  ["origin", "sort", "null", "num", "dec", "extra"].forEach(k => lines.push(t("wsEx_" + k) + ": " + (S.score[k] || t("wsNotDone"))));
  lines.push(""); lines.push(t("wsFooter"));
  return lines.join("\n");
}
function updateWs(){ $("ws_out").textContent = wsText(); }
function copyWs(){
  const s = wsText(), f = $("f_ws");
  const done = () => showFb(f, "ok", t("wsCopied"));
  const fallback = () => { const ta = document.createElement("textarea"); ta.value = s; document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); done(); }catch(e){ showFb(f, "bad", t("wsCopyFail")); } ta.remove(); };
  try{ if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(done, fallback); else fallback(); }catch(e){ fallback(); }
}
function dlWs(){
  const blob = new Blob(["﻿" + wsText()], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = t("wsFile") + (val("ws_name") ? "_" + val("ws_name").replace(/[^\p{L}\p{N}]+/gu, "_") : "") + ".txt";
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function clearAll(){
  if(!confirm(t("wsClearQ"))) return;
  S = {v:{}, pick:{}, tries:{}, checked:{}, score:{}}; save(); location.reload();
}

/* ---------- тіл және бастапқы жүктеу ---------- */
function fillSelect(sel, list){
  const cur = S.v[sel.dataset.k] || ""; sel.innerHTML = "";
  const o0 = document.createElement("option"); o0.value = ""; o0.textContent = t("choose"); sel.appendChild(o0);
  list.forEach(x => { const o = document.createElement("option"); o.value = x.id; o.textContent = L(x.t); sel.appendChild(o); });
  sel.value = cur;
}
function applyLang(){
  document.documentElement.lang = LANG === "kk" ? "kk" : "en";
  document.title = t("title");
  document.querySelectorAll("[data-i]").forEach(e => { e.innerHTML = t(e.dataset.i); });
  document.querySelectorAll("[data-ph]").forEach(e => { e.placeholder = t(e.dataset.ph); });
  document.querySelectorAll("select[data-opts]").forEach(s => fillSelect(s, OPTS[s.dataset.opts]));
  fillSelect($("art_sector"), OPTS.sectors);
  $("lkk").classList.toggle("on", LANG === "kk"); $("len").classList.toggle("on", LANG === "en");
  $("nav").innerHTML = TX[LANG].nav.map((n, i) => '<a href="#' + (i < 7 ? "s" + (i + 1) : "ws") + '">' + n + "</a>").join("");
  ["origin", "sort", "null", "dec", "extra"].forEach(renderEx);
  renderTable(); renderNum();
  $("story").innerHTML = L(STORY);
  preview();
  $("s4hyp").textContent = val("hyp_final") ? t("s4yourHyp") + " " + val("hyp_final") : t("s4noHyp");
  // бұрын тексерілген жаттығудың кері байланысын жаңа тілде қайта көрсету (әрекет саны өзгермейді)
  ["origin", "sort", "null", "dec", "extra"].forEach(k => { if(S.checked[k]) checkEx(k, false); else $("sc_" + k).textContent = ""; });
  if(S.checked.num) checkNum(false); else $("sc_num").textContent = "";
  [["s1", checkS1], ["s2", checkS2], ["s3", checkS3], ["s4", checkS4], ["s7", checkS7]].forEach(([k, fn]) => { if(S.tries[k] || S.checked[k]) fn(false); });
  updateWs();
}
function setLang(l){ LANG = l; try{ localStorage.setItem(KEY + "_lang", l); }catch(e){} applyLang(); }

function bindInputs(){
  document.querySelectorAll("[data-k]").forEach(e => {
    const k = e.dataset.k;
    if(e.type === "checkbox"){ e.checked = !!S.v[k]; e.onchange = () => { S.v[k] = e.checked; save(); updateWs(); }; return; }
    if(e.tagName !== "SELECT") e.value = S.v[k] || "";
    const h = () => { S.v[k] = e.value; save(); if(k.startsWith("b_")) preview(); if(k === "hyp_final") $("s4hyp").textContent = t("s4yourHyp") + " " + e.value; updateWs(); };
    e.addEventListener("input", h); e.addEventListener("change", h);
  });
}
function init(){
  load();
  bindInputs();
  $("lkk").onclick = () => setLang("kk"); $("len").onclick = () => setLang("en");
  document.querySelectorAll("[data-check]").forEach(b => b.onclick = () => checkEx(b.dataset.check, true));
  $("b_s1").onclick = () => checkS1(true);
  $("b_s2").onclick = () => checkS2(true);
  $("b_s3").onclick = () => checkS3(true);
  $("b_s4").onclick = () => checkS4(true);
  $("b_s7").onclick = () => checkS7(true);
  $("b_num").onclick = () => checkNum(true);
  $("b_fill").onclick = () => { const p = plainPreview(); if(val("hyp_final") && !confirm(t("fillQ"))) return;
    $("hyp_final").value = p; S.v.hyp_final = p; save(); $("s4hyp").textContent = t("s4yourHyp") + " " + p; updateWs(); };
  $("ws_copy").onclick = copyWs; $("ws_dl").onclick = dlWs; $("ws_clear").onclick = clearAll;
  applyLang();
}
init();

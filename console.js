/* Fractal Console — Reports & Comparisons
   Two-company Monte Carlo duel, derived from The Crucible engine (test build).
   Toy physics, honest structure. Not financial advice. */
(function () {
  "use strict";

  /* ---------- deterministic RNG ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const SEED = 19450716;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- hurdle ladders (5 gates -> SCALE), anchored mid-2026 ---------- */
  const BRANCHES = {
    ph_ic: { eco: "photonics", name: "Photonic Interconnect", gates: [0.95, 0.9, 0.8, 0.75, 0.6], start: 3 },
    ph_c:  { eco: "photonics", name: "Photonic Compute",      gates: [0.7, 0.5, 0.2, 0.4, 0.4],  start: 1 },
    q_sc:  { eco: "quantum",   name: "Superconducting",       gates: [0.9, 0.8, 0.4, 0.4, 0.35], start: 2 },
    q_ion: { eco: "quantum",   name: "Trapped Ion",           gates: [0.9, 0.85, 0.3, 0.4, 0.35], start: 2 },
    q_ph:  { eco: "quantum",   name: "Photonic (modality)",   gates: [0.6, 0.45, 0.45, 0.3, 0.4], start: 1 },
    q_na:  { eco: "quantum",   name: "Neutral Atom",          gates: [0.85, 0.75, 0.35, 0.3, 0.4], start: 2 },
    neuro: { eco: "neuro",     name: "Neuromorphic Edge",     gates: [0.6, 0.7, 0.55, 0.5, 0.45], start: 2 },
  };
  const NEURO_PREDATOR = 0.18;
  const G = 5;

  /* ---------- roster (context notes researched July 2026) ---------- */
  const COMPANIES = [
    { n: "Ayar Labs",      b: "ph_ic", arch: "moon",   note: "$3.75B val · $870M raised (Series E 3/26) · optical I/O for accelerators" },
    { n: "Lightmatter",    b: "ph_ic", b2: "ph_c", arch: "moon", note: "$4.4B val · pivoted to interconnect (Passage M1000 / L200)" },
    { n: "nEye Systems",   b: "ph_ic", arch: "moon",   note: "optical circuit switches · CapitalG/M12/NVDA-backed" },
    { n: "Broadcom",       b: "ph_ic", arch: "inc",    note: "Tomahawk 6 'Davisson' 102.4 Tb/s CPO shipping" },
    { n: "Marvell",        b: "ph_ic", arch: "inc",    note: "absorbed Celestial AI ($3.25B, 2/26)" },
    { n: "NVIDIA (CPO)",   b: "ph_ic", arch: "inc",    note: "Quantum-X Photonics shipping · ~$6.5B photonics push" },
    { n: "TSMC (COUPE)",   b: "ph_ic", arch: "inc",    note: "COUPE co-packaged optics in mass production 4/26" },
    { n: "Coherent",       b: "ph_ic", arch: "shovel", note: "NVDA $2B investment + purchase commitments" },
    { n: "Lumentum",       b: "ph_ic", arch: "shovel", note: "NVDA $2B investment + purchase commitments" },
    { n: "IBM Quantum",    b: "q_sc",  arch: "inc",    note: "advantage target end-2026 · Starling FT 2029" },
    { n: "IonQ",           b: "q_ion", arch: "pub",    note: "cap ~$21B · P/S>100 · Ansys practical-advantage claim (contested)" },
    { n: "Quantinuum",     b: "q_ion", arch: "pub",    note: "NASDAQ:QNT · ~$20B IPO 2026 · 12 logical qubits w/ Microsoft" },
    { n: "Rigetti",        b: "q_sc",  arch: "pub",    note: "cap ~$8B on ~$7M 2025 revenue" },
    { n: "D-Wave",         b: "q_sc",  arch: "pub",    note: "cap ~$10B · annealing niche" },
    { n: "PsiQuantum",     b: "q_ph",  arch: "moon",   note: "$1.3B+ raised · fab path · IPO anticipated" },
    { n: "QuEra",          b: "q_na",  arch: "moon",   note: "Level-2 error-corrected neutral atom" },
    { n: "BrainChip",      b: "neuro", arch: "pub",    note: "Akida in commercial IoT deployment" },
    { n: "Innatera",       b: "neuro", arch: "moon",   note: "sub-mW T1 · consumer debuts at CES 2026" },
    { n: "Intel (Loihi)",  b: "neuro", arch: "inc",    note: "Hala Point — 1.15B neurons" },
  ];
  const ARCH_LABEL = { moon: "Moonshot", shovel: "Shovels", inc: "Incumbent", pub: "Public small-cap" };
  const ECO_ICON = { photonics: "⚡", quantum: "⚛️", neuro: "🧠" };

  /* conditional multipliers from current value, by archetype [low,high] */
  const MULT = {
    moon:   { dom: [8, 25], pros: [2.5, 8], niche: [0.4, 1.2], acq: [1.2, 2.2], zomb: [0.05, 0.3], dead: [0, 0] },
    pub:    { dom: [5, 15], pros: [2, 6],   niche: [0.3, 1],   acq: [1.1, 1.8], zomb: [0.1, 0.4],  dead: [0, 0.1] },
    shovel: { dom: [4, 10], pros: [2, 5],   niche: [0.8, 1.6], acq: [1.2, 2],   zomb: [0.3, 0.6],  dead: [0, 0] },
    inc:    { dom: [2, 4],  pros: [1.3, 2], niche: [0.9, 1.1], acq: [1, 1],     zomb: [0.6, 0.9],  dead: [0.2, 0.5] },
  };
  const PRICED_IN = { "IonQ": 0.5, "Rigetti": 0.5, "D-Wave": 0.5, "Quantinuum": 0.6, "BrainChip": 0.8 };
  const ECO_ADJ = { quantum: 1.4, photonics: 1.0, neuro: 0.7 };

  /* ---------- environment engine: 4 phases 2026 -> 2045 ---------- */
  const PRESETS = {
    all: null,
    best: { econ: "boom", geo: "peace", cap: "flood", ai: "accel" },
    worst: { econ: "crisis", geo: "war", cap: "winter", ai: "deflate" },
    war: { geo: "war" },
    winter: { cap: "winter" },
  };
  const PRESET_LABEL = { all: "All Worlds", best: "Best Case", worst: "Worst Case", war: "War Decade", winter: "Capital Winter" };

  function drawPath(rnd, preset) {
    const ECON = ["boom", "normal", "recession", "crisis"], GEO = ["peace", "tension", "conflict", "war"],
      CAP = ["flood", "normal", "winter"], AI = ["accel", "steady", "plateau", "deflate"];
    const pick = (arr, w) => { let r = rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < arr.length; i++) { if (r < w[i]) return arr[i]; r -= w[i]; } return arr[0]; };
    const phases = []; let e = "normal", g = "tension", c = "normal", a = "accel";
    for (let p = 0; p < 4; p++) {
      e = pick(ECON, e === "boom" ? [.45, .35, .15, .05] : e === "crisis" ? [.1, .35, .35, .2] : [.25, .4, .25, .1]);
      g = pick(GEO, g === "war" ? [.05, .25, .35, .35] : g === "peace" ? [.5, .35, .1, .05] : [.2, .4, .28, .12]);
      c = pick(CAP, c === "winter" ? [.15, .45, .4] : [.28, .5, .22]);
      a = pick(AI, a === "deflate" ? [.1, .25, .3, .35] : [.35, .35, .18, .12]);
      const ph = { econ: e, geo: g, cap: c, ai: a };
      if (preset) Object.assign(ph, preset);
      phases.push(ph);
    }
    return phases;
  }
  function envMod(ph, br) {
    let m = 1;
    if (ph.econ === "boom") m *= 1.1; else if (ph.econ === "recession") m *= 0.9; else if (ph.econ === "crisis") m *= 0.8;
    if (ph.cap === "flood") m *= 1.12; else if (ph.cap === "winter") m *= 0.75;
    if (ph.geo === "conflict" || ph.geo === "war") { if (br.eco === "quantum") m *= 1.15; else if (br.eco === "photonics") m *= 0.9; else m *= 0.95; }
    if (ph.ai === "deflate" && br.name === "Photonic Compute") m *= 0.8;
    if (ph.ai === "accel") m *= 1.07;
    return m;
  }

  /* ---------- outcome logic per archetype ---------- */
  function resolveCompany(c, stage, winters, rnd) {
    const s = Math.max(stage[c.b], c.b2 ? stage[c.b2] : 0);
    const r = rnd();
    if (c.arch === "inc") {
      if (s >= G) return r < 0.25 ? "dom" : "pros";
      if (s >= 3) return "pros";
      return "niche";
    }
    if (c.arch === "shovel") {
      if (s >= 4) return "pros";
      if (s >= 2) return "niche";
      if (r < 0.15) return "dead";
      if (r < 0.4) return "acq";
      return "zomb";
    }
    if (c.arch === "pub") {
      if (s >= G) return r < 0.35 ? "dom" : "pros";
      if (s >= 3) return r < 0.5 ? "pros" : "niche";
      if (s >= 2) return r < 0.4 ? "acq" : "zomb";
      return winters >= 2 && r < 0.5 ? "dead" : (r < 0.5 ? "zomb" : "dead");
    }
    /* moonshot */
    if (s >= G) return r < 0.4 ? "dom" : "pros";
    if (s >= 3) return r < 0.45 ? "pros" : (r < 0.75 ? "acq" : "niche");
    if (s >= 2) return r < 0.45 ? "acq" : (r < 0.7 ? "zomb" : "dead");
    const dieP = 0.55 + winters * 0.15;
    return r < dieP ? "dead" : (r < 0.85 ? "zomb" : "acq");
  }

  const RANK = { dom: 5, pros: 4, niche: 3, acq: 2, zomb: 1, dead: 0 };
  const OUTC = [
    ["dom", "Dominant", "#c9ff20"], ["pros", "Prospered", "#a3e635"], ["niche", "Niche", "rgba(74,222,128,0.55)"],
    ["acq", "Acquired", "#60a5fa"], ["zomb", "Zombie", "#94a3b8"], ["dead", "Dead", "#fb7185"],
  ];

  function runDuel(N, presetKey, A, B) {
    const rnd = mulberry32(SEED);
    const preset = PRESETS[presetKey];
    const bk = Object.keys(BRANCHES);
    const out = { A: zero(), B: zero() };
    let aWins = 0, bWins = 0, ties = 0;
    function zero() { return { dom: 0, pros: 0, niche: 0, acq: 0, zomb: 0, dead: 0 }; }

    for (let w = 0; w < N; w++) {
      const path = drawPath(rnd, preset);
      const stage = {}; bk.forEach(k => { stage[k] = BRANCHES[k].start || 0; });
      let predator = false;
      path.forEach(ph => {
        bk.forEach(k => {
          const br = BRANCHES[k];
          if (stage[k] >= G) return;
          let tries = (ph.econ === "boom" && ph.cap === "flood") ? 2 : 1;
          for (let t = 0; t < tries && stage[k] < G; t++) {
            const p = clamp(br.gates[stage[k]] * envMod(ph, br), 0.02, 0.95);
            if (rnd() < p) stage[k]++;
          }
        });
        let pp = NEURO_PREDATOR;
        if (ph.ai === "deflate") pp = 0.5; if (ph.ai === "accel") pp = 0.12;
        if (!predator && stage.neuro < 3 && rnd() < pp) predator = true;
      });
      if (predator) stage.neuro = Math.min(stage.neuro, 2);

      const winters = path.filter(p => p.cap === "winter").length;
      const oa = resolveCompany(A, stage, winters, rnd);
      const ob = resolveCompany(B, stage, winters, rnd);
      out.A[oa]++; out.B[ob]++;
      if (RANK[oa] > RANK[ob]) aWins++; else if (RANK[ob] > RANK[oa]) bWins++; else ties++;
    }
    return { N, out, aWins, bWins, ties };
  }

  function evFor(c, dist, N) {
    const base = MULT[c.arch];
    const eco = BRANCHES[c.b].eco;
    const adj = (ECO_ADJ[eco] || 1) * (PRICED_IN[c.n] || 1);
    let ev = 0;
    for (const [k] of OUTC) {
      const r = base[k];
      const mid = (r[0] + r[1]) / 2 * ((k === "dom" || k === "pros") ? adj : 1);
      ev += (dist[k] / N) * mid;
    }
    return ev;
  }

  /* ---------- DOM ---------- */
  const $ = id => document.getElementById(id);
  if (!$("duelRun")) return;

  function fillSelect(sel, other) {
    COMPANIES.forEach((c, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = `${ECO_ICON[BRANCHES[c.b].eco]} ${c.n}`;
      sel.appendChild(o);
    });
  }
  const selA = $("duelA"), selB = $("duelB");
  fillSelect(selA); fillSelect(selB);
  selA.value = "5";  /* NVIDIA (CPO) */
  selB.value = "10"; /* IonQ */

  function noteFor(sel) {
    const c = COMPANIES[+sel.value];
    return `${c.n} — ${ARCH_LABEL[c.arch]} · ${BRANCHES[c.b].name}. ${c.note}`;
  }
  function refreshNotes() {
    $("duelNoteA").textContent = noteFor(selA);
    $("duelNoteB").textContent = noteFor(selB);
  }
  selA.addEventListener("change", refreshNotes);
  selB.addEventListener("change", refreshNotes);
  refreshNotes();

  let presetKey = "all";
  document.querySelectorAll(".duel-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".duel-preset").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      presetKey = btn.dataset.p;
    });
  });

  function pct(x, N) { return (x / N * 100); }
  function bar(label, val, N) {
    const p = pct(val, N);
    return `<div class="duel-brow"><span class="bl">${label}</span><span class="btrack"><span class="bfill" style="width:${p}%"></span></span><span class="bv">${p.toFixed(0)}%</span></div>`;
  }
  function distBar(dist, N) {
    return `<div class="duel-dist">` + OUTC.map(([k, , col]) => `<span style="width:${pct(dist[k], N)}%;background:${col}"></span>`).join("") + `</div>`;
  }
  function card(c, dist, N) {
    const survive = N - dist.dead - dist.zomb;
    const prosper = dist.dom + dist.pros;
    const ev = evFor(c, dist, N);
    return `<div class="duel-card">
      <h4>${ECO_ICON[BRANCHES[c.b].eco]} ${c.n}</h4>
      <div class="arch">${ARCH_LABEL[c.arch]} · ${BRANCHES[c.b].name} · EV ${ev.toFixed(1)}× from current value</div>
      ${bar("Survive", survive, N)}
      ${bar("Prosper", prosper, N)}
      ${distBar(dist, N)}
    </div>`;
  }

  $("duelRun").addEventListener("click", () => {
    const btn = $("duelRun");
    btn.disabled = true; btn.textContent = "⚗ Running…";
    setTimeout(() => {
      const N = +$("duelWorlds").value;
      const A = COMPANIES[+selA.value], B = COMPANIES[+selB.value];
      const res = runDuel(N, presetKey, A, B);
      const evA = evFor(A, res.out.A, N), evB = evFor(B, res.out.B, N);
      const survA = pct(N - res.out.A.dead - res.out.A.zomb, N), survB = pct(N - res.out.B.dead - res.out.B.zomb, N);
      const leader = res.aWins === res.bWins ? null : (res.aWins > res.bWins ? A : B);
      const leadPct = pct(Math.max(res.aWins, res.bWins), N);
      $("duelVerdict").innerHTML =
        `${leader ? `<b>${leader.n}</b> out-ranks the other in <span class="pct">${leadPct.toFixed(0)}%</span> of ${N.toLocaleString()} simulated worlds` : `Dead heat across ${N.toLocaleString()} worlds`} (${PRESET_LABEL[presetKey]}, 2026→2045). ` +
        `<b>${A.n}</b> survives ${survA.toFixed(0)}% · EV <span class="pct">${evA.toFixed(1)}×</span> &nbsp;vs&nbsp; <b>${B.n}</b> survives ${survB.toFixed(0)}% · EV <span class="pct">${evB.toFixed(1)}×</span>. ` +
        `${ties(res)}`;
      $("duelCards").innerHTML = card(A, res.out.A, N) + card(B, res.out.B, N);
      $("duelResults").classList.add("on");
      btn.disabled = false; btn.textContent = "⚗ Run Comparison";
    }, 30);
  });
  function ties(res) {
    return `Same outcome tier in ${pct(res.ties, res.N).toFixed(0)}% of worlds.`;
  }

  /* ---------- optional drawer wiring (only when drawer markup exists) ---------- */
  const tab = $("fiConsoleTab"), backdrop = $("fiConsoleBackdrop"), closeBtn = $("fiConsoleClose");
  if (tab && tab.tagName === "BUTTON" && backdrop && closeBtn) {
    function open() { document.body.classList.add("console-open"); tab.setAttribute("aria-expanded", "true"); }
    function close() { document.body.classList.remove("console-open"); tab.setAttribute("aria-expanded", "false"); }
    tab.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }
})();

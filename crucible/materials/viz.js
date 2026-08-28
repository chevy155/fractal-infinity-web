/** Materials Crucible visualizations */

export function renderMomentum(host, fund) {
  const dir = { up: "↑", neutral: "→", down: "↓" };
  host.innerHTML = (fund.momentum || []).map(m => `
    <div class="sm-mom-row">
      <span class="sm-mom-label">${m.label}</span>
      <span class="sm-mom-dir">${dir[m.direction] || "→"}</span>
      <span class="sm-mom-vel">${m.velocity}</span>
      <span class="sm-mono">${Math.round(m.confidence * 100)}%</span>
      <span class="sm-mom-hz">${m.horizon}</span>
    </div>`).join("");
}

export function renderPulse(host, result, fundKey) {
  const co = result[fundKey];
  const leader = result.leader === fundKey;
  host.innerHTML = `
    <div class="sm-pulse-head">
      <h3>${co.ticker}</h3>
      <span class="sm-pill ${leader ? "on" : ""}">${leader ? "Modeled lead" : "Challenger"}</span>
    </div>
    <dl class="sm-pulse-dl">
      <div><dt>Structural score</dt><dd class="sm-mono">${co.score.current.toFixed(2)}</dd></div>
      <div><dt>Sim median</dt><dd class="sm-mono">${co.score.median.toFixed(2)}</dd></div>
      <div><dt>Bull / bear</dt><dd class="sm-mono">${co.score.bull.toFixed(2)} / ${co.score.bear.toFixed(2)}</dd></div>
      <div><dt>Momentum</dt><dd class="sm-mono">${co.avgMomentum.toFixed(2)}</dd></div>
      <div><dt>Energy</dt><dd class="sm-mono">${co.avgEnergy.toFixed(2)}</dd></div>
      <div><dt>Evidence</dt><dd>${co.evidence.level}</dd></div>
      <div><dt>Win share</dt><dd class="sm-mono">${co.winPct}%</dd></div>
    </dl>`;
}

export function renderDriverBars(host, drivers, onClick) {
  host.innerHTML = drivers.slice(0, 5).map(d => `
    <button type="button" class="sm-driver-row" data-id="${d.id}">
      <span>${d.label}</span>
      <span class="sm-driver-track"><i style="width:${d.share}%"></i></span>
      <span class="sm-mono">${d.share}%</span>
      <span class="sm-driver-side">${d.direction}</span>
    </button>`).join("");
  host.querySelectorAll(".sm-driver-row").forEach(btn => {
    btn.addEventListener("click", () => onClick?.(btn.dataset.id));
  });
}

export function renderOutcomes(host, result) {
  const bars = (co, color) => {
    const w = co.winPct;
    return `<div class="sm-out-co"><h4>${co.ticker}</h4>
      <div class="sm-out-bar"><i style="width:${w}%;background:${color}"></i></div>
      <p class="sm-mono">Relative strength ${w}% of worlds · dispersion ${(co.score.dispersion * 100).toFixed(0)} pts</p>
      <p class="sm-muted">Bull ${co.score.bull.toFixed(2)} · Median ${co.score.median.toFixed(2)} · Bear ${co.score.bear.toFixed(2)}</p></div>`;
  };
  host.innerHTML = bars(result.urnm, "#c9ff20") + bars(result.remx, "#38bdf8") +
    `<p class="sm-muted">Ties ${result.tiesPct}%. Scores are structural scenario rankings — not expected returns.</p>`;
}

export function drawDistribution(canvas, result) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(rect.width, 280), h = Math.max(rect.height, 120);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + "px"; canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(3,9,29,0.5)"; ctx.fillRect(0, 0, w, h);
  // approximate density from score percentiles
  const draw = (score, color, y0) => {
    const pts = [score.bear, score.median, score.bull];
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    pts.forEach((p, i) => {
      const x = 30 + p * (w - 50);
      const y = y0 - (i === 1 ? 28 : 12);
      if (i === 0) ctx.moveTo(x, y0); else ctx.lineTo(x, y);
    });
    ctx.lineTo(30 + score.bull * (w - 50), y0);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(30 + score.median * (w - 50), y0 - 28, 5, 0, Math.PI * 2); ctx.fill();
  };
  draw(result.urnm.score, "#c9ff20", h * 0.45);
  draw(result.remx.score, "#38bdf8", h * 0.78);
  ctx.fillStyle = "rgba(243,240,228,0.45)"; ctx.font = "10px monospace";
  ctx.fillText("URNM", 8, h * 0.45); ctx.fillText("REMX", 8, h * 0.78);
  ctx.fillText("bear ← median → bull (structural score)", w / 2 - 80, h - 8);
}

export function renderSensitivityTable(host, drivers) {
  host.innerHTML = `<table class="sm-sens-table"><thead><tr>
    <th>Variable</th><th>Importance</th><th>Favors</th><th>Confidence*</th></tr></thead><tbody>
    ${drivers.slice(0, 5).map(d => `<tr>
      <td>${d.label}</td><td class="sm-mono">${d.share}%</td><td>${d.direction}</td>
      <td class="sm-mono">${Math.round(((d.urnm + d.remx) / 2) * 50 + 50)}%</td></tr>`).join("")}
    </tbody></table>
    <p class="sm-muted">*Confidence proxy from state input strength — not return probability. Flip tests use +15% dimension shocks.</p>`;
}

export function renderThesisBreakers(host, urnm, remx) {
  const block = (title, items) => `<div class="sm-tb-block"><h4>${title}</h4><ul>${items.map(t =>
    `<li>${t.text} <span class="sm-mono">${Math.round(t.confidence * 100)}%</span></li>`).join("")}</ul></div>`;
  host.innerHTML = block("URNM thesis breakers", urnm.thesis_breakers) + block("REMX thesis breakers", remx.thesis_breakers);
}

export function renderWhitePaper(host, paper) {
  const p = paper.page1;
  host.innerHTML = `
    <article class="sm-paper">
      <header class="sm-paper-head">
        <p class="sm-eyebrow">${p.title}</p>
        <h3>${p.subtitle}</h3>
        <p class="sm-mono">DATA CURRENT THROUGH: ${p.dataThrough}</p>
      </header>
      <section><h4>What they are</h4><p>${p.whatTheyAre}</p></section>
      <section><h4>Current state</h4><p>${p.currentState}</p></section>
      <section><h4>Key findings</h4><ol>${p.keyFindings.map(f => `<li>${f}</li>`).join("")}</ol></section>
      <div class="sm-paper-grid">
        <section><h4>URNM</h4>
          <p><strong>Strengths:</strong> ${p.urnm.strengths.join("; ")}</p>
          <p><strong>Weaknesses:</strong> ${p.urnm.weaknesses.join("; ")}</p>
          <p><strong>Best / worst:</strong> ${p.urnm.best} / ${p.urnm.worst}</p>
          <p><strong>Dependencies:</strong> ${p.urnm.dependencies.join("; ")}</p>
          <p><strong>Evidence confidence:</strong> ${p.urnm.confidence}</p>
        </section>
        <section><h4>REMX</h4>
          <p><strong>Strengths:</strong> ${p.remx.strengths.join("; ")}</p>
          <p><strong>Weaknesses:</strong> ${p.remx.weaknesses.join("; ")}</p>
          <p><strong>Best / worst:</strong> ${p.remx.best} / ${p.remx.worst}</p>
          <p><strong>Dependencies:</strong> ${p.remx.dependencies.join("; ")}</p>
          <p><strong>Evidence confidence:</strong> ${p.remx.confidence}</p>
        </section>
      </div>
      <section><h4>Comparative finding</h4><p>${p.comparative}</p></section>
      <section><h4>Scenario matrix</h4>
        <table class="sm-sens-table"><thead><tr><th>World</th><th>Leader</th><th>URNM</th><th>REMX</th></tr></thead>
        <tbody>${(paper.page1.matrix || []).map(m =>
          `<tr><td>${m.world}</td><td>${m.leader}</td><td class="sm-mono">${m.urnmWin}%</td><td class="sm-mono">${m.remxWin}%</td></tr>`).join("")}
        </tbody></table>
      </section>
      <section><h4>Confidence</h4>
        <p>Analytical ${p.confidence.analytical} · Evidence ${p.confidence.evidence} · Model ${p.confidence.model}</p>
        <p class="sm-muted">${p.confidence.note}</p>
      </section>
    </article>
    <article class="sm-paper sm-paper-biblio">
      <h3>Page 2 — Sources and bibliography</h3>
      <p class="sm-muted">${paper.sourcesCount} sources · ${paper.claimsCount} claims · numbered citations map to Page 1.</p>
      <ol class="sm-biblio">${paper.bibliography.map(b =>
        `<li value="${b.n}"><strong>${b.author}</strong>. <em>${b.title}</em>. ${b.publisher}, ${b.date}.
         <a href="${b.url}" target="_blank" rel="noopener">URL</a>. Accessed ${b.accessed}. (Tier ${b.tier})</li>`).join("")}
      </ol>
    </article>`;
}

export function createParticleField(canvas, { reducedMotion = false } = {}) {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  let particles = [];
  let running = false;
  let animId = null;

  function dims() {
    const r = canvas.getBoundingClientRect();
    return { w: Math.max(r.width, 200), h: Math.max(r.height, 120) };
  }

  function spawn(n, leader) {
    const { w, h } = dims();
    particles = Array.from({ length: Math.min(n, 120) }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 2.2,
      vy: (Math.random() - 0.5) * 1.4,
      r: 1.5 + Math.random() * 2.5,
      side: i % 2 === 0 ? "urnm" : "remx",
      life: 1
    }));
    // bias toward leader color cluster
    if (leader === "urnm") particles.forEach((p, i) => { if (i % 3) p.side = "urnm"; });
    if (leader === "remx") particles.forEach((p, i) => { if (i % 3) p.side = "remx"; });
  }

  function frame() {
    const { w, h } = dims();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "rgba(3,9,29,0.35)";
    ctx.fillRect(0, 0, w, h);
    // constraint bands
    ctx.strokeStyle = "rgba(243,240,228,0.08)";
    ctx.strokeRect(w * 0.15, h * 0.2, w * 0.7, h * 0.6);
    ctx.fillStyle = "rgba(243,240,228,0.25)"; ctx.font = "9px monospace";
    ctx.fillText("constraint field", w * 0.15 + 6, h * 0.2 + 12);
    for (const p of particles) {
      if (!reducedMotion) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        // soft constraint bounce
        if (p.x > w * 0.15 && p.x < w * 0.85 && p.y > h * 0.2 && p.y < h * 0.8) {
          p.vx *= 0.995; p.vy *= 0.995;
        }
      }
      ctx.fillStyle = p.side === "urnm" ? "rgba(201,255,32,0.85)" : "rgba(56,189,248,0.85)";
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    if (running && !reducedMotion) animId = requestAnimationFrame(frame);
  }

  return {
    run(n, leader) {
      spawn(Math.min(80, Math.max(24, Math.round(n / 150))), leader);
      running = true;
      if (animId) cancelAnimationFrame(animId);
      frame();
      if (!reducedMotion) {
        setTimeout(() => { running = false; }, 2800);
      }
    },
    render: frame
  };
}

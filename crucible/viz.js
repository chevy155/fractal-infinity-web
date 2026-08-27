import { buildStateVector, computeDynamics, leadershipScore } from "./engine/dynamics.js";

function dims(canvas) {
  const r = canvas.getBoundingClientRect();
  return { w: Math.max(r.width, 200), h: Math.max(r.height, 160) };
}

const DRIVER_ROWS = [
  { key: "commercial_momentum", label: "Commercial momentum" },
  { key: "manufacturing_readiness", label: "Packaging integration" },
  { key: "capital_resilience", label: "Capital resilience" },
  { key: "technology_maturity", label: "Technology readiness" }
];

export function renderDriverVectors(host, ayar, lightmatter, onClick) {
  const sa = buildStateVector(ayar);
  const sl = buildStateVector(lightmatter);
  host.innerHTML = `<table class="cr-dv-table"><thead><tr><th></th><th>Ayar</th><th></th><th>Lightmatter</th></tr></thead><tbody>
    ${DRIVER_ROWS.map(r => {
      const a = sa[r.key], l = sl[r.key];
      const arrow = a > l ? "←" : a < l ? "→" : "↔";
      const leader = a >= l ? "ayar" : "lightmatter";
      return `<tr class="cr-dv-row" data-key="${r.key}" data-side="${leader}">
        <td>${r.label}</td>
        <td class="cr-mono">${a.toFixed(2)}</td>
        <td class="cr-dv-arrow">${arrow}</td>
        <td class="cr-mono">${l.toFixed(2)}</td></tr>`;
    }).join("")}
  </tbody></table>`;
  host.querySelectorAll(".cr-dv-row").forEach(row => {
    row.addEventListener("click", () => onClick?.(row.dataset.key, row.dataset.side));
  });
}

export function drawDriverSurface(canvas, ayar, lightmatter) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const { w, h } = dims(canvas);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + "px"; canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(3,9,29,0.5)"; ctx.fillRect(0, 0, w, h);

  const sa = buildStateVector(ayar);
  const sl = buildStateVector(lightmatter);
  const capA = sa.capital_resilience;
  const capL = sl.capital_resilience;
  const grid = 16;
  const pad = 28;

  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      const comm = i / (grid - 1);
      const pkg = j / (grid - 1);
      const stateA = { ...sa, commercial_momentum: comm, manufacturing_readiness: pkg, capital_resilience: capA };
      const stateL = { ...sl, commercial_momentum: comm, manufacturing_readiness: pkg, capital_resilience: capL };
      const margin = leadershipScore(stateA, computeDynamics(ayar, stateA)) -
        leadershipScore(stateL, computeDynamics(lightmatter, stateL));
      const px = pad + (w - pad * 2) * i / (grid - 1);
      const py = h - pad - (h - pad * 2) * j / (grid - 1);
      ctx.fillStyle = margin > 0.02 ? `rgba(201,255,32,${Math.min(0.55, margin * 2)})` :
        margin < -0.02 ? `rgba(167,139,250,${Math.min(0.55, -margin * 2)})` : "rgba(243,240,228,0.04)";
      ctx.fillRect(px - 4, py - 4, 8, 8);
    }
  }

  const plot = (state, color, label) => {
    const px = pad + (w - pad * 2) * state.commercial_momentum;
    const py = h - pad - (h - pad * 2) * state.manufacturing_readiness;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f3f0e4"; ctx.font = "10px sans-serif"; ctx.fillText(label, px + 10, py + 4);
  };
  plot(sa, "#c9ff20", "Ayar");
  plot(sl, "#a78bfa", "LM");
  ctx.fillStyle = "rgba(243,240,228,0.45)"; ctx.font = "9px monospace";
  ctx.fillText("Commercial →", pad, 14);
  ctx.fillText("Packaging ↑", 8, h / 2);
}

export function renderOutcomes(host, ayarOut, lmOut, ayarName, lmName) {
  const tiers = [
    ["leadership", "Leadership"], ["scale", "Scale"], ["niche", "Niche"],
    ["acquisition", "Acquisition"], ["failure", "Failure"]
  ];
  const block = (name, out) => {
    const res = out.outcomes;
    const surv = res.survival || 0;
    const stack = tiers.map(([k, l]) => `<div class="cr-out-tier"><span>${l}</span><span class="cr-mono">${res[k] || 0}%</span></div>`).join("");
    const bar = tiers.map(([k]) => `<i style="width:${res[k] || 0}%;background:${k === "failure" ? "#fb7185" : "var(--lime)"}"></i>`).join("");
    return `<div class="cr-out-block"><h4>${name}</h4><p class="cr-out-res">Resilience (energy): <span class="cr-mono">${surv}%</span></p>
      <div class="cr-out-stack">${bar}</div>${stack}</div>`;
  };
  host.innerHTML = block(ayarName, ayarOut) + block(lmName, lmOut);
}

export function renderSensitivityFlow(host, flips) {
  const flip = flips.find(f => f.flipped);
  if (!flip) {
    host.innerHTML = `<div class="cr-flip-flow"><div class="cr-flip-step">Current state</div><div class="cr-flip-arrow">↓</div>
      <div class="cr-flip-step dim">No +15% single-dimension shift flips leader</div><p class="cr-sens-note">Sensitivity tests — not predictions.</p></div>`;
    return;
  }
  const pct = Math.round(flip.delta * 100);
  host.innerHTML = `<div class="cr-flip-flow">
    <div class="cr-flip-step">Current state</div><div class="cr-flip-arrow">↓</div>
    <div class="cr-flip-step">${flip.company}: ${flip.dimension} +${pct}%</div><div class="cr-flip-arrow">↓</div>
    <div class="cr-flip-step">Decision boundary</div><div class="cr-flip-arrow">↓</div>
    <div class="cr-flip-step highlight">${flip.company.split(" ")[0]} leads</div>
    <p class="cr-sens-note">Sensitivity tests — not predictions.</p></div>`;
}

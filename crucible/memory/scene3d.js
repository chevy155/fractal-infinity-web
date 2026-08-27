/** Canvas 3D state-space with 2D isometric fallback */
const COLORS = {
  sk_hynix: { core: "#c9ff20", halo: "rgba(201,255,32,0.25)", trail: "rgba(201,255,32,0.35)", short: "SK hynix" },
  micron: { core: "#60a5fa", halo: "rgba(96,165,250,0.25)", trail: "rgba(96,165,250,0.35)", short: "Micron" },
  samsung: { core: "#a78bfa", halo: "rgba(167,139,250,0.25)", trail: "rgba(167,139,250,0.35)", short: "Samsung" }
};

function dims(canvas) {
  const rect = canvas.getBoundingClientRect();
  let w = rect.width, h = rect.height;
  if (w < 10 || h < 10) {
    const parent = canvas.parentElement;
    if (parent) {
      w = parent.clientWidth || 400;
      h = parseInt(getComputedStyle(canvas).minHeight, 10) || 320;
    }
  }
  return { w: Math.max(w, 200), h: Math.max(h, 200) };
}

export function createScene3D(canvas, { reducedMotion = false, fallbackEl = null } = {}) {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if (fallbackEl) fallbackEl.hidden = false;
    return { setCompanies: () => {}, resetView: () => {}, render: () => {}, select: () => {} };
  }

  let rotY = 0.6, rotX = 0.35, zoom = 1;
  let dragging = false, lastX = 0, lastY = 0;
  let companies = [];
  let selectedId = null;
  let pulseT = 0;
  let trails = {};
  let useFallback = false;

  function project(x, y, z, w, h) {
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    const scale = (Math.min(w, h) * 0.38 / (z2 + 2.2)) * zoom;
    return { px: w / 2 + x1 * scale, py: h / 2 - y1 * scale, depth: z2 };
  }

  function drawFallback2D(w, h) {
    if (!fallbackEl) return;
    fallbackEl.hidden = false;
    canvas.style.display = "none";
    const svg = fallbackEl.querySelector("svg") || document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.innerHTML = "";
    fallbackEl.innerHTML = "";
    fallbackEl.appendChild(svg);

    const iso = (x, y, z) => ({
      px: w * 0.28 + (x - z) * w * 0.28,
      py: h * 0.62 - y * h * 0.42 + (x + z) * h * 0.12
    });

    for (const co of companies) {
      const p = iso(co.coords.x - 0.5, co.coords.y - 0.5, co.coords.z - 0.5);
      const col = COLORS[co.id] || COLORS.sk_hynix;
      const r = 8 + co.dynamics.mass * 14;
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", p.px); c.setAttribute("cy", p.py); c.setAttribute("r", r);
      c.setAttribute("fill", col.core); c.setAttribute("opacity", "0.9");
      svg.appendChild(c);
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", p.px); t.setAttribute("y", p.py + r + 12);
      t.setAttribute("fill", "#f3f0e4"); t.setAttribute("font-size", "11");
      t.setAttribute("text-anchor", "middle");
      t.textContent = col.short;
      svg.appendChild(t);
    }
  }

  function render() {
    const { w, h } = dims(canvas);
    if (useFallback || !ctx) {
      drawFallback2D(w, h);
      return;
    }
    canvas.style.display = "block";
    if (fallbackEl) fallbackEl.hidden = true;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(3,9,29,0.55)";
    ctx.fillRect(0, 0, w, h);

    const o = project(0, 0, 0, w, h);
    ctx.strokeStyle = "rgba(243,240,228,0.15)";
    ctx.lineWidth = 1;
    for (const [ax, label] of [[[0.85, 0, 0], "Commercial"], [[0, 0.85, 0], "Technology"], [[0, 0, 0.85], "Manufacturing"]]) {
      const p = project(ax[0], ax[1], ax[2], w, h);
      ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(p.px, p.py); ctx.stroke();
      ctx.fillStyle = "rgba(243,240,228,0.5)";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillText(label, p.px + 4, p.py + 4);
    }

    if (!companies.length) {
      ctx.fillStyle = "rgba(243,240,228,0.4)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Adjust forces or run simulation", w / 2, h / 2);
      return;
    }

    const sorted = [...companies].sort((a, b) =>
      project(a.coords.x - 0.5, a.coords.y - 0.5, a.coords.z - 0.5, w, h).depth -
      project(b.coords.x - 0.5, b.coords.y - 0.5, b.coords.z - 0.5, w, h).depth);

    for (const co of sorted) {
      const cx = co.coords.x - 0.5, cy = co.coords.y - 0.5, cz = co.coords.z - 0.5;
      const p = project(cx, cy, cz, w, h);
      const col = COLORS[co.id] || COLORS.sk_hynix;
      const r = 10 + co.dynamics.mass * 20;
      const pulse = reducedMotion ? 1 : 1 + Math.sin(pulseT * 3 + co.dynamics.velocity * 6) * 0.07 * co.dynamics.velocity;

      if (!trails[co.id]) trails[co.id] = [];
      trails[co.id].push({ px: p.px, py: p.py });
      const trailLen = Math.round(co.dynamics.momentum * 10);
      if (trails[co.id].length > trailLen) trails[co.id] = trails[co.id].slice(-trailLen);

      ctx.strokeStyle = col.trail;
      ctx.lineWidth = 2;
      ctx.beginPath();
      trails[co.id].forEach((t, i) => { if (i === 0) ctx.moveTo(t.px, t.py); else ctx.lineTo(t.px, t.py); });
      ctx.stroke();

      const haloR = r * (1.35 + (co.evidence.level === "HIGH" ? 0.5 : co.evidence.level === "MEDIUM" ? 0.3 : 0.15));
      const grd = ctx.createRadialGradient(p.px, p.py, r * 0.2, p.px, p.py, haloR);
      grd.addColorStop(0, col.halo);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(p.px, p.py, haloR, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = col.core;
      ctx.beginPath(); ctx.arc(p.px, p.py, r * pulse, 0, Math.PI * 2); ctx.fill();
      if (selectedId === co.id) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); }

      ctx.fillStyle = "#f3f0e4";
      ctx.font = "11px Space Grotesk, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(col.short, p.px, p.py + r + 14);
      co._hit = { px: p.px, py: p.py, r: r + 8 };
    }
    pulseT += reducedMotion ? 0 : 0.04;
  }

  function setCompanies(data) {
    companies = data || [];
    render();
  }

  function resetView() {
    rotY = 0.6; rotX = 0.35; zoom = 1; trails = {}; render();
  }

  canvas.addEventListener("mousedown", e => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = "grabbing"; });
  window.addEventListener("mouseup", () => { dragging = false; canvas.style.cursor = "grab"; });
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    rotY += (e.clientX - lastX) * 0.008;
    rotX += (e.clientY - lastY) * 0.008;
    rotX = Math.max(-1.2, Math.min(1.2, rotX));
    lastX = e.clientX; lastY = e.clientY;
    render();
  });
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    zoom = Math.max(0.6, Math.min(1.8, zoom - e.deltaY * 0.001));
    render();
  }, { passive: false });

  const ro = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(() => render())
    : null;
  ro?.observe(canvas.parentElement || canvas);

  window.addEventListener("resize", () => render());

  let animId = null;
  if (!reducedMotion) {
    const loop = () => { render(); animId = requestAnimationFrame(loop); };
    animId = requestAnimationFrame(loop);
  } else {
    render();
  }

  try { render(); } catch { useFallback = true; render(); }

  return {
    setCompanies, resetView, render,
    select: id => { selectedId = id; render(); },
    destroy: () => { if (animId) cancelAnimationFrame(animId); ro?.disconnect(); }
  };
}

export function drawTrajectoryChart(canvas, trajectory, selectedYear) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const { w, h } = dims(canvas);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(3,9,29,0.4)";
  ctx.fillRect(0, 0, w, h);
  if (!trajectory?.length) return;

  const colors = { sk_hynix: "#c9ff20", micron: "#60a5fa", samsung: "#a78bfa" };
  const names = { sk_hynix: "SK hynix", micron: "Micron", samsung: "Samsung" };
  const ids = trajectory[0].companies.map(c => c.id);

  for (const id of ids) {
    ctx.strokeStyle = colors[id];
    ctx.lineWidth = id === "sk_hynix" ? 2.5 : 2;
    ctx.beginPath();
    trajectory.forEach((pt, i) => {
      const co = pt.companies.find(c => c.id === id);
      const x = 36 + (w - 52) * i / (trajectory.length - 1);
      const y = h - 24 - co.score * (h - 40);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    const last = trajectory[trajectory.length - 1].companies.find(c => c.id === id);
    ctx.fillStyle = colors[id];
    ctx.font = "10px sans-serif";
    ctx.fillText(names[id], 36 + (w - 52) - 42, h - 24 - last.score * (h - 40) - 6);
  }

  trajectory.forEach((pt, i) => {
    const x = 36 + (w - 52) * i / (trajectory.length - 1);
    ctx.fillStyle = pt.year === selectedYear ? "#fff" : "rgba(243,240,228,0.45)";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(String(pt.year), x, h - 6);
    if (pt.year === selectedYear) {
      ctx.strokeStyle = "rgba(243,240,228,0.25)";
      ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, h - 16); ctx.stroke();
    }
  });
}

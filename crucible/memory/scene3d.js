/** Lightweight canvas 3D state-space — no external deps */
const COLORS = {
  sk_hynix: { core: "#c9ff20", halo: "rgba(201,255,32,0.25)", trail: "rgba(201,255,32,0.35)" },
  micron: { core: "#60a5fa", halo: "rgba(96,165,250,0.25)", trail: "rgba(96,165,250,0.35)" },
  samsung: { core: "#a78bfa", halo: "rgba(167,139,250,0.25)", trail: "rgba(167,139,250,0.35)" }
};

export function createScene3D(canvas, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext("2d");
  let rotY = 0.6, rotX = 0.35, zoom = 1;
  let dragging = false, lastX = 0, lastY = 0;
  let companies = [];
  let selectedId = null;
  let pulseT = 0;
  let trails = {};

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function project(x, y, z, w, h) {
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;
    let y1 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;
    const scale = (120 / (z2 + 2.2)) * zoom;
    return { px: w / 2 + x1 * scale, py: h / 2 - y1 * scale, depth: z2, scale };
  }

  function drawAxes(w, h) {
    ctx.strokeStyle = "rgba(243,240,228,0.12)";
    ctx.lineWidth = 1;
    const o = project(0, 0, 0, w, h);
    for (const [ax, label] of [[[0.9, 0, 0], "Commercial"], [[0, 0.9, 0], "Technology"], [[0, 0, 0.9], "Manufacturing"]]) {
      const p = project(ax[0], ax[1], ax[2], w, h);
      ctx.beginPath();
      ctx.moveTo(o.px, o.py);
      ctx.lineTo(p.px, p.py);
      ctx.stroke();
      ctx.fillStyle = "rgba(243,240,228,0.45)";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillText(label, p.px + 4, p.py + 4);
    }
  }

  function confAlpha(level) {
    return level === "HIGH" ? 0.55 : level === "MEDIUM" ? 0.35 : 0.18;
  }

  function render() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(3,9,29,0.3)";
    ctx.fillRect(0, 0, w, h);
    drawAxes(w, h);

    const sorted = [...companies].sort((a, b) => {
      const da = project(a.coords.x - 0.5, a.coords.y - 0.5, a.coords.z - 0.5, w, h).depth;
      const db = project(b.coords.x - 0.5, b.coords.y - 0.5, b.coords.z - 0.5, w, h).depth;
      return da - db;
    });

    for (const co of sorted) {
      const cx = co.coords.x - 0.5, cy = co.coords.y - 0.5, cz = co.coords.z - 0.5;
      const p = project(cx, cy, cz, w, h);
      const col = COLORS[co.id] || COLORS.sk_hynix;
      const r = 10 + co.dynamics.mass * 22;
      const pulse = reducedMotion ? 1 : 1 + Math.sin(pulseT * 3 + co.dynamics.velocity * 6) * 0.08 * co.dynamics.velocity;

      if (!trails[co.id]) trails[co.id] = [];
      trails[co.id].push({ px: p.px, py: p.py });
      const trailLen = Math.round(co.dynamics.momentum * 12);
      if (trails[co.id].length > trailLen) trails[co.id] = trails[co.id].slice(-trailLen);

      ctx.strokeStyle = col.trail;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < trails[co.id].length; i++) {
        const t = trails[co.id][i];
        if (i === 0) ctx.moveTo(t.px, t.py);
        else ctx.lineTo(t.px, t.py);
      }
      ctx.stroke();

      const haloR = r * (1.4 + confAlpha(co.evidence.level));
      const grd = ctx.createRadialGradient(p.px, p.py, r * 0.2, p.px, p.py, haloR);
      grd.addColorStop(0, col.halo);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.px, p.py, haloR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = col.core;
      ctx.beginPath();
      ctx.arc(p.px, p.py, r * pulse, 0, Math.PI * 2);
      ctx.fill();
      if (selectedId === co.id) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = "#f3f0e4";
      ctx.font = "11px Space Grotesk, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(co.name.split(" ")[0], p.px, p.py + r + 14);
      co._hit = { px: p.px, py: p.py, r: r + 8 };
    }
    pulseT += reducedMotion ? 0 : 0.04;
  }

  function setCompanies(data) {
    companies = data;
    render();
  }

  function resetView() {
    rotY = 0.6; rotX = 0.35; zoom = 1;
    trails = {};
    render();
  }

  function pick(mx, my) {
    for (const co of companies) {
      if (!co._hit) continue;
      const dx = mx - co._hit.px, dy = my - co._hit.py;
      if (dx * dx + dy * dy <= co._hit.r * co._hit.r) return co.id;
    }
    return null;
  }

  canvas.addEventListener("mousedown", e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener("mouseup", () => { dragging = false; });
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
  canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const id = pick(e.clientX - rect.left, e.clientY - rect.top);
    if (id) { selectedId = id; render(); }
  });

  resize();
  window.addEventListener("resize", resize);
  let animId = null;
  if (!reducedMotion) {
    const loop = () => { render(); animId = requestAnimationFrame(loop); };
    animId = requestAnimationFrame(loop);
  }

  return {
    setCompanies, resetView, render, getSelected: () => selectedId,
    select: id => { selectedId = id; render(); },
    destroy: () => { if (animId) cancelAnimationFrame(animId); }
  };
}

export function drawTrajectoryChart(canvas, trajectory, selectedYear) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rect.width, h = rect.height;
  ctx.clearRect(0, 0, w, h);
  if (!trajectory?.length) return;

  const years = trajectory.map(t => t.year);
  const ids = trajectory[0].companies.map(c => c.id);
  const colors = { sk_hynix: "#c9ff20", micron: "#60a5fa", samsung: "#a78bfa" };

  for (const id of ids) {
    ctx.strokeStyle = colors[id];
    ctx.lineWidth = id === "sk_hynix" ? 2.5 : 2;
    ctx.beginPath();
    trajectory.forEach((pt, i) => {
      const co = pt.companies.find(c => c.id === id);
      const x = 40 + (w - 60) * i / (years.length - 1);
      const y = h - 30 - co.score * (h - 50);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  trajectory.forEach((pt, i) => {
    const x = 40 + (w - 60) * i / (years.length - 1);
    ctx.fillStyle = pt.year === selectedYear ? "#fff" : "rgba(243,240,228,0.5)";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(String(pt.year), x, h - 8);
    if (pt.year === selectedYear) {
      ctx.strokeStyle = "rgba(243,240,228,0.3)";
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x, h - 22);
      ctx.stroke();
    }
  });
}

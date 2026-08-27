const PRESET_LABELS = {
  all: "All Worlds", ai_supercycle: "AI Super-Cycle", hbm_shortage: "HBM Shortage",
  hbm4_transition: "HBM4 Transition", packaging_crisis: "Packaging Crisis", price_war: "Price War",
  nvidia_diversifies: "NVIDIA Diversifies", china_korea_shock: "China / Korea Shock",
  inference_explosion: "Inference Explosion", memory_wall: "Memory Wall"
};

function pctWords(winPct) {
  if (winPct >= 95) return "nearly all modeled worlds";
  if (winPct >= 75) return `~${winPct}% of modeled worlds`;
  if (winPct >= 55) return `a majority of modeled worlds (~${winPct}%)`;
  return `~${winPct}% of modeled worlds`;
}

function stabilityLabel(flipAnalysis) {
  const flipped = flipAnalysis?.flips?.some(f => f.flipped);
  if (flipped) return "LOW — a +15% state-dimension shift can flip the leader";
  return "HIGH — no +15% single-state change flips the leader";
}

export function buildExecutiveRead(result, flipAnalysis, collapsed, preset) {
  const leader = result.leaderName || "No clear leader";
  const winPct = result.leaderPct;
  const d1 = collapsed.top[0]?.label || "Execution momentum";
  const d2 = collapsed.top[1]?.label || "Customer qualification";
  const d3 = collapsed.top[2]?.label || "HBM readiness";
  const cum = collapsed.top[2]?.cumulative || collapsed.top[collapsed.top.length - 1]?.cumulative || 80;
  const flipped = flipAnalysis?.flips?.some(f => f.flipped);
  const conf = result.companies.some(c => c.evidence.level === "LOW") ? "LOW" :
    result.companies.every(c => c.evidence.level === "HIGH") ? "HIGH" : "MEDIUM";

  const micron = result.companies.find(c => c.id === "micron");
  const samsung = result.companies.find(c => c.id === "samsung");

  let scenarioNote = "";
  if (result.presetKey === "nvidia_diversifies") {
    scenarioNote = " Customer diversification weakens concentration advantages but does not fully offset qualification and execution gaps.";
  } else if (result.presetKey === "hbm4_transition") {
    scenarioNote = " HBM4 qualification timing materially reshapes relative advantage in this scenario.";
  } else if (result.presetKey === "price_war") {
    scenarioNote = " Pricing pressure compresses margins but does not eliminate structural qualification differences.";
  }

  let challenger = "";
  if (micron && result.leaderId !== "micron") challenger += " Micron benefits most if HBM4 readiness and customer qualification accelerate.";
  if (samsung && result.leaderId !== "samsung") challenger += " Samsung retains manufacturing-scale optionality if qualification strength improves.";

  const stability = flipped
    ? "A modeled +15% state-dimension shift can change the strategic leader."
    : "At current state assumptions, no single +15% dimension shift changes the leader.";

  const confNote = conf === "HIGH"
    ? "Evidence confidence is HIGH on core inputs."
    : conf === "LOW"
      ? "Evidence confidence is LOW — important inputs rely on analyst assumptions."
      : "Evidence confidence is MEDIUM because company facts are sourced while future-state weights remain analyst assumptions.";

  return `${leader} remains the strategic leader under ${preset}, leading in ${pctWords(winPct)}.${scenarioNote} The advantage is driven primarily by ${d1.toLowerCase()}, ${d2.toLowerCase()}, and ${d3.toLowerCase()}, which together explain roughly ${cum}% of the modeled competitive margin.${challenger} ${stability} ${confNote}`.slice(0, 680);
}

export function buildWorldSummary(result, flipAnalysis, collapsed) {
  const preset = PRESET_LABELS[result.presetKey] || result.presetKey;
  const leader = result.leaderName || "No clear leader";
  const winPct = result.leaderPct;
  const confLevels = result.companies.map(c => c.evidence.level);
  const evidenceConfidence = confLevels.includes("LOW") ? "LOW" :
    confLevels.every(l => l === "HIGH") ? "HIGH" : "MEDIUM";
  const flipped = flipAnalysis?.flips?.some(f => f.flipped);
  const executive = buildExecutiveRead(result, flipAnalysis, collapsed, preset);
  const flip = flipped
    ? `A +15% state-dimension improvement can flip the strategic leader.`
    : "At current assumptions, no single +15% state-dimension shift changes the strategic leader.";

  return { preset, leader, winPct, evidenceConfidence, stability: stabilityLabel(flipAnalysis), executive, why: executive, flip };
}

export function yearSummary(trajPoint, collapsed) {
  const leader = trajPoint.leader;
  const topCo = trajPoint.companies.find(c => c.name === leader);
  const driver = collapsed.top[0]?.label || "Execution momentum";
  const biggest = Object.entries(topCo.state).sort((a, b) => b[1] - a[1])[0];
  const dim = biggest[0].replace(/_/g, " ");
  return {
    year: trajPoint.year,
    leader,
    driver,
    stateChange: dim,
    confidence: topCo.evidence.level,
    text: `${leader} remains ahead. Primary driver: ${driver.toLowerCase()}. Largest state: ${dim}.`
  };
}

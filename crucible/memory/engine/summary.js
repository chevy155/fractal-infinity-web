const PRESET_LABELS = {
  all: "All Worlds",
  ai_supercycle: "AI Super-Cycle",
  hbm_shortage: "HBM Shortage",
  hbm4_transition: "HBM4 Transition",
  packaging_crisis: "Packaging Crisis",
  price_war: "Price War",
  nvidia_diversifies: "NVIDIA Diversifies",
  china_korea_shock: "China / Korea Shock",
  inference_explosion: "Inference Explosion",
  memory_wall: "Memory Wall"
};

export function buildWorldSummary(result, flipAnalysis, collapsed) {
  const preset = PRESET_LABELS[result.presetKey] || result.presetKey;
  const leader = result.leaderName || "No clear leader";
  const winPct = result.leaderPct;
  const topDriver = collapsed.top[0]?.label || "HBM readiness";

  let why = `${leader} leads this world because ${topDriver.toLowerCase()} and ${(collapsed.top[1]?.label || "customer qualification").toLowerCase()} outweigh rivals in the modeled HBM competitive margin.`;
  if (result.presetKey === "hbm4_transition") {
    why = `${leader} leads the HBM4 transition because qualification timing, next-gen readiness, and ramp quality outweigh manufacturing breadth alone.`;
  } else if (result.presetKey === "hbm_shortage") {
    why = `${leader} leads under supply constraint because existing HBM scale and customer qualification convert fastest into deployable volume.`;
  } else if (result.presetKey === "nvidia_diversifies") {
    why = `${leader} leads as customers diversify suppliers — qualification breadth and execution velocity matter more than incumbency alone.`;
  } else if (result.presetKey === "price_war") {
    why = `${leader} leads despite pricing pressure because cost structure, yield, and capital resilience preserve strategic position.`;
  } else if (result.presetKey === "china_korea_shock") {
    why = `${leader} leads under geopolitical stress because supply flexibility and geographic resilience offset production concentration.`;
  }
  why = why.slice(0, 420);

  const changed = [];
  if (result.presetKey === "hbm4_transition") changed.push("HBM4 readiness gained weight", "Qualification strength became decisive", "Manufacturing scale mattered less than ramp quality");
  else if (result.presetKey === "packaging_crisis") changed.push("Packaging strength became dominant", "Advanced packaging capacity constrained upside", "Yield/ramp quality separated paths");
  else if (result.presetKey === "price_war") changed.push("Pricing power lost weight", "Capital resilience moderated downside", "Manufacturing scale protected share");
  else if (result.presetKey === "hbm_shortage") changed.push("Production scale became decisive", "Customer qualification locked in share", "Supply flexibility reduced tail risk");
  else changed.push("Customer qualification led", "HBM readiness separated paths", "Manufacturing scale moderated outcomes");

  const topFlip = flipAnalysis?.flips?.[0];
  let flipText = "Result is stable within modeled state-dimension bands at current evidence levels.";
  if (topFlip) {
    const label = (topFlip.dimension || topFlip.variable || "input").toLowerCase();
    const pct = Math.round(topFlip.delta * 100);
    if (topFlip.flipped) {
      flipText = `If ${topFlip.company} ${label} improves ~${pct}%, the model moves to near parity or flips the strategic leader.`;
    } else if (Math.abs(topFlip.marginShift) >= 10) {
      flipText = `${topFlip.company} ${label} +${pct}% narrows the modeled margin materially without full reversal.`;
    }
  }

  const confLevels = result.companies.map(c => c.evidence.level);
  const evidenceConfidence = confLevels.includes("LOW") ? "LOW" :
    confLevels.every(l => l === "HIGH") ? "HIGH" : "MEDIUM";

  return { preset, leader, winPct, why, changed: changed.slice(0, 3), flip: flipText, evidenceConfidence };
}

export function yearSummary(trajPoint, collapsed) {
  const leader = trajPoint.leader;
  const topCo = trajPoint.companies.find(c => c.name === leader);
  const driver = collapsed.top[0]?.label || "HBM readiness";
  const biggest = Object.entries(topCo.state)
    .sort((a, b) => b[1] - a[1])[0];
  return {
    year: trajPoint.year,
    leader,
    text: `${leader} leads in ${trajPoint.year}. ${driver} remains the strongest driver. Biggest state: ${biggest[0].replace(/_/g, " ")} at ${(biggest[1] * 100).toFixed(0)}%.`,
    confidence: topCo.evidence.level,
    driver
  };
}

import { dominantDrivers } from "./sensitivity.js";

const PRESET_LABELS = {
  all: "All Worlds",
  ai_supercycle: "AI Super-Cycle",
  capital_winter: "Capital Winter",
  packaging_bottleneck: "Packaging Bottleneck",
  optical_breakout: "Optical Breakout",
  optical_delay: "Optical Delay",
  supply_shock: "Supply Shock"
};

const SCENARIO_CHANGE = {
  capital_winter: "Capital resilience and manufacturing depth gained weight while long-horizon technology upside mattered less.",
  packaging_bottleneck: "Manufacturing and packaging access became the dominant separator at scale.",
  optical_breakout: "Accelerated optical adoption amplified qualification progress and hyperscaler ecosystem pull.",
  optical_delay: "Delayed adoption compressed upside; near-term deployability mattered more than bandwidth claims.",
  ai_supercycle: "Sustained AI infrastructure demand increased the value of accelerator-interface positioning and ecosystem pull.",
  supply_shock: "Geo and supply-chain stress tested packaging partner redundancy and manufacturing readiness.",
  all: "Commercial momentum and ecosystem strength led; manufacturing readiness separated paths at scale."
};

function winnerName(key, ayar, lightmatter) {
  if (key === "ayar") return ayar.name;
  if (key === "lightmatter") return lightmatter.name;
  return "No clear leader";
}

function challengerName(leaderKey, ayar, lightmatter) {
  return leaderKey === "ayar" ? lightmatter.name : ayar.name;
}

function pctWords(winPct) {
  if (winPct >= 95) return "nearly all simulated worlds";
  if (winPct >= 75) return `~${winPct}% of simulated worlds`;
  if (winPct >= 55) return `a majority of simulated worlds (~${winPct}%)`;
  return `~${winPct}% of simulated worlds`;
}

function stabilityLabel(flipAnalysis) {
  const flipped = flipAnalysis?.flips?.some(f => f.flipped);
  if (flipped) return "LOW";
  const near = flipAnalysis?.flips?.some(f => Math.abs(f.marginShift) >= 15);
  return near ? "MODERATE" : "HIGH";
}

function combinedConfidence(result) {
  const { ayar, lightmatter } = result;
  if (ayar.evidence.level === "LOW" || lightmatter.evidence.level === "LOW") return "LOW";
  if (ayar.evidence.level === "HIGH" && lightmatter.evidence.level === "HIGH") return "HIGH";
  return "MEDIUM";
}

export function buildExecutiveRead(result, ayar, lightmatter, flipAnalysis, collapsed, preset) {
  const leader = winnerName(result.leader, ayar, lightmatter);
  const challenger = challengerName(result.leader, ayar, lightmatter);
  const winPct = result.leaderPct;
  const d1 = collapsed.top[0]?.label || "Commercial momentum";
  const d2 = collapsed.top[1]?.label || "Packaging integration";
  const d3 = collapsed.top[2]?.label || "Capital resilience";
  const flipped = flipAnalysis?.flips?.find(f => f.flipped);
  const conf = combinedConfidence(result);
  const scenarioNote = SCENARIO_CHANGE[result.presetKey] || SCENARIO_CHANGE.all;

  let flipNote = `${challenger} remains highly competitive`;
  if (flipped) {
    flipNote = `${flipped.company} can flip the result if ${flipped.dimension.toLowerCase()} improves ~${Math.round(flipped.delta * 100)}%.`;
  } else {
    const near = flipAnalysis?.flips?.[0];
    if (near && Math.abs(near.marginShift) >= 10) {
      flipNote = `${near.company} can narrow the gap if ${near.dimension.toLowerCase()} improves materially.`;
    } else {
      flipNote = `${challenger} can flip the result if commercial-momentum state improves materially.`;
    }
  }

  const confNote = conf === "HIGH"
    ? "Evidence confidence is HIGH on core company facts."
    : conf === "LOW"
      ? "Evidence confidence is LOW because important inputs rely on analyst assumptions."
      : "Evidence confidence is MEDIUM because core company facts are sourced, while future-state sensitivities and transition weights still contain analyst inference.";

  return `${leader} remains the modeled leader under the ${preset} scenario, leading in ${pctWords(winPct)}. The result is driven primarily by ${d1.toLowerCase()}, ${d2.toLowerCase()}, and ${d3.toLowerCase()}. ${scenarioNote} ${flipNote} ${confNote}`.slice(0, 720);
}

export function yearSummary(trajPoint, collapsed, prevPoint) {
  const leader = trajPoint.leader;
  const topCo = trajPoint[trajPoint.leaderId];
  const challengerId = trajPoint.leaderId === "ayar" ? "lightmatter" : "ayar";
  const driver = collapsed.top[0]?.label || "Commercial momentum";
  let largest = "Commercial momentum";
  let delta = 0;
  if (prevPoint) {
    const prev = prevPoint[trajPoint.leaderId].state;
    const cur = topCo.state;
    let bestK = "commercial_momentum", bestD = 0;
    for (const k of Object.keys(cur)) {
      const d = cur[k] - prev[k];
      if (Math.abs(d) > Math.abs(bestD)) { bestD = d; bestK = k; }
    }
    largest = bestK.replace(/_/g, " ");
    delta = Math.round(bestD * 100);
  }
  const gapNote = trajPoint.leaderId === "lightmatter"
    ? "Lightmatter remains ahead due to ecosystem strength."
    : "Ayar closes the gap as commercial momentum improves.";
  return {
    year: trajPoint.year,
    leader,
    driver,
    stateChange: `${largest}${delta ? ` ${delta >= 0 ? "+" : ""}${delta}%` : ""}`,
    confidence: topCo.evidence.level,
    text: `${trajPoint.year}: ${gapNote} ${driver} is the primary driver. Largest shift: ${largest}${delta ? ` ${delta >= 0 ? "+" : ""}${delta}%` : ""}. Evidence: ${topCo.evidence.level}.`
  };
}

export function buildWorldSummary(result, ayar, lightmatter, flipAnalysis, collapsed) {
  const preset = PRESET_LABELS[result.presetKey] || result.presetKey;
  const winner = winnerName(result.leader, ayar, lightmatter);
  const winPct = result.leaderPct;
  const drivers = dominantDrivers(result, ayar, lightmatter);
  let why = "";

  if (result.presetKey === "capital_winter") {
    why = `Under ${preset}, Lightmatter often gains relative advantage when packaging/OSAT depth and commercial momentum offset financing pressure. Ayar remains technically competitive, but higher disclosed capital intensity increases delay and acquisition-path sensitivity. ${winner} leads in ~${winPct}% of worlds.`;
  } else if (result.presetKey === "packaging_bottleneck") {
    why = `Under ${preset}, manufacturing and packaging access dominate. ${winner} leads in ~${winPct}% of worlds where OSAT/foundry depth converts into deployable interconnect capacity faster.`;
  } else if (result.presetKey === "optical_breakout") {
    why = `Under ${preset}, rapid optical adoption rewards qualification progress and hyperscaler ecosystem alignment. ${winner} leads in ~${winPct}% of worlds as scale-up bandwidth demand converts to commercial momentum.`;
  } else if (result.presetKey === "optical_delay") {
    why = `Under ${preset}, delayed optical adoption compresses upside for both companies; ${winner} leads in ~${winPct}% of worlds by preserving execution quality and near-term deployability.`;
  } else if (result.presetKey === "ai_supercycle") {
    why = `Under ${preset}, sustained AI infrastructure demand amplifies ecosystem pull and commercial momentum. ${winner} leads in ~${winPct}% of worlds where accelerator-interface positioning converts to qualification progress.`;
  } else if (result.presetKey === "supply_shock") {
    why = `Under ${preset}, geo/manufacturing stress tests supply-chain depth. ${winner} leads in ~${winPct}% of worlds with stronger packaging partner redundancy and manufacturing readiness.`;
  } else {
    why = `Across ${result.N.toLocaleString()} balanced worlds, ${winner} leads in ~${winPct}% of simulations. Outcomes hinge on ${drivers.slice(0, 3).join(", ").toLowerCase()} rather than headline valuation alone.`;
  }

  const changed = [];
  if (result.presetKey === "capital_winter") changed.push("Capital resilience gained weight", "Manufacturing readiness moderated upside", "Technology upside mattered less than execution");
  else if (result.presetKey === "packaging_bottleneck") changed.push("Manufacturing readiness became dominant", "Yield/scaling risk gained weight", "Commercial momentum depended on packaging access");
  else if (result.presetKey === "optical_breakout") changed.push("Optical adoption accelerated payoff", "Hyperscaler buy-in gained weight", "Qualification timing became decisive");
  else if (result.presetKey === "optical_delay") changed.push("Market timing penalized long-horizon bets", "Near-term deployability gained weight", "Bandwidth claims mattered less than integration");
  else changed.push("Commercial momentum and ecosystem strength led", "Manufacturing readiness separated paths", "Capital resilience moderated tail risk");

  const topFlip = flipAnalysis?.flips?.[0];
  let flip = "Result is stable within modeled variable bands; no single ±15% input change reverses the majority outcome in sensitivity pass.";
  if (topFlip) {
    const flipLabel = (topFlip.variable || topFlip.dimension || "input").toLowerCase();
    const shift = topFlip.leadershipDelta ?? topFlip.marginShift ?? 0;
    if (topFlip.flipped) {
      flip = `Result flips if ${topFlip.company} ${flipLabel} improves ~${Math.round(topFlip.delta * 100)}% (leadership probability shift ~${shift > 0 ? "+" : ""}${Math.round(shift)} pts).`;
    } else {
      flip = `Largest sensitivity: ${topFlip.company} ${flipLabel} +${Math.round(topFlip.delta * 100)}% shifts leadership probability ~${shift > 0 ? "+" : ""}${Math.round(shift)} pts without full reversal.`;
    }
  }
  if (flipAnalysis?.scenarioFlips?.[0]) {
    flip += ` ${flipAnalysis.scenarioFlips[0].condition} would materially alter relative advantage.`;
  }

  const evidenceConfidence = {
    ayar: result.ayar.evidence.level,
    lightmatter: result.lightmatter.evidence.level
  };
  const executive = collapsed
    ? buildExecutiveRead(result, ayar, lightmatter, flipAnalysis, collapsed, preset)
    : why;

  return {
    preset,
    winner,
    winPct,
    why: why.slice(0, 420),
    changed: changed.slice(0, 3),
    flip: flip.slice(0, 280),
    evidenceConfidence,
    combinedConfidence: combinedConfidence(result),
    stability: stabilityLabel(flipAnalysis),
    executive
  };
}

export function formatSummaryText(summary) {
  return `EXECUTIVE READ\n\n${summary.executive || summary.why}\n\nFLIP CONDITION\n\n${summary.flip}`;
}

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

function winnerName(key, ayar, lightmatter) {
  if (key === "ayar") return ayar.name;
  if (key === "lightmatter") return lightmatter.name;
  return "No clear leader";
}

export function buildWorldSummary(result, ayar, lightmatter, flipAnalysis) {
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
  if (topFlip?.flipped) {
    flip = `Result flips if ${topFlip.company} ${topFlip.variable.toLowerCase()} improves ~${Math.round(topFlip.delta * 100)}% (leadership probability shift ~${topFlip.leadershipDelta > 0 ? "+" : ""}${topFlip.leadershipDelta} pts).`;
  } else if (topFlip) {
    flip = `Largest sensitivity: ${topFlip.company} ${topFlip.variable.toLowerCase()} +${Math.round(topFlip.delta * 100)}% shifts leadership probability ~${topFlip.leadershipDelta > 0 ? "+" : ""}${topFlip.leadershipDelta} pts without full reversal.`;
  }
  if (flipAnalysis?.scenarioFlips?.[0]) {
    flip += ` ${flipAnalysis.scenarioFlips[0].condition} would materially alter relative advantage.`;
  }

  return {
    preset,
    winner,
    why: why.slice(0, 420),
    changed: changed.slice(0, 3),
    flip: flip.slice(0, 280),
    evidenceConfidence: {
      ayar: result.ayar.evidence.level,
      lightmatter: result.lightmatter.evidence.level
    }
  };
}

export function formatSummaryText(summary) {
  return `WORLD SUMMARY\n\nWinner:\n${summary.winner}\n\nWhy:\n${summary.why}\n\nWHAT CHANGED\n\n${summary.changed.map(c => "- " + c).join("\n")}\n\nFLIP CONDITION\n\n${summary.flip}`;
}

const PRESET_LABELS = {
  all: "All Worlds",
  ai_infrastructure_boom: "AI Infrastructure Boom",
  us_china_trade_war: "U.S.–China Trade War",
  global_recession: "Global Recession",
  nuclear_renaissance: "Nuclear Renaissance",
  peace_dividend: "Peace Dividend",
  resource_nationalism: "Resource Nationalism",
  china_ree_shock: "China Rare-Earth Shock",
  uranium_supply_shock: "Uranium Supply Shock",
  commodity_capex_boom: "Commodity Capex Boom",
  tech_acceleration: "Technological Acceleration"
};

const SCENARIO_NOTE = {
  ai_infrastructure_boom: "AI/data-center power demand raises nuclear baseload interest and robotics/automation offtake, lifting both funds with URNM more sensitive to reactor contracting and REMX to magnet demand.",
  us_china_trade_war: "Trade restrictions amplify REMX geopolitical leverage and China-holding mixed transmission while URNM is relatively insulated except via broader risk appetite.",
  global_recession: "Industrial demand and capital availability compress both baskets; REMX faces lithium/EV cyclicality while URNM retains partial structural nuclear demand.",
  nuclear_renaissance: "Reactor approvals and midstream bottlenecks strengthen URNM structural scarcity thesis.",
  peace_dividend: "Lower defense spend and trade détente reduce REMX geopolitics premium; URNM depends more on civil nuclear execution.",
  resource_nationalism: "Export controls and production shocks raise scarcity for both, with jurisdiction-specific transmission.",
  china_ree_shock: "Severe rare-earth export controls dominate REMX outcomes via scarcity and policy support for ex-China capacity.",
  uranium_supply_shock: "Mine or enrichment disruption dominates URNM via scarcity and price transmission.",
  commodity_capex_boom: "Aggressive mine investment eventually moderates scarcity; near-term equities may still benefit from incentive pricing.",
  tech_acceleration: "Simultaneous AI, robotics, EV, defense, and nuclear acceleration raises both structural-demand profiles.",
  all: "Balanced sampling across interconnected demand, supply, geopolitics, and capital-market forces."
};

function pctWords(p) {
  if (p >= 95) return "nearly all simulated worlds";
  if (p >= 75) return `~${p}% of simulated worlds`;
  if (p >= 55) return `a majority of simulated worlds (~${p}%)`;
  return `~${p}% of simulated worlds`;
}

function combinedConf(result) {
  const levels = [result.urnm.evidence.level, result.remx.evidence.level];
  if (levels.includes("LOW")) return "LOW";
  if (levels.every(l => l === "HIGH")) return "HIGH";
  return "MEDIUM";
}

function stability(flips) {
  if (flips?.some(f => f.flipped)) return "LOW";
  if (flips?.some(f => Math.abs(f.marginShift) >= 15)) return "MODERATE";
  return "HIGH";
}

export function buildExecutiveRead(result, urnm, remx, flipAnalysis, topDrivers, presetKey) {
  const preset = PRESET_LABELS[presetKey] || presetKey;
  const leader = result.leader === "urnm" ? "URNM" : result.leader === "remx" ? "REMX" : "Neither fund";
  const challenger = result.leader === "urnm" ? "REMX" : "URNM";
  const d1 = topDrivers[0]?.label || "Structural demand";
  const d2 = topDrivers[1]?.label || "Supply scarcity";
  const d3 = topDrivers[2]?.label || "Geopolitical leverage";
  const conf = combinedConf(result);
  const note = SCENARIO_NOTE[presetKey] || SCENARIO_NOTE.all;
  const flip = flipAnalysis?.flips?.find(f => f.flipped);
  const flipNote = flip
    ? `${flip.company} can flip modeled leadership if ${flip.dimension.toLowerCase()} improves ~15%.`
    : `${challenger} remains competitive; leadership is most sensitive to shifts in ${d1.toLowerCase()} and ${d2.toLowerCase()}.`;
  const confNote = conf === "MEDIUM"
    ? "Evidence confidence is MEDIUM: fund structure and agency facts are sourced, while transmission weights, feedback lags, and future-state shocks include explicit analyst assumptions."
    : conf === "HIGH"
      ? "Evidence confidence is HIGH on core structural inputs."
      : "Evidence confidence is LOW where key drivers rely on sparse or conflicting evidence.";

  return `${leader} shows the stronger modeled structural profile under the ${preset} scenario, leading in ${pctWords(result.leaderPct)}. The result is driven primarily by ${d1.toLowerCase()}, ${d2.toLowerCase()}, and ${d3.toLowerCase()}. ${note} ${flipNote} This is a conditional scenario ranking — not a price forecast. ${confNote}`;
}

export function buildWorldSummary(result, urnm, remx, flipAnalysis, attribution) {
  const presetKey = result.presetKey;
  const preset = PRESET_LABELS[presetKey] || presetKey;
  const top = attribution.top || attribution.drivers?.slice(0, 5) || [];
  const executive = buildExecutiveRead(result, urnm, remx, flipAnalysis, top, presetKey);
  const leaderName = result.leader === "urnm" ? urnm.name : result.leader === "remx" ? remx.name : "No clear leader";
  return {
    preset,
    presetKey,
    winner: leaderName,
    leaderTicker: result.leader === "tie" ? "TIE" : result.leader.toUpperCase(),
    winPct: result.leaderPct,
    executive,
    why: executive,
    evidenceConfidence: combinedConf(result),
    stability: stability(flipAnalysis?.flips),
    topDrivers: top,
    flip: flipAnalysis?.flips?.[0]
      ? `${flipAnalysis.flips[0].company} ${flipAnalysis.flips[0].dimension} +15% → margin shift ~${Math.round(flipAnalysis.flips[0].marginShift)} pts${flipAnalysis.flips[0].flipped ? " (leadership flip)" : ""}`
      : "No single +15% state-dimension shift flips leadership in this sensitivity pass."
  };
}

export function buildScenarioMatrix(scenarios, urnm, remx, runSim) {
  const keys = [
    "ai_infrastructure_boom", "us_china_trade_war", "global_recession",
    "nuclear_renaissance", "peace_dividend", "resource_nationalism"
  ];
  return keys.map(k => {
    const r = runSim({ urnm, remx, scenarios, presetKey: k, worldCount: 800 });
    return {
      world: PRESET_LABELS[k],
      leader: r.leader === "tie" ? "Tie" : r.leader.toUpperCase(),
      urnmWin: r.urnm.winPct,
      remxWin: r.remx.winPct,
      note: SCENARIO_NOTE[k].slice(0, 120) + "…"
    };
  });
}

/** Deterministic two-page executive white paper (no runtime AI). */

export function buildWhitePaper({ result, summary, urnm, remx, sources, claims, flipAnalysis, matrix }) {
  const conf = summary.evidenceConfidence;
  const modelConf = summary.stability === "HIGH" ? "MODERATE–HIGH" : summary.stability === "MODERATE" ? "MODERATE" : "LOW–MODERATE";

  const cite = (ids) => ids.map(id => {
    const i = sources.sources.findIndex(s => s.id === id);
    return i >= 0 ? `[${i + 1}]` : "";
  }).filter(Boolean).join("");

  const page1 = {
    title: "FRACTAL INFINITY",
    subtitle: "Strategic Materials Crucible — URNM × REMX",
    dataThrough: "2026-08-28",
    whatTheyAre: `URNM (Sprott Uranium Miners ETF) provides concentrated equity exposure to uranium miners and includes a material physical-uranium trust holding.${cite(["S01", "S03"])} REMX (VanEck Rare Earth and Strategic Metals ETF) tracks companies producing, refining, and recycling rare earths and strategic metals — including material lithium exposure — and is not a pure rare-earth vehicle.${cite(["S05", "S06"])}`,
    currentState: `Nuclear buildout remains active (~80 reactors under construction) while uranium long-term coverage gaps into the 2030s are widely discussed.${cite(["S09", "S14"])} Rare-earth supply chains remain China-concentrated; April 2025 medium/heavy REE export controls remain in force, with expanded October 2025 measures suspended until November 2026.${cite(["S11", "S12"])}`,
    keyFindings: [
      `${summary.leaderTicker} leads in ~${result.leaderPct}% of modeled worlds under ${summary.preset}.`,
      `Dominant modeled drivers: ${(summary.topDrivers || []).slice(0, 3).map(d => d.label).join(", ") || "structural demand / scarcity / geopolitics"}.`,
      "URNM transmits uranium scarcity more cleanly; REMX mixes REE geopolitics with lithium cyclicality and China A-share exposure.",
      "Supply response lags (mines, enrichment, REE separation) are first-class constraints — demand alone does not clear markets.",
      "Conclusions are conditional scenario rankings with explicit confidence bounds — not buy/sell recommendations."
    ],
    urnm: {
      strengths: ["High uranium purity including physical trust exposure", "Structural nuclear demand + contracting gap narrative", "Clear commodity transmission to equities"],
      weaknesses: ["High holdings concentration", "Developer execution risk", "Sensitive to faster-than-expected supply response"],
      best: "Nuclear Renaissance / Uranium Supply Shock / AI Infrastructure Boom (nuclear path)",
      worst: "Commodity Capex Boom that closes scarcity + Global Recession risk-off",
      dependencies: ["Reactor delivery", "Mine/midstream timelines", "Utility contracting"],
      confidence: result.urnm.evidence.level
    },
    remx: {
      strengths: ["Geopolitical leverage via China export regime", "Magnet demand stack (EV/robotics/defense)", "Ex-China capacity optionality (Lynas, MP)"],
      weaknesses: ["Diluted rare-earth purity (lithium/other metals)", "China holdings create mixed transmission", "Processing lead times"],
      best: "China Rare-Earth Shock / U.S.–China Trade War / Technological Acceleration",
      worst: "Peace Dividend / export normalization + lithium oversupply",
      dependencies: ["Export-control path after Nov 2026", "Ex-China separation success", "Magnet demand"],
      confidence: result.remx.evidence.level
    },
    comparative: `URNM exhibits the stronger modeled structural-demand purity under sustained nuclear expansion, but its advantage deteriorates if uranium supply and midstream capacity respond faster than project timelines imply. REMX exhibits stronger geopolitical convexity under Chinese export stress, but greater execution and commodity-mix risk. REMX is more geopolitically sensitive; URNM is more midstream/mine-constraint sensitive. Ranking flips most readily on geopolitical leverage (REMX) and structural demand / supply scarcity (URNM).`,
    matrix,
    confidence: {
      analytical: conf,
      evidence: conf,
      model: modelConf,
      note: "Confidence measures support for the modeled thesis given available evidence — not the probability of positive ETF returns."
    },
    citationsUsed: ["S01", "S03", "S05", "S06", "S09", "S11", "S12", "S14"]
  };

  const bibliography = sources.sources.map((s, i) => ({
    n: i + 1,
    id: s.id,
    author: s.author,
    title: s.title,
    publisher: s.publisher,
    date: s.date,
    url: s.url,
    accessed: s.retrieved,
    tier: s.tier
  }));

  return { page1, bibliography, claimsCount: claims.count, sourcesCount: sources.count };
}

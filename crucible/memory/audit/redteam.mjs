import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { computeDriverAttribution, collapsedDrivers, analystPriorShare } from "../engine/drivers.js";
import { runSimulation, DEFAULT_SLIDERS } from "../engine/simulator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = f => JSON.parse(readFileSync(join(__dirname, "..", "data", f), "utf8"));
const companies = [load("sk-hynix.json"), load("micron.json"), load("samsung.json")];
const tech = load("technology.json");
const scenarios = load("scenarios.json");
const sources = load("sources.json");

const rawVars = companies.reduce((s, c) => s + c.variable_count, 0) + tech.count;
const attr = computeDriverAttribution(companies);
const collapsed = collapsedDrivers(attr);
const prior = analystPriorShare(companies);
const res = runSimulation({ companies, tech, scenarios, presetKey: "all", worldCount: 1000, sliders: DEFAULT_SLIDERS });

console.log(JSON.stringify({
  raw_variables: rawVars,
  state_dimensions: 15,
  effective_drivers: collapsed.rows.length,
  top_driver_share: collapsed.top[0]?.share,
  top3_cumulative: collapsed.top[2]?.cumulative,
  defensible_lineages: sources.defensible_independent_lineages,
  analyst_prior_pct: prior,
  leader: res.leaderName,
  leader_pct: res.leaderPct,
  sk_wins: res.companies[0].winPct,
  micron_wins: res.companies[1].winPct,
  samsung_wins: res.companies[2].winPct
}, null, 2));

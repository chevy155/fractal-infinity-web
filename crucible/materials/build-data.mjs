/**
 * Build URNM × REMX research database from curated evidence ledger.
 * Run: node crucible/materials/build-data.mjs
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = (name, obj) => {
  writeFileSync(join(__dirname, "data", name), JSON.stringify(obj, null, 2));
  console.log("wrote", name);
};

const RETRIEVED = "2026-08-28";
const DATA_CURRENT = "2026-08-28T19:00:00Z";

const sources = [
  { id: "S01", author: "Sprott Asset Management", title: "URNM — Sprott Uranium Miners ETF (fund page / holdings)", publisher: "Sprott", date: "2026-08", url: "https://sprottetfs.com/urnm-sprott-uranium-miners-etf/", type: "fund_document", tier: 1, lineage: "sprott-urnm" },
  { id: "S02", author: "Sprott Asset Management", title: "Sprott Uranium Miners ETFs Q2 2026 Investor Presentation", publisher: "Sprott", date: "2026-06-30", url: "https://sprottetfs.com/media/b2flgozw/sprott-uranium-miners-etf-presentation.pdf", type: "fund_document", tier: 1, lineage: "sprott-urnm" },
  { id: "S03", author: "Morningstar", title: "URNM – Sprott Uranium Miners ETF Quote / Holdings", publisher: "Morningstar", date: "2026-08-27", url: "https://www.morningstar.com/etfs/arcx/urnm/quote", type: "market_data", tier: 2, lineage: "urnm-holdings" },
  { id: "S04", author: "Yahoo Finance", title: "URNM Stock Quote History", publisher: "Yahoo Finance", date: "2026-08-26", url: "https://finance.yahoo.com/quote/URNM/", type: "market_data", tier: 2, lineage: "urnm-market" },
  { id: "S05", author: "Van Eck Associates", title: "REMX — VanEck Rare Earth and Strategic Metals ETF", publisher: "VanEck", date: "2026-08-26", url: "https://www.vaneck.com/us/en/investments/rare-earth-strategic-metals-etf-remx", type: "fund_document", tier: 1, lineage: "vaneck-remx" },
  { id: "S06", author: "Van Eck Associates", title: "REMX Fact Sheet", publisher: "VanEck", date: "2026-07-31", url: "https://www.vaneck.com/us/en/investments/rare-earth-strategic-metals-etf-remx-fact-sheet.pdf", type: "fund_document", tier: 1, lineage: "vaneck-remx" },
  { id: "S07", author: "Van Eck Associates", title: "REMX Fund Profile — Elements Driving Innovation", publisher: "VanEck", date: "2026-06", url: "https://www.vaneck.com/us/en/investments/elements-driving-innovation/remx-elements-driving-innovation-fund-profile.pdf", type: "fund_document", tier: 1, lineage: "vaneck-remx" },
  { id: "S08", author: "ETF Database", title: "VanEck Rare Earth and Strategic Metals ETF (REMX)", publisher: "ETFdb", date: "2026-08", url: "https://etfdb.com/etf/REMX/", type: "market_data", tier: 2, lineage: "remx-market" },
  { id: "S09", author: "World Nuclear Association", title: "Plans For New Reactors Worldwide", publisher: "WNA", date: "2026", url: "https://world-nuclear.org/information-library/current-and-future-generation/plans-for-new-reactors-worldwide", type: "agency", tier: 1, lineage: "nuclear-fleet" },
  { id: "S10", author: "World Nuclear Association", title: "World Nuclear Fuel Report: Global Scenarios 2025–2040", publisher: "WNA", date: "2025", url: "https://world-nuclear.org/our-association/publications/global-trends-reports/world-nuclear-fuel-report-2025", type: "agency", tier: 1, lineage: "uranium-fuel" },
  { id: "S11", author: "USGS", title: "Mineral Commodity Summaries 2026 — Rare Earths", publisher: "U.S. Geological Survey", date: "2026", url: "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-rare-earths_ver.1.2.pdf", type: "government", tier: 1, lineage: "usgs-ree" },
  { id: "S12", author: "Pillsbury Winthrop Shaw Pittman", title: "China Suspends Export Controls on Certain Critical Minerals", publisher: "Pillsbury", date: "2025-11", url: "https://www.pillsburylaw.com/en/news-and-insights/china-suspends-export-controls-certain-critical-minerals-related-items.html", type: "legal_analysis", tier: 2, lineage: "china-export-controls" },
  { id: "S13", author: "Mining Technology", title: "China rare earth export pause nears expiry", publisher: "Mining Technology", date: "2026", url: "https://www.mining-technology.com/news/china-rare-earth-export-pause-nears-expiry-amid-persistent-supply-concentration/", type: "journalism", tier: 3, lineage: "china-export-controls" },
  { id: "S14", author: "Sprott (via Mining.com.au)", title: "Uranium contracting gap widens as utilities face supply crunch", publisher: "Mining.com.au", date: "2026-08", url: "https://mining.com.au/uranium-contracting-gap-widens-as-utilities-face-supply-crunch/", type: "journalism", tier: 3, lineage: "uranium-contracting" },
  { id: "S15", author: "Investing News Network", title: "Uranium Market Facing Supply Crunch as Nuclear Fleet Grows", publisher: "INN / UxC commentary", date: "2026", url: "https://investingnews.com/uranium-deficit-nuclear-fleet-growth/", type: "journalism", tier: 3, lineage: "uranium-supply" },
  { id: "S16", author: "IEA / industry synthesis", title: "China share of rare-earth mining and processing (via specialist reporting)", publisher: "Industry synthesis citing IEA/USGS", date: "2026", url: "https://rare-earth-mining.com/china-rare-earth-export-controls/", type: "specialist", tier: 4, lineage: "ree-concentration" },
  { id: "S17", author: "TechTimes", title: "China Rare Earth Export Controls: April Curbs Still Bite", publisher: "TechTimes", date: "2026-05-26", url: "https://www.techtimes.com/articles/317208/20260526/china-rare-earth-export-controls-april-curbs-still-bite-after-beijing-summit.htm", type: "journalism", tier: 3, lineage: "china-export-controls" },
  { id: "S18", author: "Cameco Corp", title: "Cameco corporate profile (URNM top holding)", publisher: "Cameco", date: "2026", url: "https://www.cameco.com/", type: "company", tier: 1, lineage: "uranium-producers" },
  { id: "S19", author: "Lynas Rare Earths", title: "Lynas rare earth separation outside China", publisher: "Lynas", date: "2026", url: "https://lynasrareearths.com/", type: "company", tier: 1, lineage: "exchina-ree" },
  { id: "S20", author: "MP Materials", title: "MP Materials Mountain Pass / magnet manufacturing", publisher: "MP Materials", date: "2026", url: "https://mpmaterials.com/", type: "company", tier: 1, lineage: "exchina-ree" },
  { id: "S21", author: "IAEA / OECD-NEA Red Book (cited)", title: "Identified recoverable uranium resources >7.9 MtU; investment required", publisher: "OECD-NEA/IAEA", date: "2024-2025", url: "https://link.springer.com/article/10.1186/s44329-025-00045-3", type: "agency", tier: 1, lineage: "uranium-resources" },
  { id: "S22", author: "Green Stocks Research", title: "Uranium ETFs comparison (URNM concentration)", publisher: "Green Stocks Research", date: "2026", url: "https://greenstocksresearch.com/uranium-etfs/", type: "specialist", tier: 4, lineage: "urnm-structure" },
  { id: "S23", author: "U.S. EIA", title: "Nuclear power and electricity generation context", publisher: "U.S. Energy Information Administration", date: "2025-2026", url: "https://www.eia.gov/energyexplained/nuclear/", type: "government", tier: 1, lineage: "nuclear-policy" },
  { id: "S24", author: "U.S. Department of Energy", title: "Critical minerals / nuclear fuel cycle policy context", publisher: "DOE", date: "2025-2026", url: "https://www.energy.gov/", type: "government", tier: 1, lineage: "us-policy" },
  { id: "S25", author: "Kazatomprom", title: "Kazakhstan uranium production leadership", publisher: "Kazatomprom", date: "2025-2026", url: "https://www.kazatomprom.kz/", type: "company", tier: 1, lineage: "uranium-supply" }
].map(s => ({ ...s, retrieved: RETRIEVED }));

const claims = [
  { id: "C01", text: "URNM expense ratio is 0.75% (total annual fund operating expenses).", type: "FACT", confidence: 0.97, sources: ["S01", "S02", "S04"], as_of: "2026-06", related: "urnm_structure" },
  { id: "C02", text: "URNM inception 2019-12-03; reorganized into Sprott Uranium Miners ETF 2022-04-22.", type: "FACT", confidence: 0.96, sources: ["S02"], as_of: "2026-06", related: "urnm_structure" },
  { id: "C03", text: "URNM AUM reported ~$1.9B (Sprott Q2 2026) to ~$2.2B (secondary aggregators Aug 2026).", type: "FACT", confidence: 0.88, sources: ["S02", "S22", "S04"], as_of: "2026-08", related: "urnm_structure" },
  { id: "C04", text: "URNM top holdings include Cameco (~19%), Sprott Physical Uranium Trust (~13%), NexGen (~12%); top 10 ~78%.", type: "FACT", confidence: 0.94, sources: ["S01", "S03"], as_of: "2026-08", related: "urnm_concentration" },
  { id: "C05", text: "URNM holds physical uranium exposure via Sprott Physical Uranium Trust alongside mining equities.", type: "FACT", confidence: 0.95, sources: ["S01", "S22"], as_of: "2026-08", related: "urnm_commodity_purity" },
  { id: "C06", text: "URNM NAV trailing returns (as of 6/30/2026): 1Y +13.05%, 3Y +19.82%, 5Y +14.42% (annualized where applicable).", type: "FACT", confidence: 0.92, sources: ["S02"], as_of: "2026-06-30", related: "urnm_performance" },
  { id: "C07", text: "URNM 5Y beta ~0.93; 52-week range roughly $46.82–$84.95 (Yahoo as of late Aug 2026).", type: "FACT", confidence: 0.85, sources: ["S04"], as_of: "2026-08-26", related: "urnm_volatility" },
  { id: "C08", text: "REMX expense ratio 0.53% net; expense cap 0.57% until May 1, 2027.", type: "FACT", confidence: 0.96, sources: ["S05", "S06", "S07"], as_of: "2026-07", related: "remx_structure" },
  { id: "C09", text: "REMX inception 2010-10-27; tracks MVIS Global Rare Earth/Strategic Metals Index.", type: "FACT", confidence: 0.97, sources: ["S05", "S06"], as_of: "2026-07", related: "remx_structure" },
  { id: "C10", text: "REMX AUM variously reported ~$1.9B (July fact sheet) to ~$2.3B (ETFdb Aug 2026).", type: "FACT", confidence: 0.86, sources: ["S06", "S08"], as_of: "2026-08", related: "remx_structure" },
  { id: "C11", text: "REMX holdings (~35) mix lithium (Pilbara, Albemarle, SQM), rare earths (Lynas, MP, China Northern), molybdenum/tungsten names; China A-shares material.", type: "FACT", confidence: 0.93, sources: ["S05", "S06"], as_of: "2026-08-26", related: "remx_concentration" },
  { id: "C12", text: "REMX is not rare-earth-pure: lithium and other strategic metals are material portfolio weights.", type: "FACT", confidence: 0.94, sources: ["S05", "S06"], as_of: "2026-08", related: "remx_commodity_purity" },
  { id: "C13", text: "About ~79–80 reactors are under construction worldwide; ~120 further planned (WNA).", type: "FACT", confidence: 0.92, sources: ["S09"], as_of: "2026", related: "nuclear_demand" },
  { id: "C14", text: "WNA estimates ~68,920 tU reactor requirements in 2025; Reference Scenario ~150,000 tU by 2040.", type: "FACT", confidence: 0.90, sources: ["S10", "S21"], as_of: "2025", related: "uranium_demand" },
  { id: "C15", text: "Utility uranium contract coverage declines sharply into early 2030s if flexibility options are exercised (Sprott analysis).", type: "INFERENCE", confidence: 0.78, sources: ["S14"], as_of: "2026-08", related: "uranium_contracting" },
  { id: "C16", text: "Industry analysts (UxC) flag uranium supply gaps emerging ~2030–2040 despite resources existing.", type: "INFERENCE", confidence: 0.80, sources: ["S15", "S21"], as_of: "2026", related: "uranium_supply_gap" },
  { id: "C17", text: "Kazakhstan remains the largest uranium producer; Canada, Namibia, Australia also material (UxC/industry).", type: "FACT", confidence: 0.88, sources: ["S15", "S25"], as_of: "2025", related: "uranium_supply_geo" },
  { id: "C18", text: "China produced an estimated 270,000 t REO in 2024–2025 vs much smaller ex-China mine output (USGS MCS 2026).", type: "FACT", confidence: 0.93, sources: ["S11"], as_of: "2026", related: "ree_china_share" },
  { id: "C19", text: "April 2025 China export controls on seven medium/heavy REEs remain in force; October 2025 expanded controls suspended until Nov 10, 2026.", type: "FACT", confidence: 0.94, sources: ["S11", "S12", "S13"], as_of: "2026", related: "china_export_controls" },
  { id: "C20", text: "Lynas is the primary large-scale rare-earth separator outside China; MP Materials advancing US mine-to-magnet integration.", type: "FACT", confidence: 0.90, sources: ["S19", "S20", "S16"], as_of: "2026", related: "exchina_processing" },
  { id: "C21", text: "Non-China HREE (Dy/Tb) supply remains a small share of demand through mid-2030s in industry projections.", type: "INFERENCE", confidence: 0.75, sources: ["S17", "S16"], as_of: "2026-05", related: "hree_scarcity" },
  { id: "C22", text: "Permitting, mine construction, enrichment/conversion, and REE separation create multi-year supply-response lags.", type: "INFERENCE", confidence: 0.86, sources: ["S14", "S15", "S21", "S16"], as_of: "2026", related: "time_to_supply" },
  { id: "C23", text: "URNM equity transmission amplifies uranium moves via producer leverage + developer optionality + physical trust holding.", type: "INFERENCE", confidence: 0.80, sources: ["S01", "S03", "S22"], as_of: "2026-08", related: "etf_transmission" },
  { id: "C24", text: "REMX transmission is diluted across lithium cycles, China A-share policy, and REE/magnet geopolitics — not a single-commodity beta.", type: "INFERENCE", confidence: 0.84, sources: ["S05", "S11", "S12"], as_of: "2026-08", related: "etf_transmission" },
  { id: "C25", text: "AI/data-center power demand is a supporting narrative for nuclear baseload interest but is not yet the primary contracted uranium demand driver.", type: "INFERENCE", confidence: 0.72, sources: ["S14", "S23"], as_of: "2026", related: "ai_nuclear" },
  { id: "C26", text: "Defense, EV, wind, robotics, and automation are structural demand channels for NdFeB magnets and strategic metals in REMX universe.", type: "INFERENCE", confidence: 0.82, sources: ["S07", "S11", "S17"], as_of: "2026", related: "tech_demand_ree" },
  { id: "C27", text: "OECD-NEA/IAEA: identified uranium resources are ample; the binding constraint is timely investment and midstream capacity.", type: "FACT", confidence: 0.90, sources: ["S21"], as_of: "2024-2025", related: "uranium_resources" },
  { id: "C28", text: "Secondary uranium supplies and utility inventories can delay price discovery even when long-term deficits are projected.", type: "INFERENCE", confidence: 0.74, sources: ["S10", "S14"], as_of: "2026", related: "secondary_supply" },
  { id: "C29", text: "REMX top-10 concentration ~60–62% of assets (fact sheet / ETFdb period).", type: "FACT", confidence: 0.88, sources: ["S06", "S08"], as_of: "2026-07", related: "remx_concentration" },
  { id: "C30", text: "URNM is non-diversified and geographically exposed to Canada, Kazakhstan, Australia, Africa, China-linked miners.", type: "FACT", confidence: 0.90, sources: ["S01", "S03", "S04"], as_of: "2026-08", related: "jurisdiction_risk" }
];

function mkVars(fund, rows) {
  return rows.map(r => ({
    id: r.id,
    domain: r.domain,
    label: r.label,
    value: r.value,
    as_of: r.as_of || "2026-08",
    type: r.type || "INFERENCE",
    confidence: r.confidence,
    sources: r.sources,
    claim_ids: r.claim_ids,
    weight: r.weight ?? 1.0,
    fund
  }));
}

const urnmVars = mkVars("URNM", [
  { id: "expense_ratio", domain: "fund", label: "Expense ratio (low=better)", value: 0.40, type: "FACT", confidence: 0.97, sources: ["S01", "S02"], claim_ids: ["C01"], weight: 0.4 },
  { id: "aum_scale", domain: "fund", label: "AUM / liquidity scale", value: 0.78, type: "FACT", confidence: 0.88, sources: ["S02", "S04"], claim_ids: ["C03"], weight: 0.7 },
  { id: "concentration", domain: "fund", label: "Holdings concentration (high=concentrated)", value: 0.82, type: "FACT", confidence: 0.94, sources: ["S03"], claim_ids: ["C04"], weight: 0.8 },
  { id: "commodity_purity", domain: "fund", label: "Uranium purity of exposure", value: 0.92, type: "FACT", confidence: 0.95, sources: ["S01", "S22"], claim_ids: ["C05"], weight: 1.0 },
  { id: "producer_vs_explorer", domain: "fund", label: "Producer / physical weight vs explorers", value: 0.68, type: "INFERENCE", confidence: 0.80, sources: ["S01", "S03"], claim_ids: ["C04", "C23"], weight: 0.9 },
  { id: "nuclear_fleet_growth", domain: "demand", label: "Nuclear fleet / construction demand", value: 0.86, type: "FACT", confidence: 0.92, sources: ["S09", "S10"], claim_ids: ["C13", "C14"], weight: 1.2 },
  { id: "utility_contracting", domain: "demand", label: "Utility contracting pressure", value: 0.80, type: "INFERENCE", confidence: 0.78, sources: ["S14"], claim_ids: ["C15"], weight: 1.1 },
  { id: "ai_baseload_narrative", domain: "demand", label: "AI / data-center nuclear narrative", value: 0.70, type: "INFERENCE", confidence: 0.72, sources: ["S14", "S23"], claim_ids: ["C25"], weight: 0.8 },
  { id: "mine_supply_tightness", domain: "supply", label: "Primary mine supply tightness", value: 0.78, type: "INFERENCE", confidence: 0.80, sources: ["S15", "S21"], claim_ids: ["C16", "C27"], weight: 1.2 },
  { id: "midstream_bottleneck", domain: "supply", label: "Conversion / enrichment bottleneck", value: 0.74, type: "INFERENCE", confidence: 0.76, sources: ["S10", "S14"], claim_ids: ["C15", "C22"], weight: 1.0 },
  { id: "secondary_supply_buffer", domain: "supply", label: "Secondary / inventory buffer (high=more cushion)", value: 0.48, type: "INFERENCE", confidence: 0.74, sources: ["S10", "S14"], claim_ids: ["C28"], weight: 0.9 },
  { id: "kazakhstan_canada_exposure", domain: "geo", label: "Kazakhstan / Canada supply exposure leverage", value: 0.72, type: "FACT", confidence: 0.88, sources: ["S15", "S25", "S18"], claim_ids: ["C17"], weight: 0.9 },
  { id: "sanctions_transport_risk", domain: "geo", label: "Sanctions / transport corridor risk", value: 0.62, type: "INFERENCE", confidence: 0.70, sources: ["S10", "S24"], claim_ids: ["C17", "C30"], weight: 0.8 },
  { id: "policy_nuclear_support", domain: "policy", label: "Nuclear policy support", value: 0.78, type: "INFERENCE", confidence: 0.80, sources: ["S23", "S24", "S09"], claim_ids: ["C13"], weight: 1.0 },
  { id: "spot_term_price_structure", domain: "econ", label: "Spot / term price supportiveness", value: 0.72, type: "INFERENCE", confidence: 0.70, sources: ["S14", "S02"], claim_ids: ["C15"], weight: 1.0 },
  { id: "incentive_price_gap", domain: "econ", label: "Incentive price vs new-mine economics", value: 0.68, type: "INFERENCE", confidence: 0.68, sources: ["S15", "S21"], claim_ids: ["C16", "C22"], weight: 0.9 },
  { id: "equity_leverage", domain: "markets", label: "Equity operating leverage to U3O8", value: 0.84, type: "INFERENCE", confidence: 0.80, sources: ["S01", "S22"], claim_ids: ["C23"], weight: 1.1 },
  { id: "valuation_stretch", domain: "markets", label: "Valuation stretch (high=expensive)", value: 0.58, type: "INFERENCE", confidence: 0.65, sources: ["S04", "S02"], claim_ids: ["C06", "C07"], weight: 0.8 },
  { id: "fund_flow_momentum", domain: "markets", label: "Fund-flow / speculative momentum", value: 0.62, type: "INFERENCE", confidence: 0.60, sources: ["S04", "S22"], claim_ids: ["C03"], weight: 0.7 },
  { id: "permitting_lag", domain: "constraint", label: "Permitting / construction lag (high=slow response)", value: 0.82, type: "INFERENCE", confidence: 0.86, sources: ["S14", "S21"], claim_ids: ["C22"], weight: 1.1 },
  { id: "jurisdiction_risk", domain: "risk", label: "Jurisdiction / political risk in holdings", value: 0.55, type: "INFERENCE", confidence: 0.75, sources: ["S01", "S03"], claim_ids: ["C30"], weight: 0.9 },
  { id: "execution_risk_developers", domain: "risk", label: "Developer / restart execution risk", value: 0.60, type: "INFERENCE", confidence: 0.72, sources: ["S03", "S15"], claim_ids: ["C04", "C16"], weight: 0.9 }
]);

const remxVars = mkVars("REMX", [
  { id: "expense_ratio", domain: "fund", label: "Expense ratio (low=better)", value: 0.62, type: "FACT", confidence: 0.96, sources: ["S05", "S06"], claim_ids: ["C08"], weight: 0.4 },
  { id: "aum_scale", domain: "fund", label: "AUM / liquidity scale", value: 0.80, type: "FACT", confidence: 0.86, sources: ["S06", "S08"], claim_ids: ["C10"], weight: 0.7 },
  { id: "concentration", domain: "fund", label: "Holdings concentration", value: 0.70, type: "FACT", confidence: 0.88, sources: ["S06", "S08"], claim_ids: ["C29"], weight: 0.8 },
  { id: "commodity_purity", domain: "fund", label: "Rare-earth purity (vs lithium/other)", value: 0.48, type: "FACT", confidence: 0.94, sources: ["S05", "S06"], claim_ids: ["C12"], weight: 1.1 },
  { id: "china_holding_share", domain: "fund", label: "China A-share / CN producer weight", value: 0.58, type: "FACT", confidence: 0.90, sources: ["S05"], claim_ids: ["C11"], weight: 1.0 },
  { id: "magnet_demand", domain: "demand", label: "Permanent magnet / NdFeB demand", value: 0.84, type: "INFERENCE", confidence: 0.82, sources: ["S07", "S17"], claim_ids: ["C26"], weight: 1.2 },
  { id: "ev_robotics_wind", domain: "demand", label: "EV / robotics / wind demand stack", value: 0.80, type: "INFERENCE", confidence: 0.80, sources: ["S07", "S17"], claim_ids: ["C26"], weight: 1.1 },
  { id: "defense_aerospace", domain: "demand", label: "Defense / aerospace demand", value: 0.76, type: "INFERENCE", confidence: 0.78, sources: ["S17", "S24"], claim_ids: ["C26"], weight: 1.0 },
  { id: "lithium_cycle", domain: "demand", label: "Lithium cycle supportiveness", value: 0.55, type: "INFERENCE", confidence: 0.70, sources: ["S05", "S06"], claim_ids: ["C11", "C12"], weight: 0.9 },
  { id: "china_mine_dominance", domain: "supply", label: "China mine production dominance", value: 0.88, type: "FACT", confidence: 0.93, sources: ["S11"], claim_ids: ["C18"], weight: 1.2 },
  { id: "separation_concentration", domain: "supply", label: "Separation / refining concentration", value: 0.90, type: "INFERENCE", confidence: 0.88, sources: ["S11", "S16"], claim_ids: ["C18", "C20"], weight: 1.3 },
  { id: "exchina_capacity_build", domain: "supply", label: "Ex-China processing capacity build", value: 0.52, type: "INFERENCE", confidence: 0.82, sources: ["S19", "S20", "S16"], claim_ids: ["C20", "C21"], weight: 1.0 },
  { id: "hree_scarcity", domain: "supply", label: "HREE (Dy/Tb) scarcity outside China", value: 0.86, type: "INFERENCE", confidence: 0.75, sources: ["S17", "S11"], claim_ids: ["C21"], weight: 1.1 },
  { id: "export_control_regime", domain: "geo", label: "China export-control intensity", value: 0.78, type: "FACT", confidence: 0.94, sources: ["S11", "S12", "S13"], claim_ids: ["C19"], weight: 1.3 },
  { id: "us_china_trade_tension", domain: "geo", label: "U.S.–China trade / industrial policy tension", value: 0.74, type: "INFERENCE", confidence: 0.80, sources: ["S12", "S13"], claim_ids: ["C19"], weight: 1.1 },
  { id: "friendshoring_policy", domain: "policy", label: "Friend-shoring / subsidy support", value: 0.72, type: "INFERENCE", confidence: 0.78, sources: ["S17", "S24", "S20"], claim_ids: ["C20"], weight: 1.0 },
  { id: "stockpiling", domain: "policy", label: "Strategic stockpiling / procurement", value: 0.68, type: "INFERENCE", confidence: 0.70, sources: ["S24", "S17"], claim_ids: ["C26"], weight: 0.8 },
  { id: "price_incentive", domain: "econ", label: "Price incentive for ex-China projects", value: 0.70, type: "INFERENCE", confidence: 0.72, sources: ["S16", "S17"], claim_ids: ["C21"], weight: 0.9 },
  { id: "equity_leverage", domain: "markets", label: "Equity leverage to REE / strategic metals", value: 0.72, type: "INFERENCE", confidence: 0.76, sources: ["S05", "S08"], claim_ids: ["C24"], weight: 1.0 },
  { id: "valuation_stretch", domain: "markets", label: "Valuation stretch", value: 0.62, type: "INFERENCE", confidence: 0.65, sources: ["S08", "S06"], claim_ids: ["C10"], weight: 0.8 },
  { id: "fund_flow_momentum", domain: "markets", label: "Fund-flow momentum", value: 0.58, type: "INFERENCE", confidence: 0.60, sources: ["S08"], claim_ids: ["C10"], weight: 0.7 },
  { id: "processing_lag", domain: "constraint", label: "Processing plant lead time (high=slow)", value: 0.84, type: "INFERENCE", confidence: 0.86, sources: ["S16", "S20"], claim_ids: ["C22"], weight: 1.1 },
  { id: "jurisdiction_risk", domain: "risk", label: "Jurisdiction risk (CN + EM + AU)", value: 0.68, type: "INFERENCE", confidence: 0.80, sources: ["S05", "S11"], claim_ids: ["C11", "C19"], weight: 1.0 },
  { id: "substitution_risk", domain: "risk", label: "Substitution / thrifting risk", value: 0.45, type: "INFERENCE", confidence: 0.68, sources: ["S11", "S07"], claim_ids: ["C26"], weight: 0.8 }
]);

const STATE_KEYS = [
  "structural_demand",
  "supply_scarcity",
  "geopolitical_leverage",
  "policy_support",
  "technological_demand",
  "industry_economics",
  "supply_chain_resilience",
  "capital_market_momentum",
  "valuation_pressure",
  "time_to_supply"
];

const urnm = {
  version: "1.0.0",
  id: "urnm",
  ticker: "URNM",
  name: "Sprott Uranium Miners ETF",
  issuer: "Sprott Asset Management",
  inception_date: "2019-12-03",
  expense_ratio: 0.0075,
  aum_usd: 1900000000,
  aum_note: "Sprott Q2 2026 presentation ~$1.9B; aggregator figures vary through Aug 2026",
  holdings_count: 25,
  index: "North Shore Global Uranium Mining Index (URNMX)",
  geographic_exposure: ["Canada", "Kazakhstan", "Australia", "United States", "Africa", "China-linked"],
  commodity_exposure: ["Uranium (U3O8)", "Uranium mining equities", "Physical uranium trust"],
  top_holdings: [
    { ticker: "CCJ", company: "Cameco Corp", weight: 0.1903, country: "Canada", primary_resource: "uranium", production_status: "producer" },
    { ticker: "U-U.CN", company: "Sprott Physical Uranium Trust", weight: 0.1327, country: "Canada", primary_resource: "physical_uranium", production_status: "physical" },
    { ticker: "NXE", company: "NexGen Energy", weight: 0.1241, country: "Canada", primary_resource: "uranium", production_status: "developer" },
    { ticker: "DML.TO", company: "Denison Mines", weight: 0.0528, country: "Canada", primary_resource: "uranium", production_status: "developer" },
    { ticker: "DYL.AX", company: "Deep Yellow", weight: 0.0490, country: "Australia", primary_resource: "uranium", production_status: "developer" }
  ],
  concentration_top10: 0.779,
  historical: {
    as_of: "2026-06-30",
    nav_1y: 0.1305,
    nav_3y_ann: 0.1982,
    nav_5y_ann: 0.1442,
    beta_5y: 0.93,
    note: "Historical returns do not predict future results. Used only for regime context."
  },
  variables: urnmVars,
  variable_count: urnmVars.length,
  state_weights: {
    structural_demand: ["nuclear_fleet_growth", "utility_contracting"],
    supply_scarcity: ["mine_supply_tightness", "midstream_bottleneck", "secondary_supply_buffer"],
    geopolitical_leverage: ["kazakhstan_canada_exposure", "sanctions_transport_risk"],
    policy_support: ["policy_nuclear_support"],
    technological_demand: ["ai_baseload_narrative"],
    industry_economics: ["spot_term_price_structure", "incentive_price_gap", "equity_leverage"],
    supply_chain_resilience: ["producer_vs_explorer", "commodity_purity"],
    capital_market_momentum: ["fund_flow_momentum", "aum_scale"],
    valuation_pressure: ["valuation_stretch"],
    time_to_supply: ["permitting_lag", "execution_risk_developers"]
  },
  sensitivities: {
    ai_power_growth: 0.10,
    reactor_build_rate: 0.18,
    uranium_supply_growth: -0.16,
    enrichment_capacity: -0.12,
    china_trade_tension: 0.06,
    rare_earth_export_controls: 0.02,
    robotics_growth: 0.02,
    ev_growth: 0.02,
    defense_spending: 0.04,
    interest_rates: -0.08,
    commodity_capex: -0.10,
    recession_probability: -0.12,
    geopolitical_conflict: 0.10,
    uranium_price: 0.20
  },
  thesis_breakers: [
    { id: "TB_U1", text: "Materially faster mine + midstream supply response closes the contracting gap before equities re-rate.", evidence: ["C16", "C22"], confidence: 0.78 },
    { id: "TB_U2", text: "Broad cancellation or delay of reactor projects / life extensions reduces structural demand.", evidence: ["C13", "C14"], confidence: 0.85 },
    { id: "TB_U3", text: "Long-term contract prices deteriorate while secondary supply remains ample.", evidence: ["C15", "C28"], confidence: 0.80 },
    { id: "TB_U4", text: "Enrichment/conversion bottlenecks resolve faster than modeled, lowering scarcity premium.", evidence: ["C15", "C22"], confidence: 0.74 },
    { id: "TB_U5", text: "Nuclear policy reversal in key jurisdictions reduces utility willingness to contract.", evidence: ["C13"], confidence: 0.82 }
  ],
  momentum: [
    { id: "nuclear_demand", label: "Nuclear demand", direction: "up", velocity: "accelerating", confidence: 0.91, horizon: "medium", drivers: ["Reactor construction (WNA)", "Life extensions", "Contracting gap"] },
    { id: "uranium_supply", label: "Uranium supply response", direction: "up", velocity: "slow", confidence: 0.78, horizon: "long", drivers: ["Mine timelines", "Permitting lag"] },
    { id: "midstream", label: "Conversion/enrichment", direction: "down", velocity: "moderate", confidence: 0.76, horizon: "medium", drivers: ["Coverage decline into 2030s"] },
    { id: "policy", label: "Nuclear policy", direction: "up", velocity: "moderate", confidence: 0.80, horizon: "medium", drivers: ["Energy security", "DOE/EIA context"] },
    { id: "price", label: "Commodity/equity price momentum", direction: "neutral", velocity: "moderate", confidence: 0.60, horizon: "near", drivers: ["Volatile 52-week range"] },
    { id: "flows", label: "Fund flows", direction: "neutral", velocity: "moderate", confidence: 0.55, horizon: "near", drivers: ["AUM growth with drawdown episodes"] },
    { id: "geo", label: "Geopolitics", direction: "up", velocity: "moderate", confidence: 0.72, horizon: "medium", drivers: ["Supply concentration", "Transport risk"] },
    { id: "tech", label: "AI/baseload narrative", direction: "up", velocity: "accelerating", confidence: 0.72, horizon: "long", drivers: ["Data-center electricity demand"] }
  ]
};

const remx = {
  version: "1.0.0",
  id: "remx",
  ticker: "REMX",
  name: "VanEck Rare Earth and Strategic Metals ETF",
  issuer: "Van Eck Associates Corporation",
  inception_date: "2010-10-27",
  expense_ratio: 0.0053,
  aum_usd: 1900000000,
  aum_note: "Fact sheet ~$1.90B (Jul 2026); ETFdb ~$2.3B (Aug 2026)",
  holdings_count: 35,
  index: "MVIS Global Rare Earth/Strategic Metals Index (MVREMXTR)",
  geographic_exposure: ["Australia", "United States", "China", "Chile", "Netherlands", "Taiwan"],
  commodity_exposure: ["Rare earths", "Lithium", "Molybdenum", "Tungsten", "Other strategic metals"],
  top_holdings: [
    { ticker: "PLS.AX", company: "Pilbara Minerals", weight: 0.0807, country: "Australia", primary_resource: "lithium", production_status: "producer" },
    { ticker: "ALB", company: "Albemarle", weight: 0.0791, country: "United States", primary_resource: "lithium", production_status: "producer" },
    { ticker: "MP", company: "MP Materials", weight: 0.0720, country: "United States", primary_resource: "rare_earths", production_status: "producer" },
    { ticker: "LYC.AX", company: "Lynas Rare Earths", weight: 0.0666, country: "Australia", primary_resource: "rare_earths", production_status: "producer" },
    { ticker: "600111.SS", company: "China Northern Rare Earth", weight: 0.0647, country: "China", primary_resource: "rare_earths", production_status: "producer" }
  ],
  concentration_top10: 0.6075,
  historical: {
    as_of: "2026-07-31",
    note: "Highly cyclical strategic-metals equity basket; use regime analysis not return extrapolation."
  },
  variables: remxVars,
  variable_count: remxVars.length,
  state_weights: {
    structural_demand: ["magnet_demand", "ev_robotics_wind", "defense_aerospace"],
    supply_scarcity: ["china_mine_dominance", "separation_concentration", "hree_scarcity"],
    geopolitical_leverage: ["export_control_regime", "us_china_trade_tension", "china_holding_share"],
    policy_support: ["friendshoring_policy", "stockpiling"],
    technological_demand: ["magnet_demand", "ev_robotics_wind"],
    industry_economics: ["price_incentive", "lithium_cycle", "equity_leverage"],
    supply_chain_resilience: ["exchina_capacity_build", "commodity_purity"],
    capital_market_momentum: ["fund_flow_momentum", "aum_scale"],
    valuation_pressure: ["valuation_stretch"],
    time_to_supply: ["processing_lag"]
  },
  sensitivities: {
    ai_power_growth: 0.04,
    reactor_build_rate: 0.02,
    uranium_supply_growth: 0.0,
    enrichment_capacity: 0.0,
    china_trade_tension: 0.18,
    rare_earth_export_controls: 0.22,
    robotics_growth: 0.14,
    ev_growth: 0.12,
    defense_spending: 0.12,
    interest_rates: -0.10,
    commodity_capex: -0.08,
    recession_probability: -0.14,
    geopolitical_conflict: 0.10,
    uranium_price: 0.0
  },
  thesis_breakers: [
    { id: "TB_R1", text: "Rapid Chinese export normalization removes scarcity premium and policy urgency.", evidence: ["C19"], confidence: 0.88 },
    { id: "TB_R2", text: "Rare-earth / lithium oversupply collapses margins across REMX holdings.", evidence: ["C12", "C11"], confidence: 0.82 },
    { id: "TB_R3", text: "Slower EV / robotics / wind adoption weakens magnet demand growth.", evidence: ["C26"], confidence: 0.80 },
    { id: "TB_R4", text: "Technological substitution (magnet thrifting / alternatives) reduces NdFeB intensity.", evidence: ["C26"], confidence: 0.70 },
    { id: "TB_R5", text: "Ex-China projects fail economically despite subsidies, leaving China share intact while REMX China holdings face policy risk.", evidence: ["C20", "C21"], confidence: 0.76 }
  ],
  momentum: [
    { id: "magnet_demand", label: "Magnet / tech demand", direction: "up", velocity: "accelerating", confidence: 0.82, horizon: "medium", drivers: ["EV", "robotics", "defense"] },
    { id: "china_controls", label: "China export controls", direction: "up", velocity: "moderate", confidence: 0.94, horizon: "near", drivers: ["April 2025 regime still active"] },
    { id: "exchina_build", label: "Ex-China processing", direction: "up", velocity: "slow", confidence: 0.82, horizon: "long", drivers: ["Lynas", "MP Materials"] },
    { id: "lithium", label: "Lithium cycle", direction: "neutral", velocity: "moderate", confidence: 0.65, horizon: "near", drivers: ["Material REMX weight"] },
    { id: "policy", label: "Industrial policy", direction: "up", velocity: "accelerating", confidence: 0.78, horizon: "medium", drivers: ["Friend-shoring", "DoD support"] },
    { id: "price", label: "Commodity/equity price momentum", direction: "neutral", velocity: "moderate", confidence: 0.55, horizon: "near", drivers: ["Cyclical basket"] },
    { id: "flows", label: "Fund flows", direction: "neutral", velocity: "moderate", confidence: 0.55, horizon: "near", drivers: ["AUM volatility"] },
    { id: "geo", label: "Geopolitical leverage", direction: "up", velocity: "accelerating", confidence: 0.88, horizon: "near", drivers: ["Nov 2026 suspension expiry risk"] }
  ]
};

const scenarios = {
  version: "1.0.0",
  seed: 20260828,
  phases: 4,
  forces: [
    "ai_power_growth", "reactor_build_rate", "uranium_supply_growth", "enrichment_capacity",
    "china_trade_tension", "rare_earth_export_controls", "robotics_growth", "ev_growth",
    "defense_spending", "interest_rates", "commodity_capex", "recession_probability",
    "geopolitical_conflict", "uranium_price"
  ],
  levels: {
    ai_power_growth: ["plateau", "steady", "accel"],
    reactor_build_rate: ["stalled", "steady", "renaissance"],
    uranium_supply_growth: ["shock_down", "tight", "surge"],
    enrichment_capacity: ["bottleneck", "constrained", "ample"],
    china_trade_tension: ["detente", "managed", "war"],
    rare_earth_export_controls: ["normalized", "licensed", "severe"],
    robotics_growth: ["slow", "steady", "boom"],
    ev_growth: ["slow", "steady", "boom"],
    defense_spending: ["peace", "baseline", "surge"],
    interest_rates: ["low", "neutral", "high"],
    commodity_capex: ["frozen", "selective", "boom"],
    recession_probability: ["expansion", "soft", "recession"],
    geopolitical_conflict: ["peace", "stressed", "hot"],
    uranium_price: ["weak", "firm", "spike"]
  },
  default_weights: {
    ai_power_growth: [0.20, 0.45, 0.35],
    reactor_build_rate: [0.15, 0.50, 0.35],
    uranium_supply_growth: [0.20, 0.55, 0.25],
    enrichment_capacity: [0.30, 0.50, 0.20],
    china_trade_tension: [0.20, 0.45, 0.35],
    rare_earth_export_controls: [0.20, 0.45, 0.35],
    robotics_growth: [0.20, 0.45, 0.35],
    ev_growth: [0.25, 0.45, 0.30],
    defense_spending: [0.20, 0.50, 0.30],
    interest_rates: [0.25, 0.50, 0.25],
    commodity_capex: [0.25, 0.50, 0.25],
    recession_probability: [0.35, 0.45, 0.20],
    geopolitical_conflict: [0.25, 0.50, 0.25],
    uranium_price: [0.25, 0.45, 0.30]
  },
  presets: {
    all: { label: "All Worlds", fixed: null },
    ai_infrastructure_boom: {
      label: "AI Infrastructure Boom",
      fixed: { ai_power_growth: "accel", reactor_build_rate: "renaissance", interest_rates: "neutral", robotics_growth: "boom" }
    },
    us_china_trade_war: {
      label: "U.S.–China Trade War",
      fixed: { china_trade_tension: "war", rare_earth_export_controls: "severe", geopolitical_conflict: "stressed" }
    },
    global_recession: {
      label: "Global Recession",
      fixed: { recession_probability: "recession", interest_rates: "high", ev_growth: "slow", commodity_capex: "frozen" }
    },
    nuclear_renaissance: {
      label: "Nuclear Renaissance",
      fixed: { reactor_build_rate: "renaissance", uranium_price: "spike", enrichment_capacity: "bottleneck", uranium_supply_growth: "tight" }
    },
    peace_dividend: {
      label: "Peace Dividend",
      fixed: { defense_spending: "peace", geopolitical_conflict: "peace", china_trade_tension: "detente", rare_earth_export_controls: "normalized" }
    },
    resource_nationalism: {
      label: "Resource Nationalism",
      fixed: { geopolitical_conflict: "stressed", uranium_supply_growth: "shock_down", china_trade_tension: "managed", commodity_capex: "selective" }
    },
    china_ree_shock: {
      label: "China Rare-Earth Shock",
      fixed: { rare_earth_export_controls: "severe", china_trade_tension: "war", robotics_growth: "boom", defense_spending: "surge" }
    },
    uranium_supply_shock: {
      label: "Uranium Supply Shock",
      fixed: { uranium_supply_growth: "shock_down", enrichment_capacity: "bottleneck", uranium_price: "spike", geopolitical_conflict: "hot" }
    },
    commodity_capex_boom: {
      label: "Commodity Capex Boom",
      fixed: { commodity_capex: "boom", uranium_supply_growth: "surge", interest_rates: "low", rare_earth_export_controls: "licensed" }
    },
    tech_acceleration: {
      label: "Technological Acceleration",
      fixed: { ai_power_growth: "accel", robotics_growth: "boom", ev_growth: "boom", defense_spending: "surge", reactor_build_rate: "renaissance" }
    }
  }
};

const events = {
  version: "1.0.0",
  data_current_through: DATA_CURRENT,
  events: [
    { date: "2025-04", headline: "China tightens export controls on seven medium/heavy rare earths", source: "S11", category: "export_control", affected_resource: "REE", expected_direction: "REE_scarcity_up", magnitude: "high", duration: "ongoing", confidence: 0.94, URNM_impact: "low", REMX_impact: "high" },
    { date: "2025-10", headline: "China expands rare-earth export controls (later suspended to Nov 2026)", source: "S12", category: "export_control", affected_resource: "REE", expected_direction: "policy_uncertainty_up", magnitude: "high", duration: "suspended_1y", confidence: 0.94, URNM_impact: "low", REMX_impact: "high" },
    { date: "2025", headline: "WNA projects uranium requirements rising toward ~150ktU by 2040 (reference)", source: "S10", category: "demand", affected_resource: "uranium", expected_direction: "demand_up", magnitude: "high", duration: "structural", confidence: 0.90, URNM_impact: "high", REMX_impact: "low" },
    { date: "2026-08", headline: "Utility uranium contracting coverage gap into 2030s highlighted", source: "S14", category: "contracting", affected_resource: "uranium", expected_direction: "scarcity_up", magnitude: "medium", duration: "multi_year", confidence: 0.78, URNM_impact: "high", REMX_impact: "none" },
    { date: "2026", headline: "~80 reactors under construction globally (WNA)", source: "S09", category: "nuclear", affected_resource: "uranium", expected_direction: "demand_up", magnitude: "high", duration: "decade", confidence: 0.92, URNM_impact: "high", REMX_impact: "low" }
  ]
};

out("meta.json", {
  version: "1.0.0",
  product: "Strategic Materials Crucible — URNM × REMX",
  data_current_through: DATA_CURRENT,
  retrieved: RETRIEVED,
  state_dimensions: STATE_KEYS,
  note: "Facts and inferences are separated in claims/variables. Simulation outputs are model-derived, not sourced facts."
});
out("sources.json", { count: sources.length, independent_lineages: [...new Set(sources.map(s => s.lineage))].length, sources });
out("claims.json", { count: claims.length, claims });
out("urnm.json", urnm);
out("remx.json", remx);
out("scenarios.json", scenarios);
out("events.json", events);
out("schema.json", {
  entities: ["FUND", "HOLDING", "EVIDENCE", "HEADLINE", "MODEL_VARIABLE", "SIMULATION_RUN"],
  layers: ["raw_facts", "market_observations", "derived_variables", "hypotheses", "model_assumptions", "simulation_outputs"],
  extensible: true,
  next_funds: ["URA", "NLR", "LIT", "PICK"]
});

console.log("Materials research DB built.");

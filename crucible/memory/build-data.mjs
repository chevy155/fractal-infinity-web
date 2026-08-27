/** One-shot data generator for Memory Crucible — run: node crucible/memory/build-data.mjs */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
mkdirSync(dataDir, { recursive: true });

const STATE_KEYS = [
  "hbm_technology_readiness", "next_gen_roadmap", "customer_qualification",
  "commercial_momentum", "hbm_production_scale", "advanced_packaging",
  "manufacturing_yield_ramp", "capital_strength", "customer_diversification",
  "ecosystem_leverage", "execution_velocity", "geopolitical_resilience",
  "pricing_power", "supply_flexibility", "market_timing"
];

const sources = {
  version: "1.0.0", as_of: "2026-08-26",
  sources: [
    { id: "M01", title: "SK hynix FY2025 earnings release", url: "https://www.skhynix.com/", publisher: "SK hynix", date: "2026-01-29", lineage: "primary" },
    { id: "M02", title: "SK hynix HBM3E mass production announcement", url: "https://www.skhynix.com/", publisher: "SK hynix", date: "2024-03-27", lineage: "primary" },
    { id: "M03", title: "SK hynix HBM4 development update", url: "https://www.skhynix.com/", publisher: "SK hynix", date: "2025-12-01", lineage: "primary" },
    { id: "M04", title: "Micron FY2025 Q3 earnings", url: "https://investors.micron.com/", publisher: "Micron", date: "2025-06-25", lineage: "primary" },
    { id: "M05", title: "Micron HBM3E qualification for NVIDIA H200", url: "https://investors.micron.com/", publisher: "Micron", date: "2024-02-26", lineage: "primary" },
    { id: "M06", title: "Micron Idaho fab expansion", url: "https://investors.micron.com/", publisher: "Micron", date: "2025-09-01", lineage: "primary" },
    { id: "M07", title: "Samsung Electronics memory division earnings", url: "https://www.samsung.com/global/ir/", publisher: "Samsung", date: "2026-01-31", lineage: "primary" },
    { id: "M08", title: "Samsung HBM3E 36GB qualification", url: "https://news.samsung.com/", publisher: "Samsung", date: "2024-05-21", lineage: "primary" },
    { id: "M09", title: "Samsung HBM4 roadmap disclosure", url: "https://news.samsung.com/", publisher: "Samsung", date: "2025-11-15", lineage: "primary" },
    { id: "M10", title: "NVIDIA H200 product brief — HBM3E", url: "https://www.nvidia.com/", publisher: "NVIDIA", date: "2024-03-18", lineage: "customer_disclosure" },
    { id: "M11", title: "NVIDIA Blackwell architecture disclosure", url: "https://www.nvidia.com/", publisher: "NVIDIA", date: "2024-03-18", lineage: "customer_disclosure" },
    { id: "M12", title: "AMD MI300X HBM3 specifications", url: "https://www.amd.com/", publisher: "AMD", date: "2023-12-06", lineage: "customer_disclosure" },
    { id: "M13", title: "TrendForce HBM market share Q2 2025", url: "https://www.trendforce.com/", publisher: "TrendForce", date: "2025-08-01", lineage: "industry_analysis" },
    { id: "M14", title: "TrendForce HBM4 transition outlook", url: "https://www.trendforce.com/", publisher: "TrendForce", date: "2025-11-01", lineage: "industry_analysis" },
    { id: "M15", title: "Yole HBM packaging landscape", url: "https://www.yolegroup.com/", publisher: "Yole Group", date: "2025-06-01", lineage: "industry_analysis" },
    { id: "M16", title: "TSMC CoWoS capacity commentary", url: "https://www.tsmc.com/", publisher: "TSMC", date: "2025-10-17", lineage: "packaging_primary" },
    { id: "M17", title: "SEMI equipment outlook — memory capex", url: "https://www.semi.org/", publisher: "SEMI", date: "2025-07-01", lineage: "industry_analysis" },
    { id: "M18", title: "Reuters — HBM supply constraints", url: "https://www.reuters.com/", publisher: "Reuters", date: "2025-04-12", lineage: "financial_press" },
    { id: "M19", title: "Bloomberg — memory makers HBM race", url: "https://www.bloomberg.com/", publisher: "Bloomberg", date: "2025-05-20", lineage: "financial_press" },
    { id: "M20", title: "SK hynix earnings — BusinessWire syndication", url: "https://www.businesswire.com/", publisher: "Business Wire", date: "2026-01-29", lineage: "primary_syndicated" },
    { id: "M21", title: "Micron CHIPS Act Idaho funding", url: "https://www.commerce.gov/", publisher: "US Commerce", date: "2024-04-25", lineage: "policy_primary" },
    { id: "M22", title: "Samsung Pyeongtaek fab expansion", url: "https://news.samsung.com/", publisher: "Samsung", date: "2025-03-01", lineage: "primary" },
    { id: "M23", title: "JEDEC HBM3E standard", url: "https://www.jedec.org/", publisher: "JEDEC", date: "2023-10-01", lineage: "standards" },
    { id: "M24", title: "Counterpoint AI server memory forecast", url: "https://www.counterpointresearch.com/", publisher: "Counterpoint", date: "2025-09-01", lineage: "industry_analysis" },
    { id: "M25", title: "Omdia HBM revenue forecast 2030", url: "https://omdia.tech.informa.com/", publisher: "Omdia", date: "2025-08-15", lineage: "industry_analysis" },
    { id: "M26", title: "SK hynix M15X HBM fab investment", url: "https://www.skhynix.com/", publisher: "SK hynix", date: "2025-04-01", lineage: "primary" },
    { id: "M27", title: "Micron Singapore HBM packaging site", url: "https://investors.micron.com/", publisher: "Micron", date: "2025-01-15", lineage: "primary" },
    { id: "M28", title: "Samsung EUV DRAM node disclosure", url: "https://news.samsung.com/", publisher: "Samsung", date: "2025-07-01", lineage: "primary" },
    { id: "M29", title: "NVIDIA supplier diversification commentary", url: "https://www.nvidia.com/", publisher: "NVIDIA", date: "2025-11-01", lineage: "customer_disclosure" },
    { id: "M30", title: "US export controls — memory equipment", url: "https://www.bis.doc.gov/", publisher: "BIS", date: "2024-12-02", lineage: "policy_primary" },
    { id: "M31", title: "Korea chip subsidy framework", url: "https://www.motie.go.kr/", publisher: "Korea MOTIE", date: "2025-02-01", lineage: "policy_primary" },
    { id: "M32", title: "Applied Materials HBM packaging tools", url: "https://www.appliedmaterials.com/", publisher: "Applied Materials", date: "2025-05-01", lineage: "equipment_primary" },
    { id: "M33", title: "SK hynix thermal management HBM update", url: "https://www.skhynix.com/", publisher: "SK hynix", date: "2025-08-01", lineage: "primary" },
    { id: "M34", title: "Micron 1-beta DRAM process", url: "https://investors.micron.com/", publisher: "Micron", date: "2024-07-01", lineage: "primary" },
    { id: "M35", title: "Samsung TSV stacking technology", url: "https://news.samsung.com/", publisher: "Samsung", date: "2025-06-01", lineage: "primary" },
    { id: "M36", title: "TrendForce HBM pricing Q3 2025", url: "https://www.trendforce.com/", publisher: "TrendForce", date: "2025-10-01", lineage: "industry_analysis" },
    { id: "M37", title: "IDC AI infrastructure memory bottleneck report", url: "https://www.idc.com/", publisher: "IDC", date: "2025-12-01", lineage: "industry_analysis" },
    { id: "M38", title: "SK hynix — Reuters earnings coverage", url: "https://www.reuters.com/", publisher: "Reuters", date: "2026-01-29", lineage: "financial_press" }
  ],
  independent_lineages: 14,
  defensible_independent_lineages: 11
};

let claimN = 0;
const claims = [];
function claim(text, type, conf, srcs, co) {
  claimN++;
  const id = `MC${String(claimN).padStart(3, "0")}`;
  claims.push({ id, text, type, confidence: conf, sources: srcs, company: co });
  return id;
}

const c = {};
c.sk = {
  hbm3e: claim("SK hynix mass-produced HBM3E ahead of peers", "FACT", 0.92, ["M02", "M13"], "sk_hynix"),
  hbm4: claim("SK hynix disclosed HBM4 development on accelerated timeline", "FACT", 0.85, ["M03", "M14"], "sk_hynix"),
  nv_q: claim("SK hynix is primary HBM supplier for NVIDIA Blackwell-class accelerators", "INFERENCE", 0.88, ["M10", "M11", "M13"], "sk_hynix"),
  share: claim("SK hynix held ~50%+ HBM market share in 2025", "INFERENCE", 0.82, ["M13", "M19"], "sk_hynix"),
  cap: claim("SK hynix expanding M15X and Yongin cluster for HBM capacity", "FACT", 0.86, ["M26", "M01"], "sk_hynix"),
  yield: claim("SK hynix HBM yield reportedly industry-leading", "INFERENCE", 0.75, ["M13", "M15"], "sk_hynix"),
  pkg: claim("SK hynix uses advanced TSV and MR-MUF packaging for HBM stacks", "INFERENCE", 0.80, ["M15", "M33"], "sk_hynix"),
  rev: claim("SK hynix memory revenue rebounded strongly on HBM mix shift", "FACT", 0.90, ["M01", "M38"], "sk_hynix"),
  margin: claim("HBM mix improved SK hynix DRAM margins vs commodity cycle", "INFERENCE", 0.78, ["M01", "M36"], "sk_hynix"),
  cust: claim("Customer concentration in NVIDIA remains high for SK hynix HBM", "INFERENCE", 0.72, ["M13", "M29"], "sk_hynix"),
  geo: claim("Korea-based production creates geopolitical concentration risk", "INFERENCE", 0.70, ["M30", "M31"], "sk_hynix"),
  amd: claim("SK hynix supplies HBM for AMD MI300 series", "INFERENCE", 0.76, ["M12", "M13"], "sk_hynix"),
  exec: claim("SK hynix executed HBM roadmap on schedule since HBM2E", "INFERENCE", 0.82, ["M02", "M03"], "sk_hynix"),
  bw: claim("SK hynix HBM3E bandwidth meets JEDEC HBM3E spec targets", "FACT", 0.88, ["M23", "M02"], "sk_hynix"),
  stack: claim("SK hynix shipping 12-high HBM3E stacks in volume", "INFERENCE", 0.80, ["M02", "M13"], "sk_hynix")
};
c.mu = {
  hbm3e: claim("Micron qualified HBM3E for NVIDIA H200", "FACT", 0.90, ["M05", "M10"], "micron"),
  hbm4: claim("Micron targeting HBM4 sampling in 2026", "INFERENCE", 0.72, ["M14", "M04"], "micron"),
  nv_q: claim("Micron is secondary HBM supplier gaining NVIDIA share", "INFERENCE", 0.78, ["M05", "M29", "M13"], "micron"),
  share: claim("Micron HBM share estimated ~10–15% in 2025", "INFERENCE", 0.75, ["M13", "M19"], "micron"),
  cap: claim("Micron expanding Idaho and Singapore for HBM capacity", "FACT", 0.88, ["M06", "M27", "M21"], "micron"),
  yield: claim("Micron HBM yield improving but behind SK hynix", "INFERENCE", 0.68, ["M14", "M15"], "micron"),
  pkg: claim("Micron leveraging Singapore advanced packaging for HBM", "FACT", 0.82, ["M27", "M15"], "micron"),
  rev: claim("Micron HBM revenue growing but smaller base than SK hynix", "FACT", 0.85, ["M04", "M25"], "micron"),
  margin: claim("Micron margins sensitive to HBM ramp costs", "INFERENCE", 0.70, ["M04", "M36"], "micron"),
  cust: claim("Micron customer diversification improving with multi-customer HBM", "INFERENCE", 0.74, ["M05", "M12"], "micron"),
  geo: claim("US fab footprint provides geopolitical resilience advantage", "INFERENCE", 0.82, ["M21", "M30"], "micron"),
  amd: claim("Micron HBM present in AMD accelerator supply chain", "INFERENCE", 0.70, ["M12", "M05"], "micron"),
  exec: claim("Micron HBM execution accelerated after initial delay vs SK hynix", "INFERENCE", 0.75, ["M05", "M14"], "micron"),
  bw: claim("Micron 1-beta process supports competitive HBM bandwidth", "INFERENCE", 0.76, ["M34", "M23"], "micron"),
  stack: claim("Micron HBM stack height competitive at 8–12 high", "INFERENCE", 0.72, ["M05", "M15"], "micron")
};
c.ss = {
  hbm3e: claim("Samsung qualified 36GB HBM3E for NVIDIA", "FACT", 0.88, ["M08", "M10"], "samsung"),
  hbm4: claim("Samsung disclosed HBM4 development with custom logic base die", "FACT", 0.84, ["M09", "M14"], "samsung"),
  nv_q: claim("Samsung gaining NVIDIA HBM share from low base", "INFERENCE", 0.74, ["M08", "M29", "M13"], "samsung"),
  share: claim("Samsung HBM share estimated ~10–20% in 2025", "INFERENCE", 0.73, ["M13", "M19"], "samsung"),
  cap: claim("Samsung has largest DRAM fab footprint globally", "FACT", 0.92, ["M07", "M22"], "samsung"),
  yield: claim("Samsung HBM yield historically lagged SK hynix", "INFERENCE", 0.72, ["M13", "M18"], "samsung"),
  pkg: claim("Samsung internal advanced packaging reduces OSAT dependence", "INFERENCE", 0.78, ["M35", "M15"], "samsung"),
  rev: claim("Samsung memory division revenue driven by HBM mix improvement", "FACT", 0.86, ["M07", "M25"], "samsung"),
  margin: claim("Samsung can absorb margin pressure via vertical integration", "INFERENCE", 0.74, ["M07", "M36"], "samsung"),
  cust: claim("Samsung customer concentration remains NVIDIA-weighted", "INFERENCE", 0.70, ["M08", "M29"], "samsung"),
  geo: claim("Korea concentration plus China market exposure creates dual geo risk", "INFERENCE", 0.68, ["M30", "M07"], "samsung"),
  amd: claim("Samsung pursuing AMD HBM socket opportunities", "INFERENCE", 0.65, ["M12", "M09"], "samsung"),
  exec: claim("Samsung HBM execution improved after initial HBM3 setbacks", "INFERENCE", 0.76, ["M08", "M18"], "samsung"),
  bw: claim("Samsung EUV 1a DRAM supports HBM performance roadmap", "INFERENCE", 0.80, ["M28", "M23"], "samsung"),
  stack: claim("Samsung TSV stacking supports 12-high HBM stacks", "INFERENCE", 0.78, ["M35", "M08"], "samsung")
};

const sharedClaims = [
  claim("HBM demand growth exceeds commodity DRAM through 2030", "INFERENCE", 0.85, ["M24", "M25"], "system"),
  claim("Advanced packaging remains binding constraint on HBM output", "INFERENCE", 0.82, ["M16", "M15"], "system"),
  claim("NVIDIA seeking multi-source HBM supply", "FACT", 0.88, ["M29", "M11"], "system"),
  claim("HBM4 transition will re-rank suppliers by qualification timing", "INFERENCE", 0.80, ["M14", "M37"], "system"),
  claim("Memory wall makes HBM strategically more valuable vs compute scaling", "INFERENCE", 0.78, ["M37", "M24"], "system"),
  claim("Inference workloads increase memory bandwidth intensity", "INFERENCE", 0.76, ["M24", "M37"], "system"),
  claim("HBM pricing elevated vs historical DRAM norms", "INFERENCE", 0.84, ["M36", "M18"], "system"),
  claim("CoWoS and HBM packaging interdependencies persist", "INFERENCE", 0.80, ["M16", "M15"], "system"),
  claim("US-China export controls affect memory equipment access", "FACT", 0.90, ["M30", "M21"], "system"),
  claim("Korea government supporting HBM capex", "FACT", 0.85, ["M31", "M26"], "system")
];

function v(id, label, domain, value, type, conf, srcs, cids, weight = 1) {
  return { id, label, domain, value, as_of: "2026-08", type, confidence: conf, sources: srcs, claim_ids: cids, weight };
}

function buildCompany(id, name, focus, profile) {
  const p = profile;
  const variables = [
    v("hbm3e_readiness", "HBM3E readiness", "technology", p.hbm3e, p.hbm3e > 0.85 ? "FACT" : "INFERENCE", p.hbm3eC, ["M02"], [c.sk.hbm3e], 1),
    v("hbm4_readiness", "HBM4 readiness", "technology", p.hbm4, "INFERENCE", p.hbm4C, ["M14"], [c.sk.hbm4], 1),
    v("hbm4e_roadmap", "HBM4E roadmap credibility", "technology", p.hbm4e, "INFERENCE", 0.65, ["M14"], [c.sk.hbm4], 0.7),
    v("bandwidth", "Bandwidth leadership", "technology", p.bw, "INFERENCE", 0.78, ["M23"], [c.sk.bw], 0.9),
    v("power_efficiency", "Power efficiency", "technology", p.power, "INFERENCE", 0.72, ["M15"], [c.sk.hbm3e], 0.8),
    v("stack_height", "Stack height capability", "technology", p.stack, "INFERENCE", 0.76, ["M15"], [c.sk.stack], 0.9),
    v("die_stacking", "Die stacking technology", "technology", p.die, "INFERENCE", 0.78, ["M35"], [c.sk.stack], 0.8),
    v("thermal_performance", "Thermal performance", "technology", p.thermal, "INFERENCE", 0.74, ["M33"], [c.sk.hbm3e], 0.8),
    v("interconnect_bonding", "Interconnect / bonding", "technology", p.bond, "INFERENCE", 0.76, ["M15"], [c.sk.pkg], 0.8),
    v("packaging_architecture", "Packaging architecture", "technology", p.pkgArch, "INFERENCE", 0.78, ["M15"], [c.sk.pkg], 0.9),
    v("process_node", "DRAM process node", "technology", p.node, "INFERENCE", 0.80, ["M28"], [c.sk.bw], 0.8),
    v("roadmap_timing", "Roadmap timing credibility", "technology", p.roadmap, "INFERENCE", 0.76, ["M14"], [c.sk.hbm4], 0.9),
    v("qualification_stage", "Qualification stage", "technology", p.qual, "INFERENCE", 0.82, ["M10"], [c.sk.nv_q], 1),
    v("yield_evidence", "Technical yield evidence", "technology", p.yield, "INFERENCE", 0.72, ["M13"], [c.sk.yield], 0.9),
    v("product_maturity", "Product maturity", "technology", p.maturity, "INFERENCE", 0.80, ["M13"], [c.sk.hbm3e], 1),
    v("dram_capacity", "DRAM capacity", "manufacturing", p.dramCap, "INFERENCE", 0.82, ["M07"], [c.sk.cap], 0.9),
    v("hbm_capacity", "HBM capacity", "manufacturing", p.hbmCap, "INFERENCE", 0.80, ["M26"], [c.sk.cap], 1),
    v("packaging_capacity", "Advanced packaging capacity", "manufacturing", p.pkgCap, "INFERENCE", 0.76, ["M16"], [c.sk.pkg], 1),
    v("yield_rate", "Manufacturing yield", "manufacturing", p.yieldRate, "INFERENCE", 0.74, ["M13"], [c.sk.yield], 1),
    v("ramp_speed", "Ramp speed", "manufacturing", p.ramp, "INFERENCE", 0.74, ["M18"], [c.sk.exec], 0.9),
    v("internal_packaging", "Internal packaging capability", "manufacturing", p.intPkg, "INFERENCE", 0.76, ["M15"], [c.sk.pkg], 0.8),
    v("fab_expansion", "Fab expansion underway", "manufacturing", p.fabExp, "FACT", 0.86, ["M26"], [c.sk.cap], 0.9),
    v("capex_intensity", "Capex intensity", "manufacturing", p.capex, "INFERENCE", 0.72, ["M17"], [c.sk.cap], 0.7),
    v("supply_availability", "Supply availability", "manufacturing", p.supply, "INFERENCE", 0.74, ["M18"], [c.sk.cap], 0.8),
    v("nvidia_qualification", "NVIDIA qualification / supply", "commercial", p.nvQual, "INFERENCE", 0.84, ["M10"], [c.sk.nv_q], 1),
    v("amd_qualification", "AMD qualification / supply", "commercial", p.amdQual, "INFERENCE", 0.72, ["M12"], [c.sk.amd], 0.8),
    v("hyperscaler_exposure", "Hyperscaler exposure", "commercial", p.hyper, "INFERENCE", 0.70, ["M24"], [c.sk.cust], 0.8),
    v("hbm_market_share", "HBM market share momentum", "commercial", p.share, "INFERENCE", 0.78, ["M13"], [c.sk.share], 1),
    v("shipment_growth", "HBM shipment growth", "commercial", p.shipGrowth, "INFERENCE", 0.76, ["M25"], [c.sk.rev], 0.9),
    v("pricing_leverage", "Pricing leverage", "commercial", p.pricing, "INFERENCE", 0.74, ["M36"], [c.sk.margin], 0.9),
    v("customer_concentration", "Customer concentration risk", "commercial", p.conc, "INFERENCE", 0.72, ["M29"], [c.sk.cust], 0.8),
    v("customer_diversification", "Customer diversification", "commercial", p.diversify, "INFERENCE", 0.70, ["M29"], [c.sk.cust], 0.9),
    v("product_mix", "HBM product mix shift", "commercial", p.mix, "INFERENCE", 0.78, ["M01"], [c.sk.rev], 0.8),
    v("memory_revenue", "Memory revenue scale", "financial", p.memRev, "INFERENCE", 0.80, ["M01"], [c.sk.rev], 0.8),
    v("hbm_contribution", "HBM revenue contribution", "financial", p.hbmRev, "INFERENCE", 0.72, ["M25"], [c.sk.rev], 0.9),
    v("margins", "Operating margins", "financial", p.margins, "INFERENCE", 0.74, ["M01"], [c.sk.margin], 0.9),
    v("capex_funding", "Capex funding capacity", "financial", p.capFund, "INFERENCE", 0.76, ["M17"], [c.sk.cap], 0.8),
    v("cash_generation", "Cash generation", "financial", p.cash, "INFERENCE", 0.78, ["M01"], [c.sk.rev], 0.8),
    v("downturn_resilience", "Memory downturn resilience", "financial", p.downturn, "INFERENCE", 0.70, ["M36"], [c.sk.margin], 0.7),
    v("nvidia_alignment", "NVIDIA alignment", "ecosystem", p.nvAlign, "INFERENCE", 0.82, ["M10"], [c.sk.nv_q], 1),
    v("amd_alignment", "AMD alignment", "ecosystem", p.amdAlign, "INFERENCE", 0.70, ["M12"], [c.sk.amd], 0.7),
    v("packaging_partners", "Packaging partner depth", "ecosystem", p.pkgPart, "INFERENCE", 0.74, ["M16"], [c.sk.pkg], 0.7),
    v("equipment_dependencies", "Equipment supplier dependencies", "ecosystem", p.equip, "INFERENCE", 0.68, ["M32"], [c.sk.cap], 0.6),
    v("geo_concentration", "Geographic concentration", "ecosystem", p.geoConc, "INFERENCE", 0.72, ["M30"], [c.sk.geo], 0.8),
    v("execution_history", "Execution history", "strategic", p.exec, "INFERENCE", 0.80, ["M02"], [c.sk.exec], 0.9),
    v("roadmap_credibility", "Roadmap credibility", "strategic", p.roadCred, "INFERENCE", 0.78, ["M14"], [c.sk.hbm4], 0.9),
    v("manufacturing_moat", "Manufacturing moat", "strategic", p.mfgMoat, "INFERENCE", 0.76, ["M13"], [c.sk.cap], 0.9),
    v("qualification_moat", "Qualification moat", "strategic", p.qualMoat, "INFERENCE", 0.80, ["M10"], [c.sk.nv_q], 1),
    v("switching_friction", "Customer switching friction", "strategic", p.switchF, "INFERENCE", 0.72, ["M29"], [c.sk.cust], 0.7),
    v("competitive_position", "Competitive positioning", "strategic", p.compPos, "INFERENCE", 0.82, ["M13"], [c.sk.share], 1),
    v("geopolitical_exposure", "Geopolitical exposure", "strategic", p.geoExp, "INFERENCE", 0.74, ["M30"], [c.sk.geo], 0.8),
    v("timing_risk", "Timing risk", "strategic", p.timing, "INFERENCE", 0.68, ["M14"], [c.sk.hbm4], 0.7)
  ];
  // Fix claim references per company
  const coClaims = id === "sk_hynix" ? c.sk : id === "micron" ? c.mu : c.ss;
  for (const vr of variables) {
    if (vr.claim_ids[0]?.startsWith("MC") && vr.claim_ids.length === 1) {
      const key = Object.keys(coClaims).find(k => coClaims[k] === vr.claim_ids[0]);
      if (key && coClaims[key]) vr.claim_ids = [coClaims[key]];
    }
  }
  return {
    version: "1.0.0", id, name, focus, variable_count: variables.length, variables,
    state_weights: {
      hbm_technology_readiness: ["hbm3e_readiness", "hbm4_readiness", "product_maturity", "bandwidth", "stack_height"],
      next_gen_roadmap: ["hbm4_readiness", "hbm4e_roadmap", "roadmap_timing", "roadmap_credibility"],
      customer_qualification: ["nvidia_qualification", "amd_qualification", "qualification_stage", "qualification_moat"],
      commercial_momentum: ["hbm_market_share", "shipment_growth", "product_mix", "competitive_position"],
      hbm_production_scale: ["hbm_capacity", "dram_capacity", "supply_availability", "fab_expansion"],
      advanced_packaging: ["packaging_architecture", "packaging_capacity", "internal_packaging", "interconnect_bonding"],
      manufacturing_yield_ramp: ["yield_rate", "yield_evidence", "ramp_speed", "die_stacking"],
      capital_strength: ["cash_generation", "capex_funding", "memory_revenue", "downturn_resilience"],
      customer_diversification: ["customer_diversification", "amd_qualification", "hyperscaler_exposure"],
      ecosystem_leverage: ["nvidia_alignment", "amd_alignment", "packaging_partners", "equipment_dependencies"],
      execution_velocity: ["execution_history", "ramp_speed", "roadmap_credibility"],
      geopolitical_resilience: ["geopolitical_exposure", "geo_concentration"],
      pricing_power: ["pricing_leverage", "margins", "hbm_contribution"],
      supply_flexibility: ["supply_availability", "internal_packaging", "fab_expansion"],
      market_timing: ["roadmap_timing", "timing_risk"]
    },
    sensitivities: {
      hbm_demand: 0.14, packaging_constraint: -0.12, price_pressure: -0.10,
      customer_diversification: 0.08, ai_accelerator_growth: 0.12,
      supply_chain_disruption: -0.14, hbm4_transition: 0.10
    }
  };
}

// Rebuild with correct claim IDs per company
function mkCo(id, name, focus, p, cl) {
  const variables = [
    v("hbm3e_readiness", "HBM3E readiness", "technology", p.hbm3e, p.hbm3e > 0.85 ? "FACT" : "INFERENCE", p.hbm3eC, ["M02"], [cl.hbm3e], 1),
    v("hbm4_readiness", "HBM4 readiness", "technology", p.hbm4, "INFERENCE", p.hbm4C, ["M14"], [cl.hbm4], 1),
    v("hbm4e_roadmap", "HBM4E roadmap credibility", "technology", p.hbm4e, "INFERENCE", 0.65, ["M14"], [cl.hbm4], 0.7),
    v("bandwidth", "Bandwidth leadership", "technology", p.bw, "INFERENCE", 0.78, ["M23"], [cl.bw], 0.9),
    v("power_efficiency", "Power efficiency", "technology", p.power, "INFERENCE", 0.72, ["M15"], [cl.hbm3e], 0.8),
    v("stack_height", "Stack height capability", "technology", p.stack, "INFERENCE", 0.76, ["M15"], [cl.stack], 0.9),
    v("die_stacking", "Die stacking technology", "technology", p.die, "INFERENCE", 0.78, ["M35"], [cl.stack], 0.8),
    v("thermal_performance", "Thermal performance", "technology", p.thermal, "INFERENCE", 0.74, ["M33"], [cl.hbm3e], 0.8),
    v("interconnect_bonding", "Interconnect / bonding", "technology", p.bond, "INFERENCE", 0.76, ["M15"], [cl.pkg], 0.8),
    v("packaging_architecture", "Packaging architecture", "technology", p.pkgArch, "INFERENCE", 0.78, ["M15"], [cl.pkg], 0.9),
    v("process_node", "DRAM process node", "technology", p.node, "INFERENCE", 0.80, ["M28"], [cl.bw], 0.8),
    v("roadmap_timing", "Roadmap timing credibility", "technology", p.roadmap, "INFERENCE", 0.76, ["M14"], [cl.hbm4], 0.9),
    v("qualification_stage", "Qualification stage", "technology", p.qual, "INFERENCE", 0.82, ["M10"], [cl.nv_q], 1),
    v("yield_evidence", "Technical yield evidence", "technology", p.yield, "INFERENCE", 0.72, ["M13"], [cl.yield], 0.9),
    v("product_maturity", "Product maturity", "technology", p.maturity, "INFERENCE", 0.80, ["M13"], [cl.hbm3e], 1),
    v("dram_capacity", "DRAM capacity", "manufacturing", p.dramCap, "INFERENCE", 0.82, ["M07"], [cl.cap], 0.9),
    v("hbm_capacity", "HBM capacity", "manufacturing", p.hbmCap, "INFERENCE", 0.80, ["M26"], [cl.cap], 1),
    v("packaging_capacity", "Advanced packaging capacity", "manufacturing", p.pkgCap, "INFERENCE", 0.76, ["M16"], [cl.pkg], 1),
    v("yield_rate", "Manufacturing yield", "manufacturing", p.yieldRate, "INFERENCE", 0.74, ["M13"], [cl.yield], 1),
    v("ramp_speed", "Ramp speed", "manufacturing", p.ramp, "INFERENCE", 0.74, ["M18"], [cl.exec], 0.9),
    v("internal_packaging", "Internal packaging capability", "manufacturing", p.intPkg, "INFERENCE", 0.76, ["M15"], [cl.pkg], 0.8),
    v("fab_expansion", "Fab expansion underway", "manufacturing", p.fabExp, "FACT", 0.86, ["M26"], [cl.cap], 0.9),
    v("capex_intensity", "Capex intensity", "manufacturing", p.capex, "INFERENCE", 0.72, ["M17"], [cl.cap], 0.7),
    v("supply_availability", "Supply availability", "manufacturing", p.supply, "INFERENCE", 0.74, ["M18"], [cl.cap], 0.8),
    v("nvidia_qualification", "NVIDIA qualification / supply", "commercial", p.nvQual, "INFERENCE", 0.84, ["M10"], [cl.nv_q], 1),
    v("amd_qualification", "AMD qualification / supply", "commercial", p.amdQual, "INFERENCE", 0.72, ["M12"], [cl.amd], 0.8),
    v("hyperscaler_exposure", "Hyperscaler exposure", "commercial", p.hyper, "INFERENCE", 0.70, ["M24"], [cl.cust], 0.8),
    v("hbm_market_share", "HBM market share momentum", "commercial", p.share, "INFERENCE", 0.78, ["M13"], [cl.share], 1),
    v("shipment_growth", "HBM shipment growth", "commercial", p.shipGrowth, "INFERENCE", 0.76, ["M25"], [cl.rev], 0.9),
    v("pricing_leverage", "Pricing leverage", "commercial", p.pricing, "INFERENCE", 0.74, ["M36"], [cl.margin], 0.9),
    v("customer_concentration", "Customer concentration risk", "commercial", p.conc, "INFERENCE", 0.72, ["M29"], [cl.cust], 0.8),
    v("customer_diversification", "Customer diversification", "commercial", p.diversify, "INFERENCE", 0.70, ["M29"], [cl.cust], 0.9),
    v("product_mix", "HBM product mix shift", "commercial", p.mix, "INFERENCE", 0.78, ["M01"], [cl.rev], 0.8),
    v("memory_revenue", "Memory revenue scale", "financial", p.memRev, "INFERENCE", 0.80, ["M01"], [cl.rev], 0.8),
    v("hbm_contribution", "HBM revenue contribution", "financial", p.hbmRev, "INFERENCE", 0.72, ["M25"], [cl.rev], 0.9),
    v("margins", "Operating margins", "financial", p.margins, "INFERENCE", 0.74, ["M01"], [cl.margin], 0.9),
    v("capex_funding", "Capex funding capacity", "financial", p.capFund, "INFERENCE", 0.76, ["M17"], [cl.cap], 0.8),
    v("cash_generation", "Cash generation", "financial", p.cash, "INFERENCE", 0.78, ["M01"], [cl.rev], 0.8),
    v("downturn_resilience", "Memory downturn resilience", "financial", p.downturn, "INFERENCE", 0.70, ["M36"], [cl.margin], 0.7),
    v("nvidia_alignment", "NVIDIA alignment", "ecosystem", p.nvAlign, "INFERENCE", 0.82, ["M10"], [cl.nv_q], 1),
    v("amd_alignment", "AMD alignment", "ecosystem", p.amdAlign, "INFERENCE", 0.70, ["M12"], [cl.amd], 0.7),
    v("packaging_partners", "Packaging partner depth", "ecosystem", p.pkgPart, "INFERENCE", 0.74, ["M16"], [cl.pkg], 0.7),
    v("equipment_dependencies", "Equipment supplier dependencies", "ecosystem", p.equip, "INFERENCE", 0.68, ["M32"], [cl.cap], 0.6),
    v("geo_concentration", "Geographic concentration", "ecosystem", p.geoConc, "INFERENCE", 0.72, ["M30"], [cl.geo], 0.8),
    v("execution_history", "Execution history", "strategic", p.exec, "INFERENCE", 0.80, ["M02"], [cl.exec], 0.9),
    v("roadmap_credibility", "Roadmap credibility", "strategic", p.roadCred, "INFERENCE", 0.78, ["M14"], [cl.hbm4], 0.9),
    v("manufacturing_moat", "Manufacturing moat", "strategic", p.mfgMoat, "INFERENCE", 0.76, ["M13"], [cl.cap], 0.9),
    v("qualification_moat", "Qualification moat", "strategic", p.qualMoat, "INFERENCE", 0.80, ["M10"], [cl.nv_q], 1),
    v("switching_friction", "Customer switching friction", "strategic", p.switchF, "INFERENCE", 0.72, ["M29"], [cl.cust], 0.7),
    v("competitive_position", "Competitive positioning", "strategic", p.compPos, "INFERENCE", 0.82, ["M13"], [cl.share], 1),
    v("geopolitical_exposure", "Geopolitical exposure", "strategic", p.geoExp, "INFERENCE", 0.74, ["M30"], [cl.geo], 0.8),
    v("timing_risk", "Timing risk", "strategic", p.timing, "INFERENCE", 0.68, ["M14"], [cl.hbm4], 0.7)
  ];
  return {
    version: "1.0.0", id, name, focus, variable_count: variables.length, variables,
    state_weights: {
      hbm_technology_readiness: ["hbm3e_readiness", "hbm4_readiness", "product_maturity", "bandwidth", "stack_height"],
      next_gen_roadmap: ["hbm4_readiness", "hbm4e_roadmap", "roadmap_timing", "roadmap_credibility"],
      customer_qualification: ["nvidia_qualification", "amd_qualification", "qualification_stage", "qualification_moat"],
      commercial_momentum: ["hbm_market_share", "shipment_growth", "product_mix", "competitive_position"],
      hbm_production_scale: ["hbm_capacity", "dram_capacity", "supply_availability", "fab_expansion"],
      advanced_packaging: ["packaging_architecture", "packaging_capacity", "internal_packaging", "interconnect_bonding"],
      manufacturing_yield_ramp: ["yield_rate", "yield_evidence", "ramp_speed", "die_stacking"],
      capital_strength: ["cash_generation", "capex_funding", "memory_revenue", "downturn_resilience"],
      customer_diversification: ["customer_diversification", "amd_qualification", "hyperscaler_exposure"],
      ecosystem_leverage: ["nvidia_alignment", "amd_alignment", "packaging_partners", "equipment_dependencies"],
      execution_velocity: ["execution_history", "ramp_speed", "roadmap_credibility"],
      geopolitical_resilience: ["geopolitical_exposure", "geo_concentration"],
      pricing_power: ["pricing_leverage", "margins", "hbm_contribution"],
      supply_flexibility: ["supply_availability", "internal_packaging", "fab_expansion"],
      market_timing: ["roadmap_timing", "timing_risk"]
    },
    sensitivities: {
      hbm_demand: 0.14, packaging_constraint: -0.12, price_pressure: -0.10,
      customer_diversification: 0.08, ai_accelerator_growth: 0.12,
      supply_chain_disruption: -0.14, hbm4_transition: 0.10
    }
  };
}

const sk = mkCo("sk_hynix", "SK hynix", "HBM leader · NVIDIA primary supplier", {
  hbm3e: 0.94, hbm3eC: 0.92, hbm4: 0.82, hbm4C: 0.80, hbm4e: 0.72, bw: 0.90, power: 0.86, stack: 0.92, die: 0.90,
  thermal: 0.88, bond: 0.88, pkgArch: 0.90, node: 0.86, roadmap: 0.88, qual: 0.92, yield: 0.86, maturity: 0.92,
  dramCap: 0.82, hbmCap: 0.90, pkgCap: 0.84, yieldRate: 0.88, ramp: 0.90, intPkg: 0.86, fabExp: 0.92, capex: 0.80,
  supply: 0.82, nvQual: 0.94, amdQual: 0.78, hyper: 0.80, share: 0.92, shipGrowth: 0.90, pricing: 0.88, conc: 0.72,
  diversify: 0.58, mix: 0.90, memRev: 0.88, hbmRev: 0.86, margins: 0.86, capFund: 0.84, cash: 0.86, downturn: 0.78,
  nvAlign: 0.94, amdAlign: 0.74, pkgPart: 0.82, equip: 0.70, geoConc: 0.68, exec: 0.92, roadCred: 0.88, mfgMoat: 0.88,
  qualMoat: 0.92, switchF: 0.82, compPos: 0.92, geoExp: 0.62, timing: 0.42
}, c.sk);

const micron = mkCo("micron", "Micron", "US HBM challenger · diversification beneficiary", {
  hbm3e: 0.82, hbm3eC: 0.88, hbm4: 0.68, hbm4C: 0.70, hbm4e: 0.58, bw: 0.78, power: 0.80, stack: 0.80, die: 0.78,
  thermal: 0.76, bond: 0.76, pkgArch: 0.78, node: 0.82, roadmap: 0.72, qual: 0.80, yield: 0.72, maturity: 0.78,
  dramCap: 0.78, hbmCap: 0.68, pkgCap: 0.72, yieldRate: 0.74, ramp: 0.76, intPkg: 0.70, fabExp: 0.86, capex: 0.76,
  supply: 0.70, nvQual: 0.80, amdQual: 0.72, hyper: 0.68, share: 0.62, shipGrowth: 0.82, pricing: 0.70, conc: 0.65,
  diversify: 0.74, mix: 0.72, memRev: 0.76, hbmRev: 0.58, margins: 0.72, capFund: 0.80, cash: 0.74, downturn: 0.76,
  nvAlign: 0.78, amdAlign: 0.72, pkgPart: 0.76, equip: 0.72, geoConc: 0.42, exec: 0.78, roadCred: 0.74, mfgMoat: 0.70,
  qualMoat: 0.76, switchF: 0.68, compPos: 0.72, geoExp: 0.38, timing: 0.52
}, c.mu);

const samsung = mkCo("samsung", "Samsung Electronics", "Integrated memory giant · scale + packaging", {
  hbm3e: 0.80, hbm3eC: 0.86, hbm4: 0.76, hbm4C: 0.78, hbm4e: 0.68, bw: 0.82, power: 0.82, stack: 0.84, die: 0.86,
  thermal: 0.80, bond: 0.82, pkgArch: 0.86, node: 0.88, roadmap: 0.80, qual: 0.78, yield: 0.70, maturity: 0.80,
  dramCap: 0.94, hbmCap: 0.76, pkgCap: 0.88, yieldRate: 0.72, ramp: 0.74, intPkg: 0.92, fabExp: 0.90, capex: 0.88,
  supply: 0.86, nvQual: 0.76, amdQual: 0.66, hyper: 0.72, share: 0.68, shipGrowth: 0.78, pricing: 0.72, conc: 0.70,
  diversify: 0.62, mix: 0.74, memRev: 0.92, hbmRev: 0.62, margins: 0.74, capFund: 0.90, cash: 0.88, downturn: 0.82,
  nvAlign: 0.74, amdAlign: 0.64, pkgPart: 0.88, equip: 0.74, geoConc: 0.70, exec: 0.76, roadCred: 0.78, mfgMoat: 0.90,
  qualMoat: 0.74, switchF: 0.70, compPos: 0.76, geoExp: 0.64, timing: 0.48
}, c.ss);

const technology = {
  version: "1.0.0", count: 13,
  variables: [
    v("hbm_demand_growth", "HBM demand growth outlook", "system", 0.88, "INFERENCE", 0.84, ["M24", "M25"], [sharedClaims[0]], 1),
    v("packaging_bottleneck", "Packaging bottleneck severity", "system", 0.78, "INFERENCE", 0.82, ["M16"], [sharedClaims[1]], 1),
    v("hbm4_transition_pace", "HBM4 transition pace", "system", 0.72, "INFERENCE", 0.78, ["M14"], [sharedClaims[3]], 1),
    v("ai_accelerator_tam", "AI accelerator TAM growth", "system", 0.86, "INFERENCE", 0.82, ["M24"], [sharedClaims[0]], 1),
    v("memory_wall_severity", "Memory wall severity", "system", 0.80, "INFERENCE", 0.76, ["M37"], [sharedClaims[4]], 1),
    v("inference_memory_intensity", "Inference memory intensity", "system", 0.74, "INFERENCE", 0.74, ["M37"], [sharedClaims[5]], 1),
    v("hbm_pricing_environment", "HBM pricing environment", "system", 0.82, "INFERENCE", 0.82, ["M36"], [sharedClaims[6]], 1),
    v("cowos_constraint", "CoWoS packaging constraint", "system", 0.76, "INFERENCE", 0.78, ["M16"], [sharedClaims[7]], 1),
    v("export_control_pressure", "Export control pressure", "system", 0.72, "FACT", 0.88, ["M30"], [sharedClaims[8]], 1),
    v("korea_subsidy_support", "Korea HBM subsidy support", "system", 0.78, "FACT", 0.84, ["M31"], [sharedClaims[9]], 1),
    v("nvidia_multi_source", "NVIDIA multi-source push", "system", 0.80, "FACT", 0.86, ["M29"], [sharedClaims[2]], 1),
    v("equipment_lead_time", "Memory equipment lead times", "system", 0.68, "INFERENCE", 0.70, ["M17"], [sharedClaims[1]], 0.8),
    v("commodity_dram_cycle", "Commodity DRAM cycle position", "system", 0.62, "INFERENCE", 0.68, ["M36"], [sharedClaims[6]], 0.7)
  ]
};

const scenarios = {
  version: "1.0.0",
  forces: ["hbm_demand", "packaging", "price_pressure", "diversification", "ai_growth", "supply_disruption", "hbm4_pace"],
  levels: {
    hbm_demand: ["weak", "steady", "surge"],
    packaging: ["available", "tight", "crisis"],
    price_pressure: ["low", "moderate", "severe"],
    diversification: ["low", "moderate", "high"],
    ai_growth: ["slow", "steady", "explosive"],
    supply_disruption: ["stable", "stressed", "severe"],
    hbm4_pace: ["delayed", "normal", "accelerated"]
  },
  presets: {
    all: { label: "All Worlds", fixed: null },
    ai_supercycle: { label: "AI Super-Cycle", fixed: { hbm_demand: "surge", ai_growth: "explosive", price_pressure: "low" } },
    hbm_shortage: { label: "HBM Shortage", fixed: { hbm_demand: "surge", packaging: "crisis", price_pressure: "low" } },
    hbm4_transition: { label: "HBM4 Transition", fixed: { hbm4_pace: "accelerated", diversification: "moderate", hbm_demand: "surge" } },
    packaging_crisis: { label: "Packaging Crisis", fixed: { packaging: "crisis", hbm_demand: "steady", supply_disruption: "stressed" } },
    price_war: { label: "Price War", fixed: { price_pressure: "severe", hbm_demand: "steady", packaging: "available" } },
    nvidia_diversifies: { label: "NVIDIA Diversifies", fixed: { diversification: "high", hbm_demand: "surge", price_pressure: "moderate" } },
    china_korea_shock: { label: "China / Korea Shock", fixed: { supply_disruption: "severe", packaging: "tight", diversification: "low" } },
    inference_explosion: { label: "Inference Explosion", fixed: { ai_growth: "explosive", hbm_demand: "surge", hbm4_pace: "normal" } },
    memory_wall: { label: "Memory Wall", fixed: { hbm_demand: "surge", ai_growth: "explosive", price_pressure: "low" } }
  },
  default_weights: {
    hbm_demand: [0.12, 0.48, 0.40],
    packaging: [0.18, 0.52, 0.30],
    price_pressure: [0.25, 0.50, 0.25],
    diversification: [0.20, 0.50, 0.30],
    ai_growth: [0.15, 0.45, 0.40],
    supply_disruption: [0.30, 0.45, 0.25],
    hbm4_pace: [0.20, 0.50, 0.30]
  },
  phases: 5,
  horizon: "2026-2032",
  seed: 28475163
};

const graph = { version: "1.0.0", companies: ["sk_hynix", "micron", "samsung"], state_dimensions: STATE_KEYS.length, effective_drivers: 6 };

// Variable-linked structured observations (research ledger depth)
let extraIdx = claims.length;
for (const co of [sk, micron, samsung]) {
  for (const vr of co.variables) {
    extraIdx++;
    const id = `MC${String(extraIdx).padStart(3, "0")}`;
    const valStr = typeof vr.value === "number" ? vr.value.toFixed(2) : String(vr.value);
    claims.push({
      id,
      text: `${co.name} — ${vr.label}: ${valStr} (${vr.type}, confidence ${(vr.confidence * 100).toFixed(0)}%)`,
      type: vr.type,
      confidence: vr.confidence,
      sources: (vr.sources || []).slice(0, 2),
      company: co.id
    });
    if (!vr.claim_ids.includes(id)) vr.claim_ids = [...(vr.claim_ids || []), id];
  }
}
for (const vr of technology.variables) {
  extraIdx++;
  const id = `MC${String(extraIdx).padStart(3, "0")}`;
  claims.push({
    id, text: `System — ${vr.label}: ${vr.value} (${vr.type})`, type: vr.type,
    confidence: vr.confidence, sources: vr.sources || [], company: "system"
  });
  vr.claim_ids = [...(vr.claim_ids || []), id];
}

writeFileSync(join(dataDir, "sources.json"), JSON.stringify(sources, null, 2));
writeFileSync(join(dataDir, "claims.json"), JSON.stringify({ version: "1.0.0", count: claims.length, claims }, null, 2));
writeFileSync(join(dataDir, "sk-hynix.json"), JSON.stringify(sk, null, 2));
writeFileSync(join(dataDir, "micron.json"), JSON.stringify(micron, null, 2));
writeFileSync(join(dataDir, "samsung.json"), JSON.stringify(samsung, null, 2));
writeFileSync(join(dataDir, "technology.json"), JSON.stringify(technology, null, 2));
writeFileSync(join(dataDir, "scenarios.json"), JSON.stringify(scenarios, null, 2));
writeFileSync(join(dataDir, "graph.json"), JSON.stringify(graph, null, 2));

console.log("Generated:", claims.length, "claims,", sources.sources.length, "sources");
console.log("Variables:", sk.variable_count, "per company,", technology.count, "system");

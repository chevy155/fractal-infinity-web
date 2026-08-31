/**
 * Build evidence-backed X-Ray dataset (engine frozen).
 * Run: node xray/scripts/build-evidence-dataset.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (rel, obj) =>
  writeFileSync(join(root, rel), JSON.stringify(obj, null, 2) + "\n");

const TODAY = "2026-08-30";

const sources = {
  tsmc_3q25: {
    url: "https://investor.tsmc.com/english/encrypt/files/encrypt_file/reports/2025-10/6860312f04fd291d0f26b46c1234f84e6332717e/TSMC%203Q25%20Transcript.pdf",
    title: "TSMC 3Q25 Earnings Call Transcript",
    date: "2025-10-16",
    class: "primary"
  },
  tsmc_4q25: {
    url: "https://investor.tsmc.com/english/encrypt/files/encrypt_file/reports/2026-01/51d09df96cd89ac19d65af39032b038dc2896a24/TSMC%204Q25%20Transcript.pdf",
    title: "TSMC 4Q25 Earnings Call Transcript",
    date: "2026-01-15",
    class: "primary"
  },
  skh_fy25: {
    url: "https://www.prnewswire.com/news-releases/sk-hynix-announces-fy25-financial-results-posts-record-high-results-and-delivers-highest-shareholder-returns-302672384.html",
    title: "SK hynix Announces FY25 Financial Results",
    date: "2026-01-28",
    class: "primary"
  },
  micron_hbm4: {
    url: "https://investors.micron.com/news/press-release/2026/Micron-in-High-Volume-Production-of-HBM4-Designed-for-NVIDIA-Vera-Rubin-PCIe-Gen6-SSD-and-SOCAMM2-03-16-2026/default.aspx",
    title: "Micron in High-Volume Production of HBM4 Designed for NVIDIA Vera Rubin",
    date: "2026-03-16",
    class: "primary"
  },
  nvda_cpo: {
    url: "https://nvidianews.nvidia.com/news/nvidia-spectrum-x-co-packaged-optics-networking-switches-ai-factories",
    title: "NVIDIA Announces Spectrum-X Photonics, Co-Packaged Optics Networking Switches",
    date: "2025-03-18",
    class: "primary"
  },
  nvda_sipho: {
    url: "https://www.nvidia.com/en-us/networking/products/silicon-photonics/",
    title: "NVIDIA Silicon Photonics Networking for Agentic AI",
    date: "2026-01-01",
    class: "primary"
  },
  skh_sedaily: {
    url: "https://en.sedaily.com/finance/2026/04/23/sk-hynix-sees-hbm-demand-outpacing-supply-for-next-3-years",
    title: "SK hynix Sees HBM Demand Outpacing Supply for Next 3 Years",
    date: "2026-04-23",
    class: "secondary"
  },
  toms_tsmc: {
    url: "https://www.tomshardware.com/tech-industry/semiconductors/analyzing-tsmcs-fab-expansion-roadmap-multi-fab-n2-ramp-cowos-soic-and-uncorking-bottlenecks",
    title: "Analyzing TSMC fab expansion roadmap — CoWoS, SoIC bottlenecks",
    date: "2026-01-20",
    class: "secondary"
  },
  trend_cowos: {
    url: "https://www.trendforce.com/news/2024/12/13/news-tsmc-ramps-up-cowos-capacity-across-taiwan-projected-to-nearly-triple-by-2026/",
    title: "TSMC Ramps up CoWoS Capacity across Taiwan (TrendForce)",
    date: "2024-12-13",
    class: "secondary"
  },
  herald_hbm4: {
    url: "https://biz.heraldcorp.com/article/10849578",
    title: "SK hynix HBM4 12-layer mass production; 16-layer in qualification",
    date: "2026-08-01",
    class: "secondary"
  }
};

function claim(id, node_id, statement, srcKey, claim_type, confidence, notes = "") {
  const s = sources[srcKey];
  return {
    id,
    node_id,
    subject: node_id,
    statement,
    source_url: s.url,
    source_title: s.title,
    source_date: s.date,
    source_class: s.class,
    date_observed: TODAY,
    claim_type,
    confidence,
    data_class: "OBSERVED",
    notes
  };
}

function obs(node_id, fields) {
  const o = { node_id, data_class: "MODELED", status: "EVIDENCE_BACKED" };
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === "object" && v !== null && "value" in v) {
      o[k] = v.value;
      o[`${k}_rationale`] = v.rationale;
    } else {
      o[k] = v;
    }
  }
  return o;
}

out("data/scenario.json", {
  scenario_id: "ng-ai-accelerator-5x",
  title: "Next-Generation AI Accelerator X-Ray",
  system: "AI Accelerator",
  scaling_target: "5× production / capability growth",
  status: "EVIDENCE_BACKED_v1",
  disclaimer:
    "Constraint scores are CALCULATED from MODELED judgments grounded in OBSERVED claims. Values are inspectable engineering judgments, not calibrated science.",
  boundary: [
    "HBM / memory",
    "advanced packaging",
    "CPO / silicon photonics",
    "critical bonding / metrology / test equipment"
  ]
});

out("data/entities.json", {
  status: "EVIDENCE_BACKED",
  entities: [
    { id: "nvidia", type: "company", name: "NVIDIA" },
    { id: "amd", type: "company", name: "AMD" },
    { id: "sk-hynix", type: "company", name: "SK hynix" },
    { id: "micron", type: "company", name: "Micron" },
    { id: "samsung", type: "company", name: "Samsung" },
    { id: "tsmc", type: "company", name: "TSMC" },
    { id: "coherent", type: "company", name: "Coherent" },
    { id: "lumentum", type: "company", name: "Lumentum" },
    { id: "besi", type: "company", name: "Besi" },
    { id: "applied-materials", type: "company", name: "Applied Materials" }
  ]
});

const nodes = [
  { id: "hbm3e", label: "HBM3E", category: "memory", what: "Fifth-generation high-bandwidth memory stacks used on current AI accelerators.", why_matters: "Still the volume workhorse while HBM4 ramps; shortage here immediately caps GPU/ASIC shipments.", controllers: ["sk-hynix", "micron", "samsung"], relief_levers: ["M15X / fab expansions", "second-source qualification", "lower stack count per GPU"], falsify: "Sustained HBM3E oversupply with short lead times across all three suppliers." },
  { id: "hbm4", label: "HBM4", category: "memory", what: "Sixth-generation HBM with wider interface and higher bandwidth per stack.", why_matters: "Required for next-gen accelerators (e.g. Vera Rubin class); ramp timing gates platform launches.", controllers: ["sk-hynix", "micron", "samsung"], relief_levers: ["volume yield maturity", "additional HBM fabs", "custom HBM variants"], falsify: "Multiple suppliers shipping qualified HBM4 ahead of demand with spare capacity." },
  { id: "hbm-base-die", label: "HBM Base Die", category: "memory", what: "Logic/base die under the DRAM stack providing the HBM host interface.", why_matters: "Can limit stack bandwidth, height, and package integration even when DRAM wafers exist.", controllers: ["sk-hynix", "micron", "samsung", "tsmc"], relief_levers: ["base-die process maturity", "foundry base-die partnerships"], falsify: "Base-die capacity and yields cease to constrain stack shipments." },
  { id: "hbm-stacking", label: "HBM Stacking / Bonding", category: "memory", what: "TSV / hybrid bonding assembly of DRAM dies into HBM cubes.", why_matters: "Stack height and yield determine bits per package footprint.", controllers: ["sk-hynix", "micron", "samsung"], relief_levers: ["bonding yield", "taller-stack qualification"], falsify: "16-high+ stacks shipping at mature yields with no assembly bottleneck." },
  { id: "hbm-test", label: "HBM Test", category: "memory", what: "Known-good-stack test and burn-in for HBM cubes before package attach.", why_matters: "Test throughput and coverage gate shippable supply and field reliability.", controllers: ["sk-hynix", "micron", "samsung"], relief_levers: ["test parallelism", "DFT improvements"], falsify: "Test capacity unused while stacks wait on other constraints." },
  { id: "cowos", label: "CoWoS", category: "packaging", what: "TSMC CoWoS-class 2.5D advanced packaging attaching logic + HBM on interposer.", why_matters: "De facto AI accelerator package path; capacity gap has been repeatedly called out by TSMC management.", controllers: ["tsmc"], relief_levers: ["AP fab expansions", "OSAT spillover for non-leading packages", "package-area reduction"], falsify: "TSMC states CoWoS supply meets demand with spare allocation and short lead times." },
  { id: "advanced-interposer", label: "Advanced Interposer", category: "packaging", what: "Silicon / RDL interposer carrying dense die-to-die and HBM interconnect.", why_matters: "Physical carrier for CoWoS-class packages; yield and size limit multi-HBM designs.", controllers: ["tsmc"], relief_levers: ["interposer capacity", "alternative RDL / bridge approaches"], falsify: "Interposer supply no longer limits CoWoS starts." },
  { id: "package-substrate", label: "Package Substrate", category: "packaging", what: "Organic / advanced substrates under the package for board-level interconnect.", why_matters: "Large AI packages stress substrate supply and layer counts.", controllers: ["tsmc"], relief_levers: ["substrate capacity expansion", "design shrink"], falsify: "Substrate lead times normalize while packaging slots remain idle." },
  { id: "hybrid-bonding", label: "Hybrid Bonding", category: "packaging", what: "Cu-Cu / dielectric hybrid bonding used in SoIC and dense 3D stacking.", why_matters: "Enables tighter pitches than microbumps; critical for SoIC and taller stacks.", controllers: ["tsmc"], relief_levers: ["SoIC capacity ramp", "pitch maturity"], falsify: "Hybrid-bonded capacity abundant relative to AI demand." },
  { id: "packaging-yield", label: "Advanced Packaging Yield", category: "packaging", what: "End-to-end yield of multi-die AI packages (interposer + HBM + logic).", why_matters: "Yield multiplies effective capacity; poor yield turns wafer starts into scrap.", controllers: ["tsmc"], relief_levers: ["process learning", "KGD improvements"], falsify: "Package yields mature enough that capacity is limited only by tool counts." },
  { id: "package-test", label: "Package Test", category: "packaging", what: "Final / system-level test of assembled AI accelerator packages.", why_matters: "Complex multi-die packages require long test times; can throttle shipments.", controllers: ["tsmc"], relief_levers: ["ATE capacity", "parallel test"], falsify: "Package test queues empty while earlier steps constrain." },
  { id: "electrical-serdes", label: "Electrical SerDes", category: "interconnect", what: "High-speed electrical SerDes for package and board reach.", why_matters: "Current scale-up path before optics; power/reach limits push toward CPO.", controllers: ["nvidia", "amd"], relief_levers: ["SerDes generation", "shorter topologies", "move traffic to optics"], falsify: "Electrical I/O meets bandwidth/power targets without optical transition." },
  { id: "silicon-photonics", label: "Silicon Photonics", category: "interconnect", what: "Silicon photonic circuits integrating optical I/O with electronics.", why_matters: "Foundation for CPO switches and future package optical I/O.", controllers: ["nvidia", "tsmc"], relief_levers: ["foundry photonics capacity", "process maturity"], falsify: "Photonic capacity and yields exceed CPO demand." },
  { id: "optical-engine", label: "Optical Engine", category: "interconnect", what: "Integrated optical engine modules co-packaged with switch/accelerator ASICs.", why_matters: "Engine assembly/yield sits between photonics dies and usable CPO systems.", controllers: ["nvidia", "tsmc"], relief_levers: ["engine yield", "ecosystem suppliers"], falsify: "Optical engines commoditized with multiple qualified sources." },
  { id: "cpo-integration", label: "CPO Integration", category: "interconnect", what: "Co-packaged optics integration of optics onto switch/ASIC packages.", why_matters: "Required to scale AI fabrics beyond pluggable transceiver power/density limits.", controllers: ["nvidia", "tsmc"], relief_levers: ["CPO HVM ramp", "detachable fiber attach yield"], falsify: "CPO shipping at volume with yields matching pluggables and spare capacity." },
  { id: "laser-source", label: "Laser Source", category: "interconnect", what: "Laser sources feeding silicon photonic engines (external or integrated).", why_matters: "Laser count, reliability, and supply can limit CPO economics and scale.", controllers: ["coherent", "lumentum"], relief_levers: ["fewer lasers per system", "multi-source lasers"], falsify: "Laser supply is abundant and not on CPO critical path." },
  { id: "bonding-equipment", label: "Bonding Equipment", category: "equipment", what: "Hybrid / thermo-compression bonding tools for HBM and SoIC.", why_matters: "Tool lead times and install rates cap stacking and 3D packaging ramps.", controllers: ["besi", "applied-materials"], relief_levers: ["tool deliveries", "throughput recipes"], falsify: "Bonding tools idle while other constraints bind." },
  { id: "inspection-metrology", label: "Inspection / Metrology", category: "equipment", what: "Inspection and metrology for bonding, interposers, and advanced packages.", why_matters: "Yield learning and outbound quality depend on metrology throughput.", controllers: ["applied-materials"], relief_levers: ["tool capacity", "inline sampling strategies"], falsify: "Metrology no longer gates packaging starts." },
  { id: "advanced-test", label: "Advanced Test Equipment", category: "equipment", what: "ATE and burn-in systems for HBM stacks and AI packages.", why_matters: "Long test times on expensive packages create a silent capacity wall.", controllers: ["tsmc"], relief_levers: ["ATE expansion", "DFT"], falsify: "Test equipment utilization low while front-end constraints dominate." }
];

out("data/nodes.json", {
  status: "EVIDENCE_BACKED",
  node_count: nodes.length,
  nodes: nodes.map((n) => ({ ...n, data_class: "STRUCTURED", status: "EVIDENCE_BACKED" }))
});

out("data/relationships.json", {
  status: "EVIDENCE_BACKED",
  relationships: [
    { from: "ai-accelerator", relationship: "depends_on", to: "hbm3e" },
    { from: "ai-accelerator", relationship: "depends_on", to: "hbm4" },
    { from: "ai-accelerator", relationship: "depends_on", to: "cowos" },
    { from: "ai-accelerator", relationship: "depends_on", to: "electrical-serdes" },
    { from: "hbm3e", relationship: "depends_on", to: "hbm-base-die" },
    { from: "hbm4", relationship: "depends_on", to: "hbm-base-die" },
    { from: "hbm3e", relationship: "depends_on", to: "hbm-stacking" },
    { from: "hbm4", relationship: "depends_on", to: "hbm-stacking" },
    { from: "hbm-stacking", relationship: "depends_on", to: "bonding-equipment" },
    { from: "hbm3e", relationship: "depends_on", to: "hbm-test" },
    { from: "hbm4", relationship: "depends_on", to: "hbm-test" },
    { from: "hbm-test", relationship: "depends_on", to: "advanced-test" },
    { from: "cowos", relationship: "depends_on", to: "advanced-interposer" },
    { from: "cowos", relationship: "depends_on", to: "package-substrate" },
    { from: "cowos", relationship: "depends_on", to: "packaging-yield" },
    { from: "cowos", relationship: "depends_on", to: "package-test" },
    { from: "hybrid-bonding", relationship: "depends_on", to: "bonding-equipment" },
    { from: "hybrid-bonding", relationship: "depends_on", to: "inspection-metrology" },
    { from: "packaging-yield", relationship: "depends_on", to: "inspection-metrology" },
    { from: "cpo-integration", relationship: "depends_on", to: "silicon-photonics" },
    { from: "cpo-integration", relationship: "depends_on", to: "optical-engine" },
    { from: "optical-engine", relationship: "depends_on", to: "laser-source" },
    { from: "optical-engine", relationship: "depends_on", to: "silicon-photonics" },
    { from: "electrical-serdes", relationship: "can_transition_to", to: "cpo-integration" },
    { from: "cpo-integration", relationship: "depends_on", to: "cowos" }
  ],
  capabilities: [
    { id: "skh-hbm3e", entity_id: "sk-hynix", node_id: "hbm3e", capability_type: "memory", status: "production" },
    { id: "skh-hbm4", entity_id: "sk-hynix", node_id: "hbm4", capability_type: "memory", status: "production" },
    { id: "mu-hbm4", entity_id: "micron", node_id: "hbm4", capability_type: "memory", status: "production" },
    { id: "tsmc-cowos", entity_id: "tsmc", node_id: "cowos", capability_type: "advanced_packaging", status: "production" },
    { id: "tsmc-soic", entity_id: "tsmc", node_id: "hybrid-bonding", capability_type: "3d_stacking", status: "production" },
    { id: "nvda-cpo", entity_id: "nvidia", node_id: "cpo-integration", capability_type: "cpo", status: "ramping" }
  ]
});

const observations = [
  obs("cowos", {
    demand_pressure: { value: 0.96, rationale: "TSMC CEO: frontend and backend capacity related to AI remain very tight; company working to narrow CoWoS demand-supply gap into 2026 (3Q25 call)." },
    capacity_pressure: { value: 0.90, rationale: "Capacity expanding (management: still increasing 2026 CoWoS) but not enough to close gap; advanced packaging revenue already >10% and growing faster than corporate (4Q25)." },
    capacity_growth: { value: 0.72, rationale: "Secondary reporting of ~80% CAGR CoWoS 2022–2027 and multi-site AP expansions; growth is real but lagging demand." },
    supplier_concentration: { value: 0.93, rationale: "Leading-edge CoWoS-class AI packaging remains dominated by TSMC; limited true substitutes for NVIDIA-class packages." },
    lead_time_pressure: { value: 0.88, rationale: "Persistent allocation behavior and management refusal to declare surplus imply long booking windows." },
    yield_risk: { value: 0.58, rationale: "Multi-die + HBM packages raise yield complexity; not claimed as the primary stated bottleneck vs capacity." },
    technology_maturity: { value: 0.78, rationale: "CoWoS is in high-volume production; maturity high relative to CPO/SoIC leading edge." },
    qualification_difficulty: { value: 0.85, rationale: "Customer qualification and allocation stickiness make switching packagers slow." },
    substitution_difficulty: { value: 0.92, rationale: "Intel EMIB / OSAT alternatives exist for some designs but not as drop-in for current TSMC CoWoS AI flagships." },
    geographic_concentration: { value: 0.88, rationale: "Major CoWoS capacity concentrated in Taiwan AP sites; Arizona packaging announced but later." },
    downstream_importance: { value: 0.98, rationale: "Almost every leading AI accelerator attach path depends on CoWoS-class packaging + HBM." },
    evidence_confidence: { value: 0.82, rationale: "Primary earnings transcripts + consistent secondary capacity reporting; exact WPM still not officially disclosed." }
  }),
  obs("hbm4", {
    demand_pressure: { value: 0.94, rationale: "Next-gen platforms (e.g. Vera Rubin) designed around HBM4; SK hynix states HBM demand exceeds its capacity for next 3 years (earnings commentary via secondary)." },
    capacity_pressure: { value: 0.88, rationale: "SK hynix ramping HBM4 after first-in-industry MP prep (Sep 2025) and maximizing M15X; Micron in HVP Q1 2026 — supply rising but still scarce." },
    capacity_growth: { value: 0.70, rationale: "M15X, Yongin, Indiana packaging, and Micron HVP indicate rapid growth from a low base." },
    supplier_concentration: { value: 0.82, rationale: "Only three qualified HBM makers; SK hynix claims unique stable dual supply of HBM3E+HBM4." },
    lead_time_pressure: { value: 0.86, rationale: "Allocation / partnership language and demand>capacity statements imply constrained lead times." },
    yield_risk: { value: 0.55, rationale: "SK indicates HBM4 yield/quality approaching HBM3E maturity on ramp; residual new-node risk remains." },
    technology_maturity: { value: 0.62, rationale: "12H in volume; 16H still sampling/qualification — mid maturity." },
    qualification_difficulty: { value: 0.88, rationale: "Accelerator vendors qualify specific stacks; switching suppliers is slow." },
    substitution_difficulty: { value: 0.90, rationale: "No near-term substitute for HBM bandwidth/capacity in package; GDDR/LPDDR not equivalent." },
    geographic_concentration: { value: 0.75, rationale: "Korea-centric with US packaging expansions starting; Micron adds geographic diversity." },
    downstream_importance: { value: 0.97, rationale: "Next-gen accelerator roadmaps explicitly pair to HBM4." },
    evidence_confidence: { value: 0.84, rationale: "Strong primary company disclosures from SK hynix and Micron; demand>capacity partly via secondary earnings report." }
  }),
  obs("hbm3e", {
    demand_pressure: { value: 0.90, rationale: "SK hynix: HBM revenue more than doubled YoY in FY25; HBM3E remains main volume product alongside HBM4 ramp." },
    capacity_pressure: { value: 0.84, rationale: "Company maximizing HBM capacity (M15X) amid supply-demand imbalance; still allocating between HBM and conventional DRAM." },
    capacity_growth: { value: 0.65, rationale: "Fab expansions underway but HBM wafer intensity limits effective bit growth." },
    supplier_concentration: { value: 0.80, rationale: "Three suppliers; SK hynix positioned as leading stable HBM3E+HBM4 supplier." },
    lead_time_pressure: { value: 0.80, rationale: "Imbalance language implies continued allocation." },
    yield_risk: { value: 0.40, rationale: "Mature relative to HBM4." },
    technology_maturity: { value: 0.85, rationale: "High-volume mature generation." },
    qualification_difficulty: { value: 0.75, rationale: "Established qualifications; still sticky." },
    substitution_difficulty: { value: 0.88, rationale: "Cannot freely substitute other DRAM classes for HBM3E attach." },
    geographic_concentration: { value: 0.72, rationale: "Korea-weighted supply." },
    downstream_importance: { value: 0.93, rationale: "Current accelerator fleets still HBM3E-heavy during transition." },
    evidence_confidence: { value: 0.80, rationale: "Primary FY25 results; exact industry capacity shares not officially tabulated." }
  }),
  obs("hbm-base-die", {
    demand_pressure: { value: 0.86, rationale: "Every HBM3E/HBM4 stack needs a base die; volume scales with HBM cubes." },
    capacity_pressure: { value: 0.78, rationale: "Less publicly quantified than DRAM wafers; Micron notes in-house CMOS base die on HBM4 reducing foundry dependence for that gen — implies base die is a distinct constraint surface." },
    capacity_growth: { value: 0.55, rationale: "Improves with HBM fab ramps; not independently disclosed." },
    supplier_concentration: { value: 0.78, rationale: "Tied to the three HBM makers (+ foundry partners for some gens)." },
    lead_time_pressure: { value: 0.72, rationale: "Inferred from stack lead times; weaker direct disclosure." },
    yield_risk: { value: 0.60, rationale: "Interface logic complexity and stacking interactions." },
    technology_maturity: { value: 0.68, rationale: "Mature for HBM3E; evolving for HBM4/custom." },
    qualification_difficulty: { value: 0.80, rationale: "Host interface qualification is strict." },
    substitution_difficulty: { value: 0.86, rationale: "Base die is integral to the stack; not independently substitutable." },
    geographic_concentration: { value: 0.70, rationale: "Follows HBM maker geography." },
    downstream_importance: { value: 0.90, rationale: "Blocks cube shipments if constrained." },
    evidence_confidence: { value: 0.55, rationale: "Structurally certain dependency; capacity metrics thinly disclosed — weaker evidence." }
  }),
  obs("hbm-stacking", {
    demand_pressure: { value: 0.88, rationale: "12H volume and 16H sampling (Micron/SK) raise stacking intensity per cube." },
    capacity_pressure: { value: 0.80, rationale: "SK building advanced packaging in Cheongju and Indiana for front+back-end integration — stacking/back-end treated as strategic capacity." },
    capacity_growth: { value: 0.60, rationale: "Packaging sites ramping; still catching demand." },
    supplier_concentration: { value: 0.78, rationale: "Stacking largely captive to HBM makers." },
    lead_time_pressure: { value: 0.75, rationale: "Back-end expansions imply prior tightness." },
    yield_risk: { value: 0.70, rationale: "Taller stacks increase bonding yield risk; 16H still in qual/samples." },
    technology_maturity: { value: 0.60, rationale: "12H mature-ish; 16H emerging." },
    qualification_difficulty: { value: 0.82, rationale: "Customer qual for stack height/speed bins." },
    substitution_difficulty: { value: 0.88, rationale: "No alternate stacking path for JEDEC HBM cubes." },
    geographic_concentration: { value: 0.70, rationale: "Korea + nascent US packaging." },
    downstream_importance: { value: 0.91, rationale: "Determines bits and bandwidth per package site." },
    evidence_confidence: { value: 0.62, rationale: "Company packaging investments primary; detailed stacking yields not public." }
  }),
  obs("hbm-test", {
    demand_pressure: { value: 0.80, rationale: "Each cube requires KGS test; scales with HBM output." },
    capacity_pressure: { value: 0.70, rationale: "Not directly quantified in filings; inferred process dependency." },
    capacity_growth: { value: 0.50, rationale: "Assumed to track fab expansions." },
    supplier_concentration: { value: 0.75, rationale: "Captive to HBM makers + ATE ecosystem." },
    lead_time_pressure: { value: 0.65, rationale: "Inferred; weaker disclosure." },
    yield_risk: { value: 0.55, rationale: "Test escapes vs overkill tradeoff." },
    technology_maturity: { value: 0.70, rationale: "Established flows for HBM3E; adapting for HBM4." },
    qualification_difficulty: { value: 0.70, rationale: "Coverage requirements set by customers." },
    substitution_difficulty: { value: 0.72, rationale: "Cannot skip stack test for AI reliability targets." },
    geographic_concentration: { value: 0.68, rationale: "Follows maker sites." },
    downstream_importance: { value: 0.82, rationale: "Gates shippable cubes." },
    evidence_confidence: { value: 0.42, rationale: "WEAK — structural inference, few direct public capacity claims." }
  }),
  obs("advanced-interposer", {
    demand_pressure: { value: 0.90, rationale: "CoWoS packages require interposers sized for multi-HBM; demand tracks CoWoS tightness." },
    capacity_pressure: { value: 0.84, rationale: "Bundled inside TSMC advanced packaging constraint set on earnings calls." },
    capacity_growth: { value: 0.60, rationale: "Expands with AP fabs." },
    supplier_concentration: { value: 0.90, rationale: "Leading-edge silicon interposer capacity concentrated at TSMC for AI flagships." },
    lead_time_pressure: { value: 0.80, rationale: "Inherits CoWoS allocation pressure." },
    yield_risk: { value: 0.62, rationale: "Large interposers have yield sensitivity." },
    technology_maturity: { value: 0.75, rationale: "Production proven." },
    qualification_difficulty: { value: 0.80, rationale: "Tied to package quals." },
    substitution_difficulty: { value: 0.85, rationale: "RDL/bridge alternatives exist but redesign-heavy." },
    geographic_concentration: { value: 0.88, rationale: "Taiwan-centric." },
    downstream_importance: { value: 0.94, rationale: "Required for CoWoS-class AI packages." },
    evidence_confidence: { value: 0.68, rationale: "Strong dependency logic; less standalone primary metrics than CoWoS headline." }
  }),
  obs("package-substrate", {
    demand_pressure: { value: 0.85, rationale: "Large AI packages increase substrate area/layer demand with CoWoS ramps." },
    capacity_pressure: { value: 0.78, rationale: "Industry repeatedly cites substrates as co-constraint; less explicit in TSMC transcripts than CoWoS." },
    capacity_growth: { value: 0.55, rationale: "Supplier expansions ongoing; not TSMC-owned solely." },
    supplier_concentration: { value: 0.72, rationale: "Fewer qualified advanced substrate makers for large AI packages." },
    lead_time_pressure: { value: 0.75, rationale: "Historically long substrate lead times for high-layer counts." },
    yield_risk: { value: 0.55, rationale: "Warpage/yield on large substrates." },
    technology_maturity: { value: 0.70, rationale: "Mature industry with advancing layer counts." },
    qualification_difficulty: { value: 0.78, rationale: "Package-specific quals." },
    substitution_difficulty: { value: 0.80, rationale: "Limited drop-in substitutes for high-end AI substrates." },
    geographic_concentration: { value: 0.70, rationale: "Asia-weighted supply chain." },
    downstream_importance: { value: 0.88, rationale: "Blocks package completion after die attach." },
    evidence_confidence: { value: 0.50, rationale: "MODERATE/WEAK — fewer primary citations in this pass; structural + secondary." }
  }),
  obs("hybrid-bonding", {
    demand_pressure: { value: 0.82, rationale: "TSMC SoIC / hybrid bonding called out as fast-growing with AI 3D stacking; C.C. Wei cites TSMC-SoIC in NVIDIA CPO collaboration." },
    capacity_pressure: { value: 0.80, rationale: "Secondary: SoIC capacity still small vs CoWoS (tens of k WPM targets) while demand for denser stacking rises." },
    capacity_growth: { value: 0.75, rationale: "Reported ~90% CAGR SoIC capacity ambitions through 2027 (secondary summarizing TSMC)." },
    supplier_concentration: { value: 0.90, rationale: "Leading-edge SoIC hybrid bonding concentrated at TSMC." },
    lead_time_pressure: { value: 0.78, rationale: "Early HVM + high demand growth implies tightness." },
    yield_risk: { value: 0.72, rationale: "Fine-pitch Cu-Cu bonding yield is a known manufacturing challenge." },
    technology_maturity: { value: 0.55, rationale: "In volume at 6µm-class pitches; finer pitches still roadmap." },
    qualification_difficulty: { value: 0.85, rationale: "New 3D flows require extensive customer quals." },
    substitution_difficulty: { value: 0.88, rationale: "Microbump paths cannot match density/power targets for SoIC use cases." },
    geographic_concentration: { value: 0.88, rationale: "Taiwan AP sites." },
    downstream_importance: { value: 0.86, rationale: "Critical for SoIC and denser HBM/logic stacking paths; rising on future GPU roadmaps." },
    evidence_confidence: { value: 0.64, rationale: "Primary NVIDIA/TSMC collaboration quote; capacity CAGR mainly secondary." }
  }),
  obs("packaging-yield", {
    demand_pressure: { value: 0.88, rationale: "Every incremental CoWoS start is yield-sensitive; multi-HBM packages amplify loss cost." },
    capacity_pressure: { value: 0.76, rationale: "Effective capacity = tools × yield; TSMC stress on narrowing gap implicitly includes learning curves." },
    capacity_growth: { value: 0.55, rationale: "Learning improves effective output without new tools." },
    supplier_concentration: { value: 0.90, rationale: "Yield learning locked inside TSMC CoWoS flows." },
    lead_time_pressure: { value: 0.70, rationale: "Rework/scrap extends cycle times." },
    yield_risk: { value: 0.78, rationale: "Primary risk dimension for this node by definition." },
    technology_maturity: { value: 0.70, rationale: "Improving but package complexity rising." },
    qualification_difficulty: { value: 0.75, rationale: "Yield windows part of customer specs." },
    substitution_difficulty: { value: 0.85, rationale: "Cannot outsource yield of a captive flow easily." },
    geographic_concentration: { value: 0.88, rationale: "Taiwan." },
    downstream_importance: { value: 0.92, rationale: "Directly scales shippable accelerators per wafer start." },
    evidence_confidence: { value: 0.48, rationale: "WEAK/MODERATE — yield numbers not disclosed; modeled from process physics + capacity gap context." }
  }),
  obs("package-test", {
    demand_pressure: { value: 0.78, rationale: "Final test required for each AI package." },
    capacity_pressure: { value: 0.68, rationale: "Not singled out on TSMC calls; structural risk as package complexity rises." },
    capacity_growth: { value: 0.50, rationale: "Assumed to lag package growth." },
    supplier_concentration: { value: 0.70, rationale: "Foundry + OSAT test ecosystems." },
    lead_time_pressure: { value: 0.62, rationale: "Inferred." },
    yield_risk: { value: 0.50, rationale: "Test coverage vs time tradeoff." },
    technology_maturity: { value: 0.72, rationale: "Mature ATE with evolving protocols." },
    qualification_difficulty: { value: 0.70, rationale: "Customer test programs." },
    substitution_difficulty: { value: 0.68, rationale: "Some parallelization possible but limited." },
    geographic_concentration: { value: 0.65, rationale: "Asia-weighted." },
    downstream_importance: { value: 0.80, rationale: "Last gate before shipment." },
    evidence_confidence: { value: 0.38, rationale: "WEAK — few direct primary disclosures in this pass." }
  }),
  obs("electrical-serdes", {
    demand_pressure: { value: 0.78, rationale: "AI scale-up still heavily electrical; NVIDIA CPO materials cite limits of electrical signaling at factory scale." },
    capacity_pressure: { value: 0.45, rationale: "SerDes IP/silicon not the scarce wafer constraint vs HBM/CoWoS." },
    capacity_growth: { value: 0.60, rationale: "Generational SerDes cadence continues." },
    supplier_concentration: { value: 0.55, rationale: "Multiple SoC vendors implement SerDes." },
    lead_time_pressure: { value: 0.40, rationale: "Not allocation-constrained like packaging." },
    yield_risk: { value: 0.35, rationale: "Mature relative to photonics." },
    technology_maturity: { value: 0.85, rationale: "High." },
    qualification_difficulty: { value: 0.55, rationale: "Standardized evolving specs." },
    substitution_difficulty: { value: 0.50, rationale: "Can migrate traffic to optics over time — that is the point of CPO." },
    geographic_concentration: { value: 0.40, rationale: "Broad." },
    downstream_importance: { value: 0.84, rationale: "Still carries most near-term scale-up bandwidth." },
    evidence_confidence: { value: 0.70, rationale: "Primary NVIDIA CPO rationale materials; SerDes scarcity itself less evidenced." }
  }),
  obs("silicon-photonics", {
    demand_pressure: { value: 0.80, rationale: "NVIDIA CPO platforms integrate silicon photonics to scale AI factories; Spectrum-X Photonics H2 2026 availability stated." },
    capacity_pressure: { value: 0.72, rationale: "Early HVM ecosystem (TSMC + partners); capacity not yet commodity." },
    capacity_growth: { value: 0.65, rationale: "Explicit platform ramp 2025–2026." },
    supplier_concentration: { value: 0.75, rationale: "NVIDIA ecosystem names TSMC and specialty photonics partners — concentrated leading edge." },
    lead_time_pressure: { value: 0.68, rationale: "New platform ramps typically tight." },
    yield_risk: { value: 0.70, rationale: "Photonic yield historically challenging vs pure CMOS." },
    technology_maturity: { value: 0.48, rationale: "Shipping/ramping CPO switches; not yet ubiquitous." },
    qualification_difficulty: { value: 0.85, rationale: "New optical networking quals." },
    substitution_difficulty: { value: 0.80, rationale: "Pluggables remain substitute but with power/density penalties NVIDIA quantifies." },
    geographic_concentration: { value: 0.70, rationale: "Foundry + optics supply chain concentrated." },
    downstream_importance: { value: 0.86, rationale: "Foundation for CPO scale-out networking (and future package optical I/O)." },
    evidence_confidence: { value: 0.78, rationale: "Strong primary NVIDIA disclosures; accelerator-package optical I/O still earlier than switch CPO." }
  }),
  obs("optical-engine", {
    demand_pressure: { value: 0.78, rationale: "CPO switches require integrated optical engines on package." },
    capacity_pressure: { value: 0.74, rationale: "Engine assembly is a new high-volume manufacturing flow per NVIDIA technical materials." },
    capacity_growth: { value: 0.60, rationale: "Tracks CPO platform availability." },
    supplier_concentration: { value: 0.78, rationale: "NVIDIA + TSMC + named ecosystem partners." },
    lead_time_pressure: { value: 0.70, rationale: "Ramp-phase tightness expected." },
    yield_risk: { value: 0.75, rationale: "Detachable fiber attach and engine yield called out as manufacturing focus." },
    technology_maturity: { value: 0.45, rationale: "Early commercial CPO generation." },
    qualification_difficulty: { value: 0.85, rationale: "System-level optical quals." },
    substitution_difficulty: { value: 0.82, rationale: "Pluggable engines differ architecturally." },
    geographic_concentration: { value: 0.70, rationale: "Concentrated partner set." },
    downstream_importance: { value: 0.84, rationale: "Without engines, CPO switches do not ship." },
    evidence_confidence: { value: 0.66, rationale: "Primary product/tech blogs; limited independent capacity audits." }
  }),
  obs("cpo-integration", {
    demand_pressure: { value: 0.82, rationale: "NVIDIA positions CPO as required to scale AI factories to millions of GPUs with major power/resiliency gains." },
    capacity_pressure: { value: 0.76, rationale: "Quantum-X then Spectrum-X phased availability (2025–2026); not yet broad HVM commodity." },
    capacity_growth: { value: 0.68, rationale: "Staged platform introductions indicate rapid intended growth from small base." },
    supplier_concentration: { value: 0.80, rationale: "NVIDIA-led CPO switch stack with TSMC photonics/SoIC." },
    lead_time_pressure: { value: 0.72, rationale: "New product introduction constraints." },
    yield_risk: { value: 0.72, rationale: "Co-packaging optics + ASIC is yield-sensitive." },
    technology_maturity: { value: 0.42, rationale: "First-generation AI-factory CPO switches." },
    qualification_difficulty: { value: 0.88, rationale: "Hyperscaler network quals." },
    substitution_difficulty: { value: 0.78, rationale: "Pluggables substitute at efficiency cost; not equivalent at scale targets." },
    geographic_concentration: { value: 0.70, rationale: "Partner manufacturing concentrated." },
    downstream_importance: { value: 0.88, rationale: "Scale-across networking for AI factories; later may bind package I/O." },
    evidence_confidence: { value: 0.80, rationale: "Primary NVIDIA newsroom + product pages; accelerator-on-package CPO still less evidenced than switch CPO." }
  }),
  obs("laser-source", {
    demand_pressure: { value: 0.70, rationale: "NVIDIA claims CPO innovations use 4x fewer lasers vs traditional methods — lasers remain necessary." },
    capacity_pressure: { value: 0.60, rationale: "Named ecosystem includes Coherent, Lumentum; scarcity not proven in primary NVIDIA materials." },
    capacity_growth: { value: 0.55, rationale: "Assumed expandable with photonics market." },
    supplier_concentration: { value: 0.70, rationale: "Specialty laser suppliers; not infinitely deep." },
    lead_time_pressure: { value: 0.55, rationale: "Insufficient primary evidence of allocation crisis." },
    yield_risk: { value: 0.50, rationale: "Laser reliability matters; limited public yield data." },
    technology_maturity: { value: 0.65, rationale: "Mature lasers; integration schemes newer." },
    qualification_difficulty: { value: 0.70, rationale: "Telecom/AI optical quals." },
    substitution_difficulty: { value: 0.65, rationale: "Multiple laser vendors exist; architecture can reduce count." },
    geographic_concentration: { value: 0.55, rationale: "Global specialty suppliers." },
    downstream_importance: { value: 0.75, rationale: "Required for engines but mitigated by fewer-lasers designs." },
    evidence_confidence: { value: 0.40, rationale: "WEAK — ecosystem named; no strong primary capacity-crunch evidence." }
  }),
  obs("bonding-equipment", {
    demand_pressure: { value: 0.84, rationale: "HBM stacking + SoIC hybrid bonding both consume advanced bonders as volumes scale." },
    capacity_pressure: { value: 0.78, rationale: "Secondary supply-chain notes Besi/AMAT/TEL benefit from SoIC/HBM bonding demand; tool lead times historically long." },
    capacity_growth: { value: 0.50, rationale: "Tool makers ramp but semiconductor equipment lead times lag." },
    supplier_concentration: { value: 0.85, rationale: "Few leading hybrid bonder suppliers." },
    lead_time_pressure: { value: 0.82, rationale: "Capital equipment lead times typically multi-quarter." },
    yield_risk: { value: 0.40, rationale: "Tools themselves mature; process recipes vary." },
    technology_maturity: { value: 0.70, rationale: "Production tools available." },
    qualification_difficulty: { value: 0.75, rationale: "Fab tool quals." },
    substitution_difficulty: { value: 0.88, rationale: "Limited alternate bonder ecosystems for leading hybrid bonding." },
    geographic_concentration: { value: 0.60, rationale: "EU/US/JP tool makers; install base in Asia fabs." },
    downstream_importance: { value: 0.88, rationale: "Gates both HBM cube output and SoIC." },
    evidence_confidence: { value: 0.52, rationale: "MODERATE — demand link strong; tool scarcity evidence mostly secondary." }
  }),
  obs("inspection-metrology", {
    demand_pressure: { value: 0.80, rationale: "Fine-pitch bonding and large interposers require heavy inspection/metrology." },
    capacity_pressure: { value: 0.72, rationale: "Typically scales with packaging; rarely disclosed as headline bottleneck." },
    capacity_growth: { value: 0.50, rationale: "Tracks equipment purchases." },
    supplier_concentration: { value: 0.75, rationale: "Concentrated metrology vendors." },
    lead_time_pressure: { value: 0.70, rationale: "Equipment lead times." },
    yield_risk: { value: 0.45, rationale: "Metrology enables yield; node risk is throughput." },
    technology_maturity: { value: 0.75, rationale: "Mature tools, new recipes." },
    qualification_difficulty: { value: 0.65, rationale: "Process of record integration." },
    substitution_difficulty: { value: 0.70, rationale: "Some sampling strategies reduce need but cannot eliminate." },
    geographic_concentration: { value: 0.55, rationale: "Global tool vendors." },
    downstream_importance: { value: 0.82, rationale: "Yield learning rate for packaging/HBM." },
    evidence_confidence: { value: 0.45, rationale: "WEAK/MODERATE — physically motivated; thin primary citations." }
  }),
  obs("advanced-test", {
    demand_pressure: { value: 0.78, rationale: "HBM + AI package test content rising with complexity." },
    capacity_pressure: { value: 0.70, rationale: "Structural; not a TSMC earnings headline." },
    capacity_growth: { value: 0.48, rationale: "ATE expansions lag product complexity." },
    supplier_concentration: { value: 0.72, rationale: "Concentrated ATE vendors." },
    lead_time_pressure: { value: 0.68, rationale: "Equipment lead times." },
    yield_risk: { value: 0.40, rationale: "Test quality risk more than tool yield." },
    technology_maturity: { value: 0.70, rationale: "Mature ATE evolving." },
    qualification_difficulty: { value: 0.70, rationale: "Program development." },
    substitution_difficulty: { value: 0.75, rationale: "Hard to skip advanced test on AI parts." },
    geographic_concentration: { value: 0.55, rationale: "Global." },
    downstream_importance: { value: 0.80, rationale: "Shared dependency of HBM test and package test." },
    evidence_confidence: { value: 0.40, rationale: "WEAK — included as connecting equipment node; sparse primary capacity evidence." }
  })
];

out("data/constraints.json", {
  status: "EVIDENCE_BACKED",
  disclaimer: "MODELED values are transparent engineering judgments mapped from OBSERVED claims. Not scientifically calibrated.",
  observations
});

const claims = [
  claim("c001", "cowos", "TSMC CEO C.C. Wei: AI-related frontend and backend capacity is very tight; company working hard to narrow CoWoS demand-supply gap and continue increasing CoWoS capacity in 2026.", "tsmc_3q25", "COMPANY_CLAIM", 0.92),
  claim("c002", "cowos", "TSMC CFO: advanced packaging revenue contribution slightly over 10% in 2025 (about 8% in 2024), expected to grow faster than corporate average to low-teens % in 2026.", "tsmc_4q25", "COMPANY_CLAIM", 0.90),
  claim("c003", "hbm3e", "SK hynix: HBM revenue more than doubled year-on-year in FY2025, significantly contributing to record results.", "skh_fy25", "COMPANY_CLAIM", 0.93),
  claim("c004", "hbm4", "SK hynix: completed preparations to mass-produce HBM4 first in industry in September 2025; large-scale next-gen HBM production underway; claims ability to stably supply both HBM3E and HBM4.", "skh_fy25", "COMPANY_CLAIM", 0.91),
  claim("c005", "hbm4", "SK hynix prioritizing meeting demand amid supply-demand imbalances; maximizing M15X Cheongju capacity early; building Yongin cluster for mid/long-term capacity.", "skh_fy25", "COMPANY_CLAIM", 0.90),
  claim("c006", "hbm4", "Micron: high-volume production of HBM4 36GB 12H began Q1 CY2026, designed for NVIDIA Vera Rubin; >2.8 TB/s bandwidth; sampling HBM4 48GB 16H.", "micron_hbm4", "COMPANY_CLAIM", 0.94),
  claim("c007", "hbm-stacking", "Micron demonstrated 16-die HBM stacking capability by shipping HBM4 48GB 16H samples (33% more capacity per placement vs 12H).", "micron_hbm4", "COMPANY_CLAIM", 0.90),
  claim("c008", "hbm-stacking", "SK hynix advanced packaging facilities in Cheongju and Indiana progressing to establish integrated front-end and back-end manufacturing.", "skh_fy25", "COMPANY_CLAIM", 0.88),
  claim("c009", "cpo-integration", "NVIDIA unveiled Spectrum-X and Quantum-X silicon photonics CPO networking switches to scale AI factories to millions of GPUs with major efficiency/resiliency gains.", "nvda_cpo", "COMPANY_CLAIM", 0.92),
  claim("c010", "cpo-integration", "NVIDIA: Quantum-X Photonics InfiniBand expected later in 2025; Spectrum-X Photonics Ethernet switches coming in 2026.", "nvda_cpo", "COMPANY_CLAIM", 0.90),
  claim("c011", "silicon-photonics", "TSMC CEO quoted in NVIDIA release: TSMC silicon photonics combines cutting-edge manufacturing and TSMC-SoIC 3D stacking to help scale AI factories.", "nvda_cpo", "COMPANY_CLAIM", 0.88),
  claim("c012", "silicon-photonics", "NVIDIA product materials: CPO switches with integrated silicon photonics replace pluggables; Spectrum-X Ethernet Photonics available second half 2026.", "nvda_sipho", "COMPANY_CLAIM", 0.88),
  claim("c013", "optical-engine", "NVIDIA ecosystem for silicon photonics CPO includes TSMC, Coherent, Corning, Fabrinet, Foxconn, Lumentum, SENKO, SPIL, Sumitomo Electric, among others.", "nvda_cpo", "FACT", 0.90),
  claim("c014", "laser-source", "NVIDIA states photonics switches integrate optics innovations with 4x fewer lasers versus traditional methods.", "nvda_cpo", "COMPANY_CLAIM", 0.85),
  claim("c015", "hybrid-bonding", "TSMC-SoIC 3D chip stacking cited by TSMC CEO as part of silicon photonics solution enabling NVIDIA CPO scale-out.", "nvda_cpo", "COMPANY_CLAIM", 0.86),
  claim("c016", "cowos", "Secondary: TSMC CoWoS capacity described as growing at ~80% CAGR 2022–2027 while still insufficient relative to AI demand.", "toms_tsmc", "ESTIMATE", 0.70, "Secondary summary of TSMC remarks / industry analysis"),
  claim("c017", "cowos", "Secondary (Dec 2024): supply-chain estimates of TSMC CoWoS monthly capacity rising toward ~90k wpm by end-2026 via AP site expansions.", "trend_cowos", "ESTIMATE", 0.55, "Aged secondary estimate — not an official TSMC WPM disclosure"),
  claim("c018", "hbm4", "Secondary: SK hynix earnings commentary that HBM demand required over next three years exceeds its production capacity.", "skh_sedaily", "COMPANY_CLAIM", 0.75, "Reported via secondary; treat as company commentary pending transcript"),
  claim("c019", "hbm4", "Secondary: SK hynix says HBM4 12-layer in mass production; 16-layer in qualification (Hot Chips / company remarks).", "herald_hbm4", "COMPANY_CLAIM", 0.72),
  claim("c020", "advanced-interposer", "CoWoS-class AI packages depend on interposer capacity inside TSMC advanced packaging; backend tightness stated on 3Q25 call applies to packaging stack.", "tsmc_3q25", "INFERENCE", 0.78),
  claim("c021", "bonding-equipment", "Secondary supply-chain reporting links NVIDIA SoIC adoption path to demand for bonding/metrology tools (Besi, Applied Materials, TEL).", "toms_tsmc", "INFERENCE", 0.55, "Indirect secondary"),
  claim("c022", "electrical-serdes", "NVIDIA: as AI factories grow, networks must evolve; CPO integrates optics because traditional electrical/pluggable approaches hit scale limits.", "nvda_cpo", "COMPANY_CLAIM", 0.88),
  claim("c023", "packaging-yield", "Multi-die CoWoS + HBM packages make effective capacity a function of yield as well as tool counts; TSMC emphasizes narrowing demand-supply gap without publishing yield figures.", "tsmc_3q25", "INFERENCE", 0.60),
  claim("c024", "hbm-base-die", "Micron HBM4 volume product uses company base-die path for this generation (public technical summaries of Micron HBM4 architecture); base die is a distinct manufacturing surface from DRAM wafers.", "micron_hbm4", "INFERENCE", 0.65),
  claim("c025", "hbm-test", "HBM cubes require known-good-stack test before package attach; scales directly with HBM unit volume though capacity is not broken out in filings.", "skh_fy25", "INFERENCE", 0.50),
  claim("c026", "package-substrate", "Large AI CoWoS packages require advanced substrates; substrate scarcity is a recurring industry constraint though not quantified on TSMC 3Q/4Q25 transcripts reviewed here.", "tsmc_4q25", "INFERENCE", 0.48, "Weak primary — flagged"),
  claim("c027", "package-test", "Final package test is required for AI accelerators; complexity rises with multi-die packages. Direct capacity figures not found in primary sources this pass.", "tsmc_4q25", "UNKNOWN", 0.35),
  claim("c028", "inspection-metrology", "Hybrid bonding / fine-pitch packaging increases inspection and metrology intensity; treated as enabling equipment for yield learning.", "nvda_cpo", "INFERENCE", 0.45),
  claim("c029", "advanced-test", "Advanced test equipment is a shared dependency of HBM stack test and package test; primary capacity evidence sparse in this pass.", "skh_fy25", "UNKNOWN", 0.35),
  claim("c030", "hbm3e", "SK hynix: only industry player (self-claim) capable of stably supplying both HBM3E and HBM4 simultaneously.", "skh_fy25", "COMPANY_CLAIM", 0.80)
];

out("data/evidence.json", {
  status: "EVIDENCE_BACKED",
  disclaimer: "OBSERVED claims only. No fabricated citations. Secondary/aged sources labeled.",
  source_inventory: Object.entries(sources).map(([id, s]) => ({ id, ...s })),
  claims
});

console.log("Wrote evidence-backed dataset:", nodes.length, "nodes,", claims.length, "claims");
console.log(
  "Primary sources:",
  Object.values(sources).filter((s) => s.class === "primary").length,
  "Secondary:",
  Object.values(sources).filter((s) => s.class === "secondary").length
);

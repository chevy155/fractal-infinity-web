/** Generate product placeholder + hub pages. Run: node scripts/gen-product-pages.mjs */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function page({ title, section, headline, sub, desc, does, why, example, status, liveBody }) {
  const soon = status === "soon";
  const badge = soon
    ? `<p class="fi-soon-badge">Coming Soon</p>`
    : `<p class="fi-live-badge">Available</p>`;
  const body = liveBody || `
    <section class="fi-product-block">
      <h2 class="fi-h2">What it will do</h2>
      <p>${does}</p>
    </section>
    <section class="fi-product-block">
      <h2 class="fi-h2">Why it matters</h2>
      <p>${why}</p>
    </section>
    <section class="fi-product-block">
      <h2 class="fi-h2">Example</h2>
      <p class="fi-example">${example}</p>
    </section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — Fractal Infinity</title>
<meta name="description" content="${desc.replace(/"/g, "&quot;")}" />
<link rel="icon" href="../assets/archival-portal.jpg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../styles.css" />
</head>
<body class="fi-product-page">
<div class="topbar">
  <div class="wrap">
    <a href="../index.html" class="topbar-brand"><img src="../assets/archival-portal.jpg" alt="" />FRACTAL INFINITY</a>
    <nav class="topbar-nav">
      <a href="../labs/deep-research.html">Labs</a>
      <a href="../tools/crucible.html">Analysis</a>
      <a href="../intelligence/research-reports.html">Intelligence</a>
    </nav>
    <a href="../index.html" class="btn btn-ghost">&larr; Home</a>
  </div>
</div>
<main class="wrap fi-product">
  <p class="fi-kicker">${section}</p>
  <h1 class="fi-headline">${headline}</h1>
  ${sub ? `<p class="fi-sub">${sub}</p>` : ""}
  <p class="fi-lede">${desc}</p>
  ${badge}
  ${body}
  <p class="section-footer-link"><a href="../index.html">&larr; Home</a> · <a href="../reports.html">Reports</a></p>
</main>
<script src="../js/product-rail.js"></script>
</body>
</html>`;
}

const soon = [
  { file: "labs/deep-research.html", section: "Labs", headline: "Deep Research Lab", desc: "Investigate a company, product, technology, engineering design, investment or market using traceable factual sources.", does: "Uses factual and technical sources to organize the important facts, company claims, independent evidence, competitors, technologies, suppliers, manufacturing dependencies, risks, disagreements and unresolved questions around a difficult subject.", why: "Replace days or weeks of fragmented research with an organized factual starting point showing what is known, what is disputed and what actually matters.", example: "Research ASML's next-generation lithography roadmap, suppliers, technical limits, competitors and manufacturing risks." },
  { file: "labs/supplier-substitute.html", section: "Labs", headline: "Supplier & Substitute Finder", desc: "Find credible replacement parts, suppliers, materials and manufacturing routes when the current option becomes unavailable, expensive or too slow.", does: "Starts with a constrained part, supplier, material or manufacturing process and looks for realistic alternatives while considering technical compatibility, qualification requirements, redesign needs, switching time and switching cost.", why: "Do not stop at identifying the shortage. Find realistic paths around it.", example: "Our aerospace connector has a 16-month lead time. Find qualified alternatives and identify which require redesign or requalification." },
  { file: "labs/dataset-builder.html", section: "Labs", headline: "Custom Dataset Builder", desc: "Turn information scattered across filings, websites, databases and technical sources into a clean, sourced dataset ready for Excel, software or AI agents.", does: "Researches a requested subject, collects fragmented records and organizes them into consistent fields rather than leaving the information scattered across documents and websites.", why: "Turn difficult-to-assemble public and technical information into structured data that can be used for analysis, software or AI workflows.", example: "Build every announced U.S. AI datacenter above 100 MW with developer, location, utility, MW demand, interconnection status and construction status." },
  { file: "tools/bottleneck-xray.html", section: "Analysis Tools", headline: "Bottleneck & Supply Chain X-Ray", desc: "Find the components, suppliers, manufacturing processes and physical infrastructure capable of stopping a product, project or industry from scaling.", does: "Takes apart a product, factory, technology, infrastructure project or industry and looks through its components, suppliers, materials, manufacturing equipment, production capacity, energy, infrastructure, permits, logistics and qualification requirements to find what is most capable of limiting growth.", why: "Find the small hidden constraint capable of controlling, delaying or reshaping a much larger market.", example: "What components or infrastructure could prevent humanoid robot production from increasing 10x?" },
  { file: "tools/thesis-risk-monitor.html", section: "Analysis Tools", headline: "Thesis & Risk Monitor", desc: "Know when new evidence materially changes an existing investment thesis, engineering plan, supplier decision or strategic conclusion.", does: "Watches the assumptions, prices, suppliers, projects, regulations, technical milestones and market conditions supporting an existing conclusion and surfaces changes when they matter enough to reconsider it.", why: "Avoid drowning in news and alerts. Surface changes only when they meaningfully affect an existing conclusion.", example: "Our uranium thesis was 81 percent confidence. Two mine restarts changed the supply model. Recalculate it." },
  { file: "tools/evidence-dependency-map.html", section: "Analysis Tools", headline: "Evidence & Dependency Map", desc: "See what a company, product or technology depends on and trace important conclusions back to their factual evidence.", does: "Connects companies, products, factories, suppliers, technologies, materials and infrastructure so users can inspect hidden dependencies and understand the evidence supporting important relationships.", why: "Expose hidden dependencies and make important conclusions inspectable rather than asking users to trust generated prose.", example: "NVIDIA Blackwell → HBM → SK Hynix → advanced packaging → TSMC → CoWoS → packaging equipment → facilities → power" },
  { file: "intelligence/live-datasets.html", section: "Intelligence", headline: "Live Industry Datasets", desc: "Structured datasets about industries and physical systems whose underlying facts change over time.", does: "Keeps selected high-value industry records organized and current so users do not have to rebuild the same dataset every time they need it.", why: "Use current, organized industry data for analysis, engineering, investment research, software or AI workflows.", example: "AI datacenter projects · semiconductor capacity · advanced packaging · nuclear projects · critical minerals · industrial power" },
  { file: "intelligence/supply-chain-maps.html", section: "Intelligence", headline: "Supply-Chain Maps", desc: "Show how important products and industries depend on suppliers, components, processes, materials and infrastructure.", does: "Presents complex supply and production chains so users can see what depends on what and where concentration or exposure may exist.", why: "See where hidden supplier, material, manufacturing or infrastructure exposure exists before it becomes a problem.", example: "Map the supply chain behind advanced AI accelerators from chips through packaging, equipment, power and facilities." },
  { file: "intelligence/bottleneck-reports.html", section: "Intelligence", headline: "Bottleneck Reports", desc: "Explain which constraints are most likely to control the growth, schedule or economics of an important product, project or industry.", does: "Turns bottleneck analysis into a clear report explaining which constraints matter most, why they matter and what they could affect.", why: "Understand what actually limits an industry's ability to scale and why that constraint matters economically.", example: "Identify the most important physical constraints facing large-scale AI datacenter expansion." },
  { file: "intelligence/predictions.html", section: "Intelligence", headline: "Prediction Track Record", desc: "See what Fractal predicted before the outcome was known, how confident it was and whether the prediction eventually proved correct.", does: "Preserves important Fractal forecasts and their eventual outcomes so Fractal develops a visible record of being right and wrong.", why: "Before trusting Fractal with an important decision, inspect how previous predictions performed.", example: "Fractal predicted an advanced-packaging shortage through 2028 at 79 percent confidence. Track the outcome." }
];

for (const p of soon) {
  writeFileSync(join(root, p.file), page({ ...p, title: p.headline, status: "soon" }));
  console.log("wrote", p.file);
}

writeFileSync(join(root, "tools/crucible.html"), page({
  title: "The Crucible — Decision Simulator",
  section: "Analysis Tools",
  headline: "The Crucible",
  sub: "Decision Simulator",
  desc: "Stress-test an investment, engineering plan or business decision against thousands of realistic ways the future could unfold.",
  status: "live",
  liveBody: `
    <section class="fi-product-block">
      <h2 class="fi-h2">What it does</h2>
      <p>Takes competing decisions and tests them across plausible futures involving demand changes, shortages, price shocks, delays, wars, regulation, technical failures, supplier problems and competitor moves.</p>
    </section>
    <section class="fi-product-block">
      <h2 class="fi-h2">Why it matters</h2>
      <p>Do not rely on one forecast. Find the decision that survives many plausible futures and understand what could make it fail.</p>
    </section>
    <section class="fi-product-block">
      <h2 class="fi-h2">Live simulations</h2>
      <ul class="fi-live-list">
        <li><a href="../crucible.html">Ayar Labs vs Lightmatter</a> — photonic interconnect</li>
        <li><a href="../memory-crucible.html">SK hynix · Micron · Samsung</a> — HBM / AI memory</li>
        <li><a href="../materials-crucible.html">URNM × REMX</a> — strategic materials</li>
      </ul>
    </section>`
}));

writeFileSync(join(root, "intelligence/research-reports.html"), page({
  title: "Research Reports",
  section: "Intelligence",
  headline: "Research Reports",
  desc: "Clear human-readable outputs from Fractal research and analysis.",
  status: "live",
  liveBody: `
    <section class="fi-product-block">
      <h2 class="fi-h2">What it does</h2>
      <p>Packages important factual findings, evidence, disagreements, risks and conclusions into a readable document for engineers, executives, investors and decision teams.</p>
    </section>
    <section class="fi-product-block">
      <h2 class="fi-h2">Available now</h2>
      <ul class="fi-live-list">
        <li><a href="../reports.html">All Reports &amp; Comparisons</a></li>
        <li><a href="../report/sample.html">Sample Process X-Ray</a></li>
        <li><a href="../research-lab.html">Process Intelligence (Research Alpha)</a></li>
      </ul>
    </section>`
}));

writeFileSync(join(root, "intelligence/crucible-results.html"), page({
  title: "Crucible Results",
  section: "Intelligence",
  headline: "Crucible Results",
  desc: "Selected decision stress tests showing which options survive the widest range of plausible futures.",
  status: "live",
  liveBody: `
    <section class="fi-product-block">
      <h2 class="fi-h2">Why it matters</h2>
      <p>See which choices remain robust when assumptions fail.</p>
    </section>
    <section class="fi-product-block">
      <h2 class="fi-h2">Published simulations</h2>
      <ul class="fi-live-list">
        <li><a href="../crucible.html">Optical Crucible — Ayar Labs vs Lightmatter</a></li>
        <li><a href="../memory-crucible.html">Memory Crucible — SK hynix · Micron · Samsung</a></li>
        <li><a href="../materials-crucible.html">Materials Crucible — URNM × REMX</a></li>
        <li><a href="../tools/crucible.html">Open The Crucible hub</a></li>
      </ul>
    </section>`
}));

console.log("done");

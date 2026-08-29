/**
 * Fractal Infinity product rail — injects left nav. No product logic.
 */
(function () {
  const path = (location.pathname || "").replace(/\\/g, "/");
  const depth = (path.match(/\/(labs|tools|intelligence)\//) || path.endsWith("/labs/") || path.endsWith("/tools/") || path.endsWith("/intelligence/"))
    ? ".."
    : ".";
  // Better depth: count segments after site root
  const file = path.split("/").pop() || "";
  const inSub = /\/(labs|tools|intelligence)\//.test(path) || ["labs", "tools", "intelligence"].some(s => path.includes("/" + s + "/"));
  const root = inSub ? ".." : ".";

  const items = [
    { group: "Labs", links: [
      { href: root + "/labs/deep-research.html", label: "Deep Research Lab", soon: true },
      { href: root + "/labs/supplier-substitute.html", label: "Supplier & Substitute Finder", soon: true },
      { href: root + "/labs/dataset-builder.html", label: "Custom Dataset Builder", soon: true }
    ]},
    { group: "Analysis Tools", links: [
      { href: root + "/tools/bottleneck-xray.html", label: "Bottleneck & Supply Chain X-Ray", soon: true },
      { href: root + "/tools/crucible.html", label: "The Crucible — Decision Simulator", soon: false },
      { href: root + "/tools/thesis-risk-monitor.html", label: "Thesis & Risk Monitor", soon: true },
      { href: root + "/tools/evidence-dependency-map.html", label: "Evidence & Dependency Map", soon: true }
    ]},
    { group: "Intelligence", links: [
      { href: root + "/intelligence/research-reports.html", label: "Research Reports", soon: false },
      { href: root + "/intelligence/live-datasets.html", label: "Live Industry Datasets", soon: true },
      { href: root + "/intelligence/supply-chain-maps.html", label: "Supply-Chain Maps", soon: true },
      { href: root + "/intelligence/bottleneck-reports.html", label: "Bottleneck Reports", soon: true },
      { href: root + "/intelligence/crucible-results.html", label: "Crucible Results", soon: false },
      { href: root + "/intelligence/predictions.html", label: "Prediction Track Record", soon: true }
    ]}
  ];

  function isActive(href) {
    const leaf = href.split("/").pop();
    return file === leaf || path.endsWith("/" + leaf);
  }

  const nav = document.createElement("nav");
  nav.className = "fi-rail";
  nav.setAttribute("aria-label", "Product navigation");
  nav.innerHTML = `
    <button type="button" class="fi-rail-toggle" aria-expanded="false" aria-controls="fi-rail-body">Products</button>
    <div class="fi-rail-body" id="fi-rail-body">
      <a class="fi-rail-brand" href="${root}/index.html">Fractal Infinity</a>
      ${items.map(g => `
        <div class="fi-rail-group">
          <p class="fi-rail-label">${g.group}</p>
          ${g.links.map(l => `
            <a class="fi-rail-link${isActive(l.href) ? " is-active" : ""}" href="${l.href}">
              <span>${l.label}</span>
              ${l.soon ? '<em class="fi-rail-soon">Soon</em>' : ""}
            </a>`).join("")}
        </div>`).join("")}
      <div class="fi-rail-foot">
        <a href="${root}/research-lab.html">Process Intelligence</a>
        <a href="${root}/reports.html">All Reports</a>
        <a href="${root}/contact.html">Contact</a>
      </div>
    </div>`;

  document.body.prepend(nav);
  document.body.classList.add("has-fi-rail");

  const toggle = nav.querySelector(".fi-rail-toggle");
  const body = nav.querySelector(".fi-rail-body");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  // close on outside tap (mobile)
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
})();

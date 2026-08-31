/**
 * Fractal Infinity product rail — left column beside page content.
 */
(function () {
  const path = (location.pathname || "").replace(/\\/g, "/");
  const file = path.split("/").pop() || "";
  const inNestedTool = /\/tools\/[^/]+\//.test(path);
  const inSub = /\/(labs|tools|intelligence)\//.test(path);
  const root = inNestedTool ? "../.." : inSub ? ".." : ".";

  const items = [
    { group: "Labs", links: [
      { href: root + "/labs/deep-research.html", label: "Deep Research Lab", soon: true },
      { href: root + "/labs/supplier-substitute.html", label: "Supplier & Substitute Finder", soon: true },
      { href: root + "/labs/dataset-builder.html", label: "Custom Dataset Builder", soon: true }
    ]},
    { group: "Analysis Tools", links: [
      { href: root + "/tools/bottleneck-xray.html", label: "Bottleneck & Supply Chain X-Ray", soon: false },
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
    ]},
    { group: "Platform", links: [
      { href: root + "/ecosystem.html", label: "Ecosystem", soon: false }
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

  const shell = document.createElement("div");
  shell.className = "fi-shell";
  const workspace = document.createElement("div");
  workspace.className = "fi-workspace";

  const move = [];
  for (const node of Array.from(document.body.childNodes)) {
    if (node.nodeType === 1 && (node.tagName === "SCRIPT" || node.classList.contains("fi-rail") || node.classList.contains("fi-shell"))) continue;
    move.push(node);
  }
  move.forEach(n => workspace.appendChild(n));
  shell.appendChild(nav);
  shell.appendChild(workspace);
  document.body.insertBefore(shell, document.body.firstChild);
  document.body.classList.add("has-fi-rail", "fi-shell-mode");

  const toggle = nav.querySelector(".fi-rail-toggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
})();

/* Renders every figure. Data globals come from fig*.js files included before this one. */

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

const BASE_LAYOUT = {
  font: { family: FONT, size: 12, color: "#1a1a1a" },
  paper_bgcolor: "#fff",
  plot_bgcolor: "#fff",
  margin: { l: 60, r: 20, t: 30, b: 60 },
  hoverlabel: { bgcolor: "#fff", bordercolor: "#bbb", font: { family: FONT, size: 12 } },
  xaxis: { zeroline: false },
  yaxis: { zeroline: false },
};

const BASE_CONFIG = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ["select2d", "lasso2d", "autoScale2d"],
  toImageButtonOptions: { format: "png", scale: 2 },
};

const PALETTE = {
  diagnostic: "#1f77b4",
  therapeutic: "#d62728",
  mechanistic: "#2ca02c",
  method: "#9467bd",
  total: "#7f7f7f",
  thera: "#d62728",
};

/* Open a URL in a new tab when a point is clicked, if its customdata has a url. */
function attachClickToOpen(divId) {
  const el = document.getElementById(divId);
  if (!el) return;
  el.on("plotly_click", (ev) => {
    const pt = ev.points && ev.points[0];
    if (!pt) return;
    const cd = pt.customdata;
    if (!cd) return;
    const url = Array.isArray(cd) ? cd[cd.length - 1] : cd;
    if (url && typeof url === "string" && url.startsWith("http")) {
      window.open(url, "_blank", "noopener");
    }
  });
}

/* ---------- Fig 1a: articles by year × category ---------- */
function plotFig1a() {
  const d = window.FIG1A;
  const traces = [
    { name: "Therapeutic",        y: d.categories.Therapeutic,        color: PALETTE.therapeutic },
    { name: "Mechanistic",        y: d.categories.Mechanistic,        color: PALETTE.mechanistic },
    { name: "Diagnostic",         y: d.categories.Diagnostic,         color: PALETTE.diagnostic },
    { name: "Method development", y: d.categories.Method_Development, color: PALETTE.method },
  ].map((t) => ({
    type: "scatter", mode: "lines+markers",
    name: t.name, x: d.years, y: t.y,
    line: { color: t.color, width: 2.5, shape: "spline", smoothing: 0.4 },
    marker: { color: t.color, size: 7 },
    hovertemplate: `<b>${t.name}</b><br>Year %{x}<br>%{y:,} articles<extra></extra>`,
  }));
  Plotly.newPlot("fig1a", traces, {
    ...BASE_LAYOUT,
    xaxis: { title: "Year", dtick: 2, gridcolor: "#eee" },
    yaxis: { title: "Number of articles", gridcolor: "#eee", tickformat: "," },
    legend: { orientation: "h", x: 0, y: -0.18 },
    hovermode: "x unified",
  }, BASE_CONFIG);
}

/* ---------- Fig 1b: articles by cell source ---------- */
function plotFig1b() {
  const rows = window.FIG1B;
  const sources = rows.map((r) => r.source);
  const totals = rows.map((r) => r.total);
  const ther = rows.map((r) => r.therapeutic);

  const traces = [
    {
      type: "bar", orientation: "h", name: "Total papers",
      x: totals, y: sources,
      marker: { color: PALETTE.total },
      hovertemplate: "<b>%{y}</b><br>Total papers: %{x:,}<extra></extra>",
    },
    {
      type: "bar", orientation: "h", name: "Therapeutic papers",
      x: ther, y: sources,
      marker: { color: PALETTE.thera },
      hovertemplate: "<b>%{y}</b><br>Therapeutic papers: %{x:,}<extra></extra>",
    },
  ];
  Plotly.newPlot("fig1b", traces, {
    ...BASE_LAYOUT,
    margin: { l: 140, r: 20, t: 30, b: 60 },
    barmode: "group",
    xaxis: { title: "Number of original research articles", gridcolor: "#eee", tickformat: "," },
    yaxis: { automargin: true, autorange: "reversed" },
    legend: { orientation: "h", x: 0, y: -0.12 },
  }, BASE_CONFIG);
}

/* ---------- Fig 2a: clinical studies overview donut ---------- */
function plotFig2a() {
  const d = window.FIG2A;
  const trace = {
    type: "pie", hole: 0.55,
    labels: d.map((x) => x.type),
    values: d.map((x) => x.percent),
    marker: { colors: ["#d62728", "#2ca02c", "#1f77b4"] },
    textinfo: "label+percent",
    textposition: "outside",
    hovertemplate: "<b>%{label}</b><br>%{value:.1f}% of 338 trials<extra></extra>",
  };
  Plotly.newPlot("fig2a", [trace], {
    ...BASE_LAYOUT,
    margin: { l: 20, r: 20, t: 20, b: 20 },
    showlegend: false,
    annotations: [{ text: "338<br>trials", x: 0.5, y: 0.5, font: { size: 16 }, showarrow: false }],
  }, BASE_CONFIG);
}

/* ---------- Fig 2b: clinical trial doses with per-point click ---------- */
function plotFig2b() {
  const rows = window.FIG2B;
  const particles = rows.filter((r) => r.axis === "particles");
  const weights = rows.filter((r) => r.axis === "weight_ug");

  // Only keep route columns that actually have at least one plotted point.
  const fullRouteOrder = ["Intravenous", "Inhalation", "Intradermal / topical", "Other", "Not specified"];
  const plottedRoutes = new Set([...particles, ...weights].map((r) => r.route));
  const routeOrder = fullRouteOrder.filter((r) => plottedRoutes.has(r));
  const routeIdx = (r) => Math.max(0, routeOrder.indexOf(r));

  function trace(name, points, color, axisId) {
    return {
      type: "scatter", mode: "markers", name,
      x: points.map((p) => routeIdx(p.route) + (Math.random() - 0.5) * 0.18),
      y: points.map((p) => p.dose_scaled),
      xaxis: "x", yaxis: axisId,
      marker: { color, size: 10, opacity: 0.85, line: { color: "#333", width: 0.5 } },
      customdata: points.map((p) => [p.nct, p.title, p.dose_raw, p.dose_unit, p.route, p.ev_source, p.url]),
      hovertemplate:
        "<b>%{customdata[0]}</b><br>" +
        "%{customdata[1]}<br>" +
        "<b>Dose:</b> %{customdata[2]} %{customdata[3]}<br>" +
        "<b>Route:</b> %{customdata[4]}<br>" +
        "<b>Source:</b> %{customdata[5]}<br>" +
        "<i>click to open on ClinicalTrials.gov</i><extra></extra>",
    };
  }

  const traces = [
    trace("Particle-based dose", particles, "#1f77b4", "y"),
    trace("Weight-based dose (µg)", weights, "#d62728", "y2"),
  ];

  Plotly.newPlot("fig2b", traces, {
    ...BASE_LAYOUT,
    margin: { l: 80, r: 80, t: 30, b: 80 },
    xaxis: {
      title: "Route of administration",
      tickmode: "array",
      tickvals: routeOrder.map((_, i) => i),
      ticktext: routeOrder,
      range: [-0.5, routeOrder.length - 0.5],
      gridcolor: "#eee",
      zeroline: false,
    },
    yaxis: {
      title: "Particles administered per human (log)",
      type: "log", gridcolor: "#eee", zeroline: false,
      titlefont: { color: "#1f77b4" }, tickfont: { color: "#1f77b4" },
    },
    yaxis2: {
      title: "µg exosomal protein per human (log)",
      type: "log", overlaying: "y", side: "right",
      titlefont: { color: "#d62728" }, tickfont: { color: "#d62728" },
      showgrid: false, zeroline: false,
    },
    legend: { orientation: "h", x: 0, y: -0.22 },
  }, BASE_CONFIG);
  attachClickToOpen("fig2b");
}

/* ---------- Fig 3a: drug loading methods ---------- */
function plotFig3a() {
  const rows = window.FIG3A;
  const trace = {
    type: "bar",
    x: rows.map((r) => r.method),
    y: rows.map((r) => r.n),
    marker: { color: "#006c8a" },
    hovertemplate: "<b>%{x}</b><br>%{y} studies<extra></extra>",
  };
  Plotly.newPlot("fig3a", [trace], {
    ...BASE_LAYOUT,
    margin: { l: 60, r: 20, t: 30, b: 130 },
    xaxis: { tickangle: -35, gridcolor: "#eee" },
    yaxis: { title: "Number of studies", gridcolor: "#eee" },
  }, BASE_CONFIG);
}

/* ---------- Fig 3b/c: loading capacity scatter with per-point links ---------- */
function plotFig3bc() {
  const rows = window.FIG3BC;
  const moleculeColors = {
    "Small molecule": "#1f77b4",
    "Oligonucleotide": "#d62728",
    "Protein":         "#2ca02c",
    "DNA":             "#9467bd",
    "Nanosheet":       "#ff7f0e",
    "Unspecified":     "#7f7f7f",
  };
  // Order methods by median LC desc for readability
  const methods = Array.from(new Set(rows.map((r) => r.method)));
  const methodOrder = methods
    .map((m) => {
      const xs = rows.filter((r) => r.method === m).map((r) => r.lc).sort((a, b) => a - b);
      return { m, med: xs[Math.floor(xs.length / 2)] || 0 };
    })
    .sort((a, b) => b.med - a.med)
    .map((x) => x.m);
  const methodIdx = (m) => methodOrder.indexOf(m);

  const groups = {};
  for (const r of rows) {
    (groups[r.molecule] = groups[r.molecule] || []).push(r);
  }
  const traces = Object.entries(groups).map(([mol, pts]) => ({
    type: "scatter", mode: "markers", name: mol,
    x: pts.map((p) => methodIdx(p.method) + (Math.random() - 0.5) * 0.25),
    y: pts.map((p) => p.lc),
    marker: { color: moleculeColors[mol] || "#666", size: 8, opacity: 0.75, line: { color: "#222", width: 0.4 } },
    customdata: pts.map((p) => [
      p.method,
      p.molecule,
      p.drug && p.drug.trim() ? p.drug : "Drug not specified",
      p.lc,
      p.unit,
      p.source,
      p.year,
      p.cell_source,
      p.link,
    ]),
    hovertemplate:
      "<b>%{customdata[2]}</b> (%{customdata[1]})<br>" +
      "Method: %{customdata[0]}<br>" +
      "Loading capacity: %{customdata[3]:.3g}% %{customdata[4]}<br>" +
      "Cell source: %{customdata[7]}<br>" +
      "<i>%{customdata[5]} %{customdata[6]}</i><br>" +
      "<i>click to open the paper</i><extra></extra>",
  }));

  Plotly.newPlot("fig3bc", traces, {
    ...BASE_LAYOUT,
    margin: { l: 70, r: 20, t: 30, b: 140 },
    xaxis: {
      title: "Loading method",
      tickmode: "array",
      tickvals: methodOrder.map((_, i) => i),
      ticktext: methodOrder,
      tickangle: -35,
      range: [-0.6, methodOrder.length - 0.4],
      gridcolor: "#eee",
    },
    yaxis: {
      title: "Loading capacity (% w/w)",
      gridcolor: "#eee",
      rangemode: "tozero",
    },
    legend: { orientation: "h", x: 0, y: -0.32 },
  }, BASE_CONFIG);
  attachClickToOpen("fig3bc");
}

/* ---------- Fig 3e: donut + per-paper table with row click ---------- */
function plotFig3e() {
  const d = window.FIG3E;
  // Canonical published-figure counts (see Fig3e_DoseResponse_Summary.csv).
  const noDR  = d.summary.No_DoseResponse?.count       ?? 0;
  const drNo  = d.summary.DoseResponse_NoIC50?.count   ?? 0;
  const ic50  = d.summary.IC50_Reported?.count         ?? 0;
  // Published figure denominators: percentages sum to 100, the underlying
  // article count is 98 (per the caption).
  const totalArticles = 98;

  const trace = {
    type: "pie", hole: 0.55,
    labels: [
      d.summary.IC50_Reported?.label       || "IC50 reported",
      d.summary.DoseResponse_NoIC50?.label || "Dose response reported",
      d.summary.No_DoseResponse?.label     || "Dose response not reported",
    ],
    values: [ic50, drNo, noDR],
    marker: { colors: ["#2ca02c", "#1f77b4", "#d62728"] },
    textinfo: "percent",
    textposition: "inside",
    insidetextorientation: "horizontal",
    hovertemplate: `<b>%{label}</b><br>%{value}% of ${totalArticles} articles<extra></extra>`,
    sort: false,
  };
  Plotly.newPlot("fig3e-donut", [trace], {
    ...BASE_LAYOUT,
    margin: { l: 10, r: 10, t: 10, b: 60 },
    showlegend: true,
    legend: { orientation: "h", x: 0, y: -0.05, font: { size: 11 } },
    annotations: [{ text: "98<br>siRNA studies", x: 0.5, y: 0.5, font: { size: 13 }, showarrow: false }],
  }, BASE_CONFIG);

  // Build the table
  const tbl = document.getElementById("fig3e-table");
  const search = document.getElementById("fig3e-search");
  const papers = d.papers.slice().sort((a, b) => (b.year || "").localeCompare(a.year || ""));

  function render(filter) {
    const f = (filter || "").trim().toLowerCase();
    const matching = !f ? papers : papers.filter((p) => {
      return [p.recipient, p.target, p.year, p.source, p.doi].some((v) => (v || "").toLowerCase().includes(f));
    });
    const rows = matching.map((p) => {
      const dr = (p.dose_response === "Y" || p.dose_response === "YES")
        ? '<span class="badge yes">dose-response</span>'
        : '<span class="badge no">none</span>';
      const link = p.link || (p.doi ? `https://doi.org/${p.doi.replace(/^doi:/i, "")}` : "");
      const safe = (s) => (s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
      return `<tr class="row-link" data-url="${safe(link)}">
        <td>${safe(p.year)}</td>
        <td>${safe(p.source)}</td>
        <td>${safe(p.recipient)}</td>
        <td>${safe(p.target)}</td>
        <td>${dr}</td>
      </tr>`;
    });
    tbl.innerHTML = `<table>
      <thead><tr>
        <th>Year</th><th>Journal</th><th>Recipient cell</th><th>Target</th><th>Dose-response</th>
      </tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>`;
    tbl.querySelectorAll("tr.row-link").forEach((tr) => {
      tr.addEventListener("click", () => {
        const url = tr.getAttribute("data-url");
        if (url) window.open(url, "_blank", "noopener");
      });
    });
  }
  render("");
  search.addEventListener("input", (e) => render(e.target.value));
}

/* ---------- Fig 4a: labelling dye subtype counts (as plotted, 22 subtypes) ---------- */
function plotFig4a() {
  const rows = window.FIG4A || [];
  if (!rows.length) return;
  // Group by dye type for colour, keep individual subtype labels on x-axis
  const palette = {
    "Fluoroscence":          "#d62728",
    "Lipid Dye":             "#0b3d91",
    "Fluoroscent protein":   "#ff7f0e",
    "Contrast agents":       "#1f77b4",
    "Luciferase":            "#2ca02c",
    "Radio":                 "#9467bd",
    "Quantum Dot":           "#17becf",
    "RT-qPCR":               "#7f7f7f",
  };
  // Sort by dye_type then subtype-count desc
  const sorted = rows.slice().sort((a, b) => {
    if (a.type !== b.type) return (a.type || "").localeCompare(b.type || "");
    return b.n - a.n;
  });
  const types = Array.from(new Set(sorted.map((r) => r.type)));
  const traces = types.map((ty) => {
    const pts = sorted.filter((r) => r.type === ty);
    return {
      type: "bar",
      name: ty,
      x: pts.map((p) => p.subtype),
      y: pts.map((p) => p.n),
      marker: { color: palette[ty] || "#666" },
      hovertemplate: "<b>%{x}</b><br>%{y} papers<br>Type: " + ty + "<extra></extra>",
    };
  });
  Plotly.newPlot("fig4a", traces, {
    ...BASE_LAYOUT,
    margin: { l: 60, r: 20, t: 30, b: 120 },
    xaxis: { tickangle: -30, gridcolor: "#eee", categoryorder: "array",
             categoryarray: sorted.map((r) => r.subtype) },
    yaxis: { title: "Number of papers", gridcolor: "#eee" },
    legend: { orientation: "h", x: 0, y: -0.45 },
    barmode: "group",
  }, BASE_CONFIG);
}

/* ---------- Fig 4b: doses in mice by route (split by unit family) ---------- */
function plotFig4b() {
  const rows = window.FIG4B;
  const fullRouteOrder = [
    "Intravenous", "Intranasal", "Intraperitoneal", "Oral",
    "Intratumoural", "Other",
  ];

  // axis classification is done in build_data.py — just split here.
  const particles = rows.filter((r) => r.axis === "particle");
  const weights   = rows.filter((r) => r.axis === "weight");

  // Only keep routes that actually have at least one plotted point.
  const plottedRoutes = new Set([...particles, ...weights].map((r) => r.route));
  const routeOrder = fullRouteOrder.filter((r) => plottedRoutes.has(r));
  const ri = (r) => Math.max(0, routeOrder.indexOf(r));

  function makeTrace(name, pts, color, axisId) {
    return {
      type: "scatter", mode: "markers", name,
      x: pts.map((p) => ri(p.route) + (Math.random() - 0.5) * 0.22),
      // Plot the per-mouse value (mg/kg etc. already scaled by build_data).
      y: pts.map((p) => p.dose_scaled),
      xaxis: "x", yaxis: axisId,
      marker: { color, size: 9, opacity: 0.8, line: { color: "#222", width: 0.4 } },
      // customdata: source_label, doi_display, scaled_value, axis_unit_label,
      //   reported_dose_label, route, dye, note, link  (link MUST stay last —
      //   attachClickToOpen reads the final entry as the URL).
      customdata: pts.map((p) => {
        const linked = !!p.link;
        const sourceLabel = linked
          ? `${p.source || "Source"}${p.year ? " (" + p.year + ")" : ""}`
          : "()";
        const reported = linked && p.unit
          ? `${(+p.dose).toPrecision(3)} ${p.unit}`
          : "—";
        return [
          sourceLabel, p.doi || "—",
          p.dose_scaled, (p.axis === "weight" ? "µg / mouse" : "particles / mouse"),
          reported,
          p.route, p.dye || "—",
          linked ? "Click to open the paper" : "(no source paper linked)",
          p.link,
        ];
      }),
      hovertemplate:
        "<b>%{customdata[0]}</b><br>" +
        "Plotted dose: %{customdata[2]:.3g} %{customdata[3]}<br>" +
        "Reported as: %{customdata[4]}<br>" +
        "Route: %{customdata[5]}<br>" +
        "Dye: %{customdata[6]}<br>" +
        "DOI: %{customdata[1]}<br>" +
        "<i>%{customdata[7]}</i><extra></extra>",
    };
  }

  const traces = [
    makeTrace("Particles administered per mouse", particles, "#1f77b4", "y"),
    makeTrace("µg of exosomal protein per mouse", weights,   "#d62728", "y2"),
  ];

  Plotly.newPlot("fig4b", traces, {
    ...BASE_LAYOUT,
    margin: { l: 90, r: 90, t: 30, b: 110 },
    xaxis: {
      title: "Route of administration",
      tickmode: "array",
      tickvals: routeOrder.map((_, i) => i),
      ticktext: routeOrder,
      tickangle: -25,
      range: [-0.5, routeOrder.length - 0.5],
      gridcolor: "#eee",
    },
    yaxis: {
      title: "Particles administered per mouse",
      type: "log", gridcolor: "#eee",
      range: [7, 14],   // 10^7 – 10^14, matching the published panel
      titlefont: { color: "#1f77b4" }, tickfont: { color: "#1f77b4" },
    },
    yaxis2: {
      title: "µg of exosomal protein administered per mouse",
      type: "linear", overlaying: "y", side: "right",
      range: [0, 2000], // linear 0–2000 µg, matching the published panel
      titlefont: { color: "#d62728" }, tickfont: { color: "#d62728" },
      showgrid: false,
    },
    legend: { orientation: "h", x: 0, y: -0.32 },
  }, BASE_CONFIG);
  attachClickToOpen("fig4b");
}

/* ---------- Generic biodist scatter: organ × % of study peak, coloured by category ---------- */
const ORGAN_ORDER = [
  "Liver", "Spleen", "Lung", "Kidney", "Heart", "Brain", "Tumour",
  "Bone", "Pancreas", "Muscle", "Stomach", "Intestine", "Large GIT", "Small GIT",
  "Urine", "Stool", "Thymus", "Blood", "mLN", "iLN", "Lymph nodes", "Thyroid",
];

const CATEGORY_PALETTE = [
  "#1f77b4", "#d62728", "#2ca02c", "#9467bd", "#ff7f0e",
  "#17becf", "#e377c2", "#8c564b", "#7f7f7f", "#bcbd22",
];

// Fixed colours for dye-type categories so every panel matches the published
// figures regardless of how many categories are present (e.g. Fig 4d has no
// Radiotracer, but Luciferase must stay green, not fall to the 2nd palette slot).
const CATEGORY_COLORS = {
  "Fluorescent dye": "#1f77b4",
  "Radiotracer":     "#d62728",
  "Luciferase":      "#2ca02c",
};

function plotBiodist(divId, dataKey, categoryLabel, allowBreak = true) {
  const rows = window[dataKey] || [];
  if (!rows.length) return;
  const categories = Array.from(new Set(rows.map((r) => r.category)));
  const presentOrgans = ORGAN_ORDER.filter((o) => rows.some((r) => r.organ === o));

  // -------- Broken-axis detection --------
  // Match the paper's style: when a small number of outliers sit far above the
  // main cluster, split the y-axis into two stacked panels with a visual break.
  // Some panels (Fig 4c/4d) render as a single axis in the article, so callers
  // can disable the break entirely via `allowBreak=false` — otherwise a high
  // outlier would split a category into two boxes (one per panel).
  const allValues = rows.map((r) => r.pct).sort((a, b) => a - b);
  const n = allValues.length;
  const p95 = allValues[Math.floor(n * 0.95)];
  const maxVal = allValues[n - 1];
  // Outliers only if the very top is >= 1.6× the 95th percentile AND >= 120.
  const useBreak = allowBreak && maxVal >= p95 * 1.6 && maxVal >= 120;

  function roundUp(x, step) { return Math.ceil(x / step) * step; }
  function roundDown(x, step) { return Math.floor(x / step) * step; }
  let lowerMax, upperMin, upperMax;
  if (useBreak) {
    lowerMax = roundUp(p95 * 1.10, 10);             // top of lower panel
    upperMax = roundUp(maxVal * 1.05, 10);          // top of upper panel
    upperMin = roundDown(Math.min(...allValues.filter((v) => v > lowerMax)) * 0.95, 10);
    if (upperMin <= lowerMax) upperMin = lowerMax + 20;
  }

  function makeBoxTrace(cat, ci, points, yref, showLegend, pointsOnly = false) {
    const color = CATEGORY_COLORS[cat] || CATEGORY_PALETTE[ci % CATEGORY_PALETTE.length];
    return {
      type: "box",
      name: cat,
      legendgroup: cat,
      showlegend: showLegend,
      x: points.map((p) => p.organ),
      y: points.map((p) => p.pct),
      boxpoints: "all",
      // Centre the above-break outlier dots (jitter 0) so they line up directly
      // over their box in the lower panel; jitter the in-box cluster as usual.
      jitter: pointsOnly ? 0 : 0.5,
      pointpos: 0,
      // `pointsOnly` hides the box itself (used in the upper broken-axis panel)
      // so a category that straddles the break shows ONE box (lower panel) plus
      // its outlier dots above — not a confusing second box. Box stays grouped
      // so the dots line up over the lower-panel box.
      hoveron: pointsOnly ? "points" : "boxes+points",
      whiskerwidth: pointsOnly ? 0 : undefined,
      marker: { color, size: 6, opacity: 0.85, line: { color: "#222", width: 0.3 } },
      line: { width: pointsOnly ? 0 : 1 },
      fillcolor: pointsOnly ? "rgba(0,0,0,0)" : color + "33",
      xaxis: "x",
      yaxis: yref,
      // attachClickToOpen reads the last customdata entry as the URL — keep
      // p.link last. p.doi sits at index 10 for the hover template.
      customdata: points.map((p) => [p.organ, p.pct, p.value, p.units, p.source, p.year, p.cell, p.time, p.dye, p.category, p.doi, p.link]),
      hovertemplate:
        "<b>%{customdata[0]}</b> · %{customdata[1]:.1f} (organ / (liver + spleen) × 100)<br>" +
        "Raw: %{customdata[2]:.3g} %{customdata[3]}<br>" +
        "Cell source: %{customdata[6]} · time %{customdata[7]} · dye %{customdata[8]}<br>" +
        `${categoryLabel}: %{customdata[9]}<br>` +
        "<i>DOI: %{customdata[10]} · click to open</i><extra></extra>",
    };
  }

  let traces;
  let layout;
  if (!useBreak) {
    traces = categories.map((cat, ci) => makeBoxTrace(cat, ci, rows.filter((r) => r.category === cat), "y", true));
    layout = {
      ...BASE_LAYOUT,
      margin: { l: 70, r: 20, t: 30, b: 130 },
      boxmode: "group",
      xaxis: {
        title: "Organ / tissue",
        categoryorder: "array",
        categoryarray: presentOrgans,
        tickangle: -30,
        gridcolor: "#eee",
        zeroline: false,
      },
      yaxis: {
        title: "Organ signal / (liver + spleen) × 100",
        gridcolor: "#eee",
        zeroline: false,
        rangemode: "tozero",
      },
      legend: { orientation: "h", x: 0, y: -0.28 },
    };
  } else {
    // Two y-axes stacked vertically: upper panel for outliers, lower panel
    // for the main cluster, with a small gap between them = the visual break.
    traces = [];
    categories.forEach((cat, ci) => {
      const allPts = rows.filter((r) => r.category === cat);
      const lowPts = allPts.filter((p) => p.pct <= lowerMax);
      const highPts = allPts.filter((p) => p.pct > lowerMax);
      // Lower panel — the single box for this category (legend entry here).
      traces.push(makeBoxTrace(cat, ci, lowPts, "y", true));
      // Upper panel — outlier POINTS only (no second box), so the category
      // shows one box at the bottom plus its high dots above the break.
      if (highPts.length) traces.push(makeBoxTrace(cat, ci, highPts, "y2", false, true));
    });

    // A small gap between the panels = the visual break, matching the
    // published figure (a tight band with the "//" mark on the spine).
    const lowerDomain = [0, 0.74];
    const upperDomain = [0.79, 1.0];
    const breakY1 = lowerDomain[1];
    const breakY2 = upperDomain[0];
    const gapMid = (breakY1 + breakY2) / 2;  // 0.765

    layout = {
      ...BASE_LAYOUT,
      margin: { l: 70, r: 20, t: 30, b: 130 },
      boxmode: "group",
      xaxis: {
        title: "Organ / tissue",
        categoryorder: "array",
        categoryarray: presentOrgans,
        tickangle: -30,
        gridcolor: "#eee",
        zeroline: false,
        anchor: "y",
        domain: [0, 1],
      },
      yaxis: {
        title: "Organ signal / (liver + spleen) × 100",
        gridcolor: "#eee",
        zeroline: false,
        domain: lowerDomain,
        range: [0, lowerMax],
        anchor: "x",
        // Natural 20-step ticks (0,20,…,ceiling) like the published panel.
        tick0: 0,
        dtick: 20,
      },
      yaxis2: {
        gridcolor: "#eee",
        zeroline: false,
        domain: upperDomain,
        range: [upperMin, upperMax],
        anchor: "free",
        position: 0,
        showticklabels: true,
        side: "left",
      },
      legend: { orientation: "h", x: 0, y: -0.28 },
      // Visual "break" markers — the classic pair of short parallel diagonal
      // slashes ("//") sitting ON the axis spine in the gap, exactly like the
      // published figure. The two slashes straddle x=0 (the spine) so they
      // bridge the lower and upper axis lines; a white band behind them hides
      // any background bleed across the gap.
      shapes: [
        { type: "rect", xref: "paper", yref: "paper",
          x0: -0.03, x1: 1, y0: breakY1 + 0.004, y1: breakY2 - 0.004,
          fillcolor: "#fff", line: { width: 0 }, layer: "below" },
        { type: "line", xref: "paper", yref: "paper",
          x0: -0.016, x1: 0.012, y0: gapMid - 0.020, y1: gapMid - 0.004,
          line: { color: "#333", width: 1.5 } },
        { type: "line", xref: "paper", yref: "paper",
          x0: -0.016, x1: 0.012, y0: gapMid + 0.004, y1: gapMid + 0.020,
          line: { color: "#333", width: 1.5 } },
      ],
    };
  }

  Plotly.newPlot(divId, traces, layout, BASE_CONFIG);
  attachClickToOpen(divId);
}

document.addEventListener("DOMContentLoaded", () => {
  plotFig1a();
  plotFig1b();
  plotFig2a();
  plotFig2b();
  plotFig3a();
  plotFig3bc();
  plotFig3e();
  plotFig4a();
  plotFig4b();
  plotBiodist("fig4c", "FIG4C", "Dye type", false);  // single axis, no break (matches paper)
  plotBiodist("fig4d", "FIG4D", "Dye type", false);  // single axis, no break (matches paper)
  plotBiodist("fig5a", "FIG5A", "Cell type");
  plotBiodist("fig5b", "FIG5B", "Cell type");
  plotFig5c();
  plotFig5d();
});

/* ---------- Fig 5c: tumour % per study, Cancer vs Non Cancer, coloured by dye ---------- */
function plotFig5c() {
  const rows = window.FIG5C || [];
  if (!rows.length) return;
  const types = Array.from(new Set(rows.map((r) => r.type))).sort();

  // Normalise dye labels for legend grouping (Fluorescence / Radiolabel / Contrast agent / Luciferase)
  function dyeBucket(d) {
    const s = (d || "").toLowerCase();
    if (/fluorescen|fluoroscen/.test(s)) return "Fluorescence";
    if (/radio|tritium|iodin|technet|cu-?64|zr-?89/.test(s)) return "Radiolabel";
    if (/luciferase|luciferin/.test(s)) return "Luciferase";
    if (/contrast|magnetic|gadolin|iron|mri/.test(s)) return "Contrast agent";
    return d || "Unspecified";
  }
  const dyeColors = {
    "Fluorescence":   "#d62728",
    "Radiolabel":     "#9467bd",
    "Luciferase":     "#2ca02c",
    "Contrast agent": "#1f77b4",
    "Unspecified":    "#7f7f7f",
  };

  const dyes = Array.from(new Set(rows.map((r) => dyeBucket(r.dye))));
  const traces = dyes.map((dy) => {
    const pts = rows.filter((r) => dyeBucket(r.dye) === dy);
    return {
      type: "scatter", mode: "markers", name: dy,
      x: pts.map((p) => p.type),
      y: pts.map((p) => p.pct),
      marker: { color: dyeColors[dy] || "#666", size: 10, opacity: 0.85, line: { color: "#222", width: 0.4 } },
      customdata: pts.map((p) => [
        p.type, p.dye, p.pct, p.doi || "—",
        p.link ? "Click to open the paper" : "(no source paper linked)",
        p.link || "",  // last — attachClickToOpen reads it as the URL
      ]),
      hovertemplate:
        "<b>%{customdata[0]}-source EV</b><br>" +
        "Tumour accumulation: %{customdata[2]:.1f}%<br>" +
        "Dye: %{customdata[1]}<br>" +
        "DOI: %{customdata[3]}<br>" +
        "<i>%{customdata[4]}</i><extra></extra>",
    };
  });

  Plotly.newPlot("fig5c", traces, {
    ...BASE_LAYOUT,
    margin: { l: 80, r: 20, t: 30, b: 90 },
    xaxis: {
      title: "EV source",
      categoryorder: "array",
      categoryarray: types,
      gridcolor: "#eee",
      zeroline: false,
      // Two categories are placed at x=0 and x=1; clamp the range so they
      // sit close together instead of at the extreme edges of the plot.
      range: [-0.4, types.length - 0.6],
    },
    yaxis: { title: "Tumour accumulation (%)", gridcolor: "#eee", zeroline: false, rangemode: "tozero" },
    legend: { orientation: "h", x: 0, y: -0.25 },
  }, BASE_CONFIG);
  attachClickToOpen("fig5c");
}

/* ---------- Fig 5d: engineered vs native EV tumour accumulation ---------- */
function plotFig5d() {
  const rows = window.FIG5D || [];
  if (!rows.length) return;

  const categoryOrder = ["Native EVs", "Peptide", "Protein", "Small Molecules", "Aptamer"];
  const palette = {
    "Native EVs":      "#7f7f7f",
    "Peptide":         "#1f77b4",
    "Protein":         "#2ca02c",
    "Small Molecules": "#ff7f0e",
    "Aptamer":         "#9467bd",
  };

  const traces = categoryOrder
    .filter((cat) => rows.some((r) => r.category === cat))
    .map((cat) => {
      const pts = rows.filter((r) => r.category === cat);
      return {
        type: "box",
        name: cat,
        x: pts.map(() => cat),
        y: pts.map((p) => p.value),
        boxpoints: "all",
        jitter: 0.5,
        pointpos: 0,
        fillcolor: "rgba(0,0,0,0)",
        line: { color: palette[cat] || "#666", width: 1 },
        marker: { color: palette[cat] || "#666", size: 9, opacity: 0.85, line: { color: "#222", width: 0.4 } },
        customdata: pts.map((p) => [
          p.category,
          p.value,
          p.doi || "—",
          p.subtype || "",
          p.link ? "Click to open the paper" : "(no source paper linked)",
          p.link || "",  // must be last — attachClickToOpen uses customdata[length-1] as URL
        ]),
        hovertemplate:
          "<b>%{customdata[0]}</b><br>" +
          "Tumour / MPS organs: %{customdata[1]:.1f}%<br>" +
          "DOI: %{customdata[2]}<br>" +
          "%{customdata[3]}<br>" +
          "<i>%{customdata[4]}</i><extra></extra>",
        showlegend: false,
      };
    });

  Plotly.newPlot("fig5d", traces, {
    ...BASE_LAYOUT,
    margin: { l: 80, r: 20, t: 30, b: 80 },
    xaxis: { title: "EV surface modification", gridcolor: "#eee", zeroline: false },
    yaxis: { title: "% Signal from tumour / MPS organs", gridcolor: "#eee", zeroline: false, rangemode: "tozero" },
    showlegend: false,
  }, BASE_CONFIG);
  attachClickToOpen("fig5d");
}

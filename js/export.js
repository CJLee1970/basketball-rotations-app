/* js/export.js
   Clean PDF + Print export for the Rotation Builder.
   Requires html2pdf (loaded before this file) and the following globals:
   - currentRotation: { q1:{PG:[...],...}, q2:..., q3:..., q4:... }
   - currentRoster: [{ id, name, number, color, ... }]
   - MINUTES_PER_QUARTER: number
*/

(function () {
  // --- Utilities ---
  const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
  const QUARTERS = ["q1", "q2", "q3", "q4"];
  const QLABEL = { q1: "Quarter 1", q2: "Quarter 2", q3: "Quarter 3", q4: "Quarter 4" };

  function playerById(id) {
    return currentRoster.find(p => p.id === id);
  }

  function mm(val) { return `${val}mm`; } // for jsPDF size helpers if ever needed

  // --- Build a self-contained print node (no app CSS required) ---
  function buildPrintNode({ title, dateStr, quarter = null }) {
    const wrap = document.createElement("div");
    wrap.id = "print-root";
    wrap.style.cssText = `
      font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      color:#111; width:1400px; margin:0 auto; padding:24px 28px; box-sizing:border-box;
    `;

    // Minimal embedded CSS to ensure consistent rendering (html2pdf/html2canvas safe)
    const style = document.createElement("style");
    style.textContent = `
      .print-header{ text-align:center; margin-bottom:16px; }
      .print-header h1{ margin:0 0 6px; font-size:22px; }
      .print-header p{ margin:0; font-size:12px; color:#555; }
      .quarter{ border:1px solid #ddd; border-radius:6px; padding:10px 12px; margin:10px 0 16px; }
      .q-title{ font-weight:700; font-size:13px; margin:0 0 8px; text-align:center; }
      .grid{ display:grid; grid-template-columns:60px 1fr; grid-auto-rows:32px; row-gap:8px; column-gap:8px; }
      .ruler{ grid-column:1 / -1; height:20px; margin:0 0 6px; position:relative; }
      .ruler .tick{ position:absolute; top:0; height:100%; width:1px; background:#ccc; }
      .ruler .num{ position:absolute; top:0; transform:translateX(-50%); font-size:10px; color:#666; }
      .label{ display:flex; align-items:center; justify-content:flex-end; padding-right:6px; font-weight:600; color:#555; }
      .track{ position:relative; border:1px solid #eee; background:#fafafa; height:28px; border-radius:4px; overflow:hidden; }
      .stint{ position:absolute; top:0; bottom:0; display:flex; align-items:center; justify-content:center;
              font-size:11px; color:#fff; border-right:1px solid rgba(255,255,255,.6); padding:0 6px; white-space:nowrap; }
    `;
    wrap.appendChild(style);

    // Header
    const header = document.createElement("div");
    header.className = "print-header";
    header.innerHTML = `<h1>${escapeHtml(title || "Game Rotation")}</h1><p>Generated on: ${dateStr}</p>`;
    wrap.appendChild(header);

    // Build quarters
    const quartersToRender = quarter ? [quarter] : QUARTERS;
    quartersToRender.forEach(q => wrap.appendChild(renderQuarter(q)));

    return wrap;
  }

  function renderQuarter(qKey) {
    const qDiv = document.createElement("div");
    qDiv.className = "quarter";

    const title = document.createElement("div");
    title.className = "q-title";
    title.textContent = QLABEL[qKey];
    qDiv.appendChild(title);

    // ruler
    const ruler = document.createElement("div");
    ruler.className = "ruler";
    // 10 down to 1 markers; we map positions to percentages
    for (let m = MINUTES_PER_QUARTER; m >= 1; m--) {
      const pct = ((MINUTES_PER_QUARTER - m) / MINUTES_PER_QUARTER) * 100;
      const tick = document.createElement("div");
      tick.className = "tick";
      tick.style.left = `${pct}%`;
      ruler.appendChild(tick);

      const num = document.createElement("div");
      num.className = "num";
      num.style.left = `${pct}%`;
      num.textContent = m;
      ruler.appendChild(num);
    }
    qDiv.appendChild(ruler);

    // lanes
    const grid = document.createElement("div");
    grid.className = "grid";
    qDiv.appendChild(grid);

    POSITIONS.forEach(pos => {
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = pos;
      grid.appendChild(label);

      const lane = document.createElement("div");
      lane.className = "track";
      grid.appendChild(lane);

      const stints = (currentRotation?.[qKey]?.[pos] || []).slice().sort((a, b) => a.end - b.end);
      stints.forEach(st => {
        const p = playerById(st.playerId);
        if (!p) return;
        const duration = st.start - st.end;                     // minutes
        const widthPct = (duration / MINUTES_PER_QUARTER) * 100;
        const leftPct = ((MINUTES_PER_QUARTER - st.start) / MINUTES_PER_QUARTER) * 100;

        const el = document.createElement("div");
        el.className = "stint";
        el.style.left = `${leftPct}%`;
        el.style.width = `${widthPct}%`;
        el.style.background = p.color || "#1976d2";
        el.textContent = p.name;
        lane.appendChild(el);
      });
    });

    return qDiv;
  }

  // Escape helper (for titles)
  function escapeHtml(s) {
    return (s || "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  }

  // Ensure we have a hidden host node for html2pdf / print
  function ensureHost() {
    let host = document.getElementById("pdf-render-target");
    if (!host) {
      host = document.createElement("div");
      host.id = "pdf-render-target";
      document.body.appendChild(host);
    }
    host.innerHTML = ""; // clear
    // Give it real dimensions so html2canvas captures content
    host.style.cssText = "position:absolute; left:-9999px; top:0; width:1400px; visibility:hidden;";
    return host;
  }

  // --- Exporters ---
  async function exportPdf(quarter = null) {
    const title = (document.getElementById("rotation-name")?.value || "Game Rotation").trim();
    const dateStr = new Date().toLocaleString();

    const host = ensureHost();
    const node = buildPrintNode({ title, dateStr, quarter });
    host.appendChild(node);

    // Wait a tick to allow layout
    await new Promise(r => setTimeout(r, 100));

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${title || "rotation"}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
    };
    return html2pdf().set(opt).from(host).save();
  }

  async function printPage(quarter = null) {
    const title = (document.getElementById("rotation-name")?.value || "Game Rotation").trim();
    const dateStr = new Date().toLocaleString();
    const node = buildPrintNode({ title, dateStr, quarter });

    const win = window.open("", "_blank");
    if (!win) return alert("Pop-up blocked. Please allow pop-ups to print.");
    win.document.open();
    win.document.write(`
      <!doctype html><html><head>
        <title>${escapeHtml(title)}</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        </style>
      </head>
      <body></body></html>
    `);
    win.document.body.appendChild(node);
    win.document.close();
    win.focus();
    // Give it a tick for layout, then print
    setTimeout(() => { win.print(); win.close(); }, 250);
  }

  // --- Wire up buttons ---
  const downloadPdfBtn = document.getElementById("download-pdf-btn");
  const printFullBtn   = document.getElementById("print-full-btn");
  const printQ1Btn     = document.getElementById("print-q1-btn");
  const printQ2Btn     = document.getElementById("print-q2-btn");
  const printQ3Btn     = document.getElementById("print-q3-btn");
  const printQ4Btn     = document.getElementById("print-q4-btn");

  if (downloadPdfBtn) downloadPdfBtn.addEventListener("click", e => { e.preventDefault(); exportPdf(null); });
  if (printFullBtn)   printFullBtn.addEventListener("click",   e => { e.preventDefault(); printPage(null); });
  if (printQ1Btn)     printQ1Btn.addEventListener("click",     e => { e.preventDefault(); printPage("q1"); });
  if (printQ2Btn)     printQ2Btn.addEventListener("click",     e => { e.preventDefault(); printPage("q2"); });
  if (printQ3Btn)     printQ3Btn.addEventListener("click",     e => { e.preventDefault(); printPage("q3"); });
  if (printQ4Btn)     printQ4Btn.addEventListener("click",     e => { e.preventDefault(); printPage("q4"); });
})();

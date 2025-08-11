/* js/export.js
   Clean PDF + Print export for the Rotation Builder, with Analytics Summary.
   Requires html2pdf (loaded before this file) and the following globals:
   - currentRotation: { q1:{PG:[...],...}, q2:..., q3:..., q4:... }
   - currentRoster: [{ id, name, number, color, ppg, rpg, spg }]
   - MINUTES_PER_QUARTER: number
*/

(function () {
  const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
  const QUARTERS = ["q1", "q2", "q3", "q4"];
  const QLABEL = { q1: "Quarter 1", q2: "Quarter 2", q3: "Quarter 3", q4: "Quarter 4" };

  function playerById(id) {
  if (window.playerById) return window.playerById(id);
  // Fallback if common.js didn’t load for any reason
  return (window.currentRoster || []).find(p => p.id === id) || null;
}

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  }

  // --- Compute analytics for export (minutes per player + totals) ---
  function computeAnalytics() {
    const minutes = {};
    currentRoster.forEach(p => (minutes[p.id] = 0));

    for (const q of QUARTERS) {
      const block = currentRotation?.[q] || {};
      for (const pos of POSITIONS) {
        (block[pos] || []).forEach(st => {
          const dur = (Number(st.start) || 0) - (Number(st.end) || 0);
          if (dur > 0 && minutes.hasOwnProperty(st.playerId)) {
            minutes[st.playerId] += dur;
          }
        });
      }
    }

    const rows = Object.keys(minutes)
      .map(pid => {
        const p = playerById(pid);
        return p ? {
          name: p.name,
          number: p.number,
          ppg: Number(p.ppg || 0),
          rpg: Number(p.rpg || 0),
          spg: Number(p.spg || 0),
          mins: minutes[pid]
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.mins - a.mins);

    const totalAllocated = rows.reduce((acc, r) => acc + r.mins, 0);
    const fullGameTotal = 5 * MINUTES_PER_QUARTER * 4;

    return { rows, totalAllocated, fullGameTotal };
  }

  // --- Build a self-contained print node (no app CSS required) ---
  function buildPrintNode({ title, dateStr, quarter = null }) {
    const wrap = document.createElement("div");
    wrap.id = "print-root";
    wrap.style.cssText = `
      font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      color:#111; width:1400px; margin:0 auto; padding:24px 28px; box-sizing:border-box;
    `;

    // Embedded CSS for consistent rendering
    const style = document.createElement("style");
    style.textContent = `
      .print-header{ text-align:center; margin-bottom:16px; }
      .print-header h1{ margin:0 0 6px; font-size:22px; }
      .print-header p{ margin:0; font-size:12px; color:#555; }

      .quarter{ border:1px solid #ddd; border-radius:6px; padding:10px 12px; margin:10px 0 16px; page-break-inside: avoid; background:#fff; }
      .q-title{ font-weight:700; font-size:13px; margin:0 0 8px; text-align:center; }
      .grid{ display:grid; grid-template-columns:60px 1fr; grid-auto-rows:32px; row-gap:8px; column-gap:8px; }
      .ruler{ grid-column:1 / -1; height:20px; margin:0 0 6px; position:relative; }
      .ruler .tick{ position:absolute; top:0; height:100%; width:1px; background:#ccc; }
      .ruler .num{ position:absolute; top:0; transform:translateX(-50%); font-size:10px; color:#666; }

      .label{ display:flex; align-items:center; justify-content:flex-end; padding-right:6px; font-weight:600; color:#555; }
      .track{ position:relative; border:1px solid #eee; background:#fafafa; height:28px; border-radius:4px; overflow:hidden; }
      .stint{ position:absolute; top:0; bottom:0; display:flex; align-items:center; justify-content:center;
              font-size:11px; color:#fff; border-right:1px solid rgba(255,255,255,.6); padding:0 6px; white-space:nowrap; }

      .analytics{ margin-top:20px; border:1px solid #ddd; border-radius:6px; background:#fff; padding:12px 14px; }
      .analytics h3{ margin:0 0 10px; font-size:16px; }
      .analytics .totals{ font-size:13px; margin:0 0 10px; }
      .table{ width:100%; border-collapse:collapse; font-size:12px; }
      .table th,.table td{ border:1px solid #e5e5e5; padding:6px 8px; text-align:left; }
      .table th{ background:#f7f7f7; }
      .right{ text-align:right; }
      @media print { .quarter, .analytics { page-break-inside: avoid; } }
    `;
    wrap.appendChild(style);

    // Header
    const header = document.createElement("div");
    header.className = "print-header";
    header.innerHTML = `<h1>${escapeHtml(title || "Game Rotation")}</h1><p>Generated on: ${dateStr}</p>`;
    wrap.appendChild(header);

    // Quarters (all or single)
    const quartersToRender = quarter ? [quarter] : QUARTERS;
    quartersToRender.forEach(q => wrap.appendChild(renderQuarter(q)));

    // Analytics summary (always include; still useful even for single quarter)
    wrap.appendChild(renderAnalytics());

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
        const duration = (Number(st.start) || 0) - (Number(st.end) || 0);
        if (duration <= 0) return;

        const widthPct = (duration / MINUTES_PER_QUARTER) * 100;
        const leftPct = ((MINUTES_PER_QUARTER - Number(st.start)) / MINUTES_PER_QUARTER) * 100;

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

  function renderAnalytics() {
    const { rows, totalAllocated, fullGameTotal } = computeAnalytics();

    const wrap = document.createElement("div");
    wrap.className = "analytics";

    const h3 = document.createElement("h3");
    h3.textContent = "Analytics Summary";
    wrap.appendChild(h3);

    const totals = document.createElement("div");
    totals.className = "totals";
    totals.innerHTML = `<strong>Total Minutes Allocated:</strong> ${totalAllocated} / ${fullGameTotal}`;
    wrap.appendChild(totals);

    const table = document.createElement("table");
    table.className = "table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Player</th>
          <th class="right">PPG</th>
          <th class="right">RPG</th>
          <th class="right">SPG</th>
          <th class="right">Minutes</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tb = table.querySelector("tbody");

    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(`${r.name}${r.number ? " (#" + r.number + ")" : ""}`)}</td>
        <td class="right">${Number(r.ppg).toFixed(1)}</td>
        <td class="right">${Number(r.rpg).toFixed(1)}</td>
        <td class="right">${Number(r.spg).toFixed(1)}</td>
        <td class="right">${r.mins}</td>
      `;
      tb.appendChild(tr);
    });

    wrap.appendChild(table);
    return wrap;
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

    await new Promise(r => setTimeout(r, 100)); // allow layout

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

// PDF + print (full game and per-quarter variants)
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const printFullBtn = document.getElementById('print-full-btn');
const printQ1Btn = document.getElementById('print-q1-btn');
const printQ2Btn = document.getElementById('print-q2-btn');
const printQ3Btn = document.getElementById('print-q3-btn');
const printQ4Btn = document.getElementById('print-q4-btn');
const pdfRenderTarget = document.getElementById('pdf-render-target');

function buildPdfTable(quarters){
  const rotationName = document.getElementById('rotation-name').value || 'Game Rotation';
  const todaysDate = new Date().toLocaleDateString();

  let html = `
    <div style="text-align:center;margin-bottom:20px;">
      <h1>${rotationName}</h1>
      <p>Generated on: ${todaysDate}</p>
    </div>
    <table class="pdf-table">`;

  // Header
  html += `<tr><th></th>`;
  quarters.forEach((q,i)=> html += `<th colspan="${MINUTES_PER_QUARTER}">Quarter ${i+1}</th>`);
  html += `</tr>`;

  // Minute markers
  html += `<tr><th>POS</th>`;
  quarters.forEach(()=>{
    for(let i=MINUTES_PER_QUARTER;i>=1;i--){ html += `<th>${i}</th>`; }
  });
  html += `</tr>`;

  ['PG','SG','SF','PF','C'].forEach(pos=>{
    html += `<tr><td class="pdf-position-label">${pos}</td>`;
    quarters.forEach(qKey=>{
      const stints = (currentRotation[qKey][pos]||[]);
      const stintBlocks = stints.map(st=>{
        const p = builderRoster.find(x=>x.id===st.playerId);
        if(!p) return '';
        const dur = st.start - st.end;
        const widthPct = (dur / MINUTES_PER_QUARTER) * 100;
        return `<div class="pdf-player-stint" style="width:${widthPct}%;background-color:${p.color};">${p.name}</div>`;
      }).join('');
      html += `<td colspan="${MINUTES_PER_QUARTER}"><div class="pdf-stint-container">${stintBlocks}</div></td>`;
    });
    html += `</tr>`;
  });
  html += `</table>`;
  pdfRenderTarget.innerHTML = html;
}

downloadPdfBtn.addEventListener('click', ()=>{
  buildPdfTable(['q1','q2','q3','q4']);
  setTimeout(()=>{
    const opt = { margin:0.5, filename: (document.getElementById('rotation-name').value||'Game Rotation')+'.pdf',
      jsPDF:{unit:'in', format:'letter', orientation:'landscape'} };
    html2pdf().from(pdfRenderTarget).set(opt).save();
  }, 100);
});

function printQuarter(qKey, label){
  buildPdfTable([qKey]);
  setTimeout(()=>{ window.print(); }, 100);
}

printFullBtn.addEventListener('click', ()=>{ buildPdfTable(['q1','q2','q3','q4']); setTimeout(()=>window.print(),100); });
printQ1Btn.addEventListener('click', ()=> printQuarter('q1','Q1'));
printQ2Btn.addEventListener('click', ()=> printQuarter('q2','Q2'));
printQ3Btn.addEventListener('click', ()=> printQuarter('q3','Q3'));
printQ4Btn.addEventListener('click', ()=> printQuarter('q4','Q4'));

// Minutes + simple live lineup sum (latest stint per position in Q1 as a baseline)
const minutesList = document.getElementById('minutes-list');
const liveStatsList = document.getElementById('live-stats-list');
const totalMinutesDisplay = document.getElementById('total-minutes-display');

function updateAnalytics(){
  if(!builderRoster || !currentRotation) return;
  const mins = {}; builderRoster.forEach(p=> mins[p.id]=0);
  for(const q in currentRotation){
    for(const pos in currentRotation[q]){
      currentRotation[q][pos].forEach(st=>{
        const d = st.start - st.end;
        mins[st.playerId] += d;
      });
    }
  }
  minutesList.innerHTML='';
  Object.entries(mins).sort((a,b)=> b[1]-a[1]).forEach(([pid,m])=>{
    if(m>0){
      const p = builderRoster.find(x=>x.id===pid);
      if(p){
        const li = document.createElement('li');
        li.textContent = `${p.name}: ${m} mins`;
        minutesList.appendChild(li);
      }
    }
  });
  let total = Object.values(mins).reduce((a,b)=>a+b,0);
  const full = 5*MINUTES_PER_QUARTER*4;
  totalMinutesDisplay.innerHTML = `<strong>Total Minutes Allocated: ${total} / ${full}</strong>`;
  totalMinutesDisplay.style.color = (total===full) ? 'green' : 'black';

  // Simple live lineup: take max-start (latest) stint in each position for Q1
  const q = 'q1';
  let pids = [];
  ['PG','SG','SF','PF','C'].forEach(pos=>{
    const st = (currentRotation[q][pos]||[]).slice().sort((a,b)=> b.start-a.start)[0];
    if(st) pids.push(st.playerId);
  });
  const sums = { ppg:0, rpg:0, spg:0 };
  pids.forEach(pid=>{
    const p = builderRoster.find(x=>x.id===pid);
    if(p){ sums.ppg+=Number(p.ppg||0); sums.rpg+=Number(p.rpg||0); sums.spg+=Number(p.spg||0); }
  });
  liveStatsList.innerHTML = `
    <li>PPG: ${sums.ppg.toFixed(1)}</li>
    <li>RPG: ${sums.rpg.toFixed(1)}</li>
    <li>SPG: ${sums.spg.toFixed(1)}</li>`;
}

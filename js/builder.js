// Rotation builder (drag-drop + stints + save/load)
let builderRoster = [];
let currentRotation = {};
let currentRotationId = null;
let builderUser = null;

const playerPool = document.getElementById('player-pool');
const rotationBoard = document.getElementById('rotation-board');
const saveRotationBtn = document.getElementById('save-rotation-btn');
const rotationNameInput = document.getElementById('rotation-name');

// Modal
const stintModal = document.getElementById('stint-modal');
const stintForm = document.getElementById('stint-form');
const cancelStintBtn = document.getElementById('cancel-stint-btn');
const deleteStintBtn = document.getElementById('delete-stint-btn');

function initBuilderPage(){
  auth.onAuthStateChanged(async (user)=>{
    if(!user) return;
    builderUser = user;
    await loadRosterForBuilder();
    builderRoster = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    window.currentRoster = builderRoster;  // <-- add this line
    populatePlayerPool();
    newRotation();
    initializeRotationBuilder();
    renderRotation();
    updateAnalytics();
    // If hash has an id, load rotation
    const rotId = (location.hash||'').replace('#','').trim();
    if(rotId){ await loadRotationById(rotId); }
  });
}

function newRotation(){
  currentRotationId = null;
  rotationNameInput.value = '';
  currentRotation = {
    q1:{PG:[],SG:[],SF:[],PF:[],C:[]},
    q2:{PG:[],SG:[],SF:[],PF:[],C:[]},
    q3:{PG:[],SG:[],SF:[],PF:[],C:[]},
    q4:{PG:[],SG:[],SF:[],PF:[],C:[]},
  };
}

async function loadRosterForBuilder(){
  const col = db.collection('users').doc(auth.currentUser.uid).collection('roster');
  const snap = await col.get();
  builderRoster = snap.docs.map(d=>({id:d.id, ...d.data()}));
  populatePlayerPool();
}

function populatePlayerPool(){
  playerPool.innerHTML = '';
  builderRoster.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'player-item';
    div.draggable = true;
    div.dataset.playerId = p.id;
    div.textContent = `${p.name} (#${p.number})`;
    div.style.backgroundColor = p.color;
    div.style.color = '#fff';
    const tip = document.createElement('span');
    tip.className = 'tooltip';
    tip.innerHTML = `Pos: ${p.position}<br>PPG: ${p.ppg}<br>RPG: ${p.rpg}<br>SPG: ${p.spg}`;
    div.appendChild(tip);
    div.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', p.id));
    playerPool.appendChild(div);
  });
}

function initializeRotationBuilder(){
  rotationBoard.innerHTML='';
  ['q1','q2','q3','q4'].forEach((q,idx)=>{
    const col = document.createElement('div');
    col.className='quarter-column';
    col.id=q;
    col.innerHTML = `<div class="quarter-title">Quarter ${idx+1}</div>`;
    const ruler = document.createElement('div');
    ruler.className='minute-ruler';
    for(let i=MINUTES_PER_QUARTER;i>=1;i--){
      const m=document.createElement('div'); m.className='minute-marker'; m.textContent=i; ruler.appendChild(m);
    }
    col.appendChild(ruler);
    ['PG','SG','SF','PF','C'].forEach(pos=>{
      const slot = document.createElement('div');
      slot.className='position-slot';
      slot.dataset.quarter=q; slot.dataset.position=pos;
      slot.innerHTML = `<span class="position-label">${pos}</span>`;
      slot.addEventListener('dragover', e=>{ e.preventDefault(); slot.classList.add('drag-over'); });
      slot.addEventListener('dragleave', ()=> slot.classList.remove('drag-over'));
      slot.addEventListener('drop', handleDrop);
      col.appendChild(slot);
    });
    rotationBoard.appendChild(col);
  });
}

function handleDrop(e){
  e.preventDefault();
  const slot = e.target.closest('.position-slot');
  if(!slot) return;
  slot.classList.remove('drag-over');
  const playerId = e.dataTransfer.getData('text/plain');
  openStintModal(slot.dataset.quarter, slot.dataset.position, playerId, null);
}

function openStintModal(quarter, position, playerId, stint){
  stintForm.reset();
  $('#stint-quarter').value = quarter;
  $('#stint-position').value = position;
  $('#stint-id').value = stint? stint.id : '';
  $('#stint-player-id').value = playerId;
  $('#stint-in-time').value = stint? stint.start : '';
  $('#stint-out-time').value = stint? stint.end : '';
  deleteStintBtn.style.display = stint? 'inline-block' : 'none';
  stintModal.style.display='flex';
}

cancelStintBtn.addEventListener('click', ()=> stintModal.style.display='none');

stintForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const q = $('#stint-quarter').value;
  const pos = $('#stint-position').value;
  const id = $('#stint-id').value || ('st_'+Date.now());
  const playerId = $('#stint-player-id').value;
  const start = parseInt($('#stint-in-time').value,10);
  const end = parseInt($('#stint-out-time').value,10);
  if(isNaN(start)||isNaN(end)||start<0||end<0||start>10||end>10||end>start){
    alert('Use whole minutes 0–10. "Out" must be <= "In".'); return;
  }
  const arr = currentRotation[q][pos];
  const idx = arr.findIndex(s=>s.id===id);
  const data = {id, playerId, start, end};
  if(idx>=0) arr[idx]=data; else arr.push(data);
  stintModal.style.display='none';
  renderRotation();
  updateAnalytics();
});

deleteStintBtn.addEventListener('click', ()=>{
  const q = $('#stint-quarter').value;
  const pos = $('#stint-position').value;
  const id = $('#stint-id').value;
  const arr = currentRotation[q][pos];
  const idx = arr.findIndex(s=>s.id===id);
  if(idx>=0) arr.splice(idx,1);
  stintModal.style.display='none';
  renderRotation();
  updateAnalytics();
});

function renderRotation(){
  rotationBoard.querySelectorAll('.position-slot').forEach(slot=>{
    slot.innerHTML = `<span class="position-label">${slot.dataset.position}</span>`;
  });
  for(const quarter in currentRotation){
    for(const position in currentRotation[quarter]){
      const stints = currentRotation[quarter][position];
      const slot = document.querySelector(`.position-slot[data-quarter="${quarter}"][data-position="${position}"]`);
      if(stints && slot){
        stints.sort((a,b)=> b.start - a.start);
        stints.forEach(st=>{
          const p = builderRoster.find(x=>x.id===st.playerId);
          if(!p) return;
          const div = document.createElement('div');
          div.className='player-stint';
          div.textContent = p.name;
          div.style.backgroundColor = p.color;
          const duration = st.start - st.end;
          const widthPct = (duration / MINUTES_PER_QUARTER) * 100;
          div.style.width = widthPct + '%';
          div.dataset.stintId = st.id;
          div.addEventListener('click', ()=> openStintModal(quarter, position, st.playerId, st));
          slot.appendChild(div);
        });
      }
    }
  }
}

// Save/Load
saveRotationBtn.addEventListener('click', async ()=>{
  const name = rotationNameInput.value.trim();
  if(!name) return alert('Please enter a rotation name.');
  const rotationData = { name, rotation: currentRotation, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
  const col = db.collection('users').doc(builderUser.uid).collection('rotations');
  if(currentRotationId){
    await col.doc(currentRotationId).update(rotationData);
    alert('Rotation updated.');
  }else{
    const ref = await col.add(rotationData);
    currentRotationId = ref.id;
    alert('Rotation saved.');
  }
});

async function loadRotationById(id){
  const ref = db.collection('users').doc(builderUser.uid).collection('rotations').doc(id);
  const doc = await ref.get();
  if(doc.exists){
    const data = doc.data();
    currentRotation = data.rotation || currentRotation;
    currentRotationId = id;
    rotationNameInput.value = data.name || '';
    initializeRotationBuilder();
    renderRotation();
    updateAnalytics();
  }
}

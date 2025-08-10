// Roster CRUD
const playerForm = document.getElementById('player-form');
const playerIdInput = document.getElementById('player-id');
const playerNameInput = document.getElementById('player-name');
const playerPositionInput = document.getElementById('player-position');
const playerNumberInput = document.getElementById('player-number');
const playerPpgInput = document.getElementById('player-ppg');
const playerRpgInput = document.getElementById('player-rpg');
const playerSpgInput = document.getElementById('player-spg');
const playerColorInput = document.getElementById('player-color');
const rosterTableBody = document.getElementById('roster-table-body');
const clearFormBtn = document.getElementById('clear-form-btn');

let currentRoster = [];
let currentUser = null;

function fetchRoster(){
  auth.onAuthStateChanged(async (user)=>{
    if(!user) return;
    currentUser = user;
    const col = db.collection('users').doc(user.uid).collection('roster');
    col.onSnapshot(snap=>{
      currentRoster = [];
      rosterTableBody.innerHTML = '';
      snap.forEach(doc=>{
        const p = {id: doc.id, ...doc.data()};
        currentRoster.push(p);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${p.name}</td>
          <td>${p.position}</td>
          <td>${p.number}</td>
          <td><div class="roster-color-swatch" style="background-color:${p.color||'#ccc'};"></div></td>
          <td>${p.ppg}</td>
          <td>${p.rpg}</td>
          <td>${p.spg}</td>
          <td>
            <button class="action-btn edit-btn" data-id="${p.id}">✏️</button>
            <button class="action-btn delete-btn" data-id="${p.id}">🗑️</button>
          </td>`;
        rosterTableBody.appendChild(tr);
      });
    });
  });
}

playerForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!currentUser) return;
  const data = {
    name: playerNameInput.value,
    position: playerPositionInput.value,
    number: parseInt(playerNumberInput.value),
    ppg: parseFloat(playerPpgInput.value),
    rpg: parseFloat(playerRpgInput.value),
    spg: parseFloat(playerSpgInput.value),
    color: playerColorInput.value
  };
  const col = db.collection('users').doc(currentUser.uid).collection('roster');
  const id = playerIdInput.value;
  if(id){ await col.doc(id).update(data); } else { await col.add(data); }
  playerForm.reset(); playerIdInput.value='';
});

clearFormBtn.addEventListener('click', ()=>{ playerForm.reset(); playerIdInput.value=''; });

rosterTableBody.addEventListener('click', (e)=>{
  const id = e.target.dataset.id;
  if(!id) return;
  if(e.target.classList.contains('delete-btn')){
    if(confirm('Delete this player?')){
      db.collection('users').doc(currentUser.uid).collection('roster').doc(id).delete();
    }
  }
  if(e.target.classList.contains('edit-btn')){
    const p = currentRoster.find(x=>x.id===id);
    if(p){
      playerIdInput.value = p.id;
      playerNameInput.value = p.name;
      playerPositionInput.value = p.position;
      playerNumberInput.value = p.number;
      playerPpgInput.value = p.ppg;
      playerRpgInput.value = p.rpg;
      playerSpgInput.value = p.spg;
      playerColorInput.value = p.color || '#1976d2';
    }
  }
});
